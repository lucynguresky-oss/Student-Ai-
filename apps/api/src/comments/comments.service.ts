import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { XpService } from '../common/xp.service';
import { CursorPaginationDto, Page } from '../common/dto/pagination.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xp: XpService,
  ) {}

  async create(postId: string, authorId: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    let replyToAuthorId: string | null = null;
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { postId: true, authorId: true },
      });
      if (!parent || parent.postId !== postId) {
        throw new BadRequestException('Invalid parent comment');
      }
      replyToAuthorId = parent.authorId;
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          postId,
          authorId,
          body: dto.body,
          parentId: dto.parentId,
        },
        include: { author: this.authorSelect() },
      });
      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });
      return created;
    });

    // notify the post author (for comments) or parent author (for replies)
    const notifyUserId = dto.parentId ? replyToAuthorId : post.authorId;
    if (notifyUserId && notifyUserId !== authorId) {
      await this.prisma.notification.create({
        data: {
          userId: notifyUserId,
          actorId: authorId,
          type: dto.parentId
            ? NotificationType.REPLY
            : NotificationType.COMMENT,
          postId,
          commentId: comment.id,
        },
      });
    }

    // Award XP to the commenter (fire-and-forget — never blocks the response)
    void this.xp.awardCommentXP(authorId);

    return { ...comment, replyCount: 0, viewer: { liked: false } };
  }

  /** Top-level comments for a post, newest first, with reply counts. */
  async list(
    postId: string,
    viewerId: string | undefined,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const rows = await this.prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        author: this.authorSelect(),
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    return this.paginate(rows, q.limit, viewerId);
  }

  /** Replies under a single comment. */
  async listReplies(
    commentId: string,
    viewerId: string | undefined,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const rows = await this.prisma.comment.findMany({
      where: { parentId: commentId },
      include: {
        author: this.authorSelect(),
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    return this.paginate(rows, q.limit, viewerId);
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, postId: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.prisma.$transaction([
      this.prisma.comment.delete({ where: { id: commentId } }),
      this.prisma.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      }),
    ]);
    return { deleted: true };
  }

  async like(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const existing = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.commentLike.create({ data: { userId, commentId } }),
        this.prisma.comment.update({
          where: { id: commentId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
    }
    return this.likeState(commentId, userId);
  }

  async unlike(commentId: string, userId: string) {
    const deleted = await this.prisma.commentLike.deleteMany({
      where: { userId, commentId },
    });
    if (deleted.count > 0) {
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } },
      });
    }
    return this.likeState(commentId, userId);
  }

  // ---- helpers ----

  private async paginate<T extends { id: string }>(
    rows: T[],
    limit: number,
    viewerId?: string,
  ): Promise<Page<unknown>> {
    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;

    let likedSet = new Set<string>();
    if (viewerId && slice.length) {
      const likes = await this.prisma.commentLike.findMany({
        where: { userId: viewerId, commentId: { in: slice.map((c) => c.id) } },
        select: { commentId: true },
      });
      likedSet = new Set(likes.map((l) => l.commentId));
    }

    const items = slice.map((c) => {
      const withCount = c as T & { _count?: { replies: number } };
      return {
        ...c,
        replyCount: withCount._count?.replies ?? 0,
        viewer: { liked: likedSet.has(c.id) },
      };
    });

    return { items, nextCursor: hasMore ? slice[slice.length - 1].id : null };
  }

  private async likeState(commentId: string, userId: string) {
    const [comment, liked] = await Promise.all([
      this.prisma.comment.findUnique({
        where: { id: commentId },
        select: { likeCount: true },
      }),
      this.prisma.commentLike.findUnique({
        where: { userId_commentId: { userId, commentId } },
        select: { commentId: true },
      }),
    ]);
    return { liked: !!liked, likeCount: comment?.likeCount ?? 0 };
  }

  private authorSelect() {
    return {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
      },
    };
  }
}
