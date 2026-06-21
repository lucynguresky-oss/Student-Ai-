import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModerationStatus, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { XpService } from '../common/xp.service';
import { extractMentions } from '../common/text.util';
import { CreatePostDto } from './dto/create-post.dto';

const XP_PER_POST = 10;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ModerationService,
    private readonly xp: XpService,
  ) {}

  async create(authorId: string, dto: CreatePostDto) {
    const tags = extractHashtags(dto.caption ?? '');

    const post = await this.prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          authorId,
          type: dto.type,
          caption: dto.caption,
          visibility: dto.visibility ?? 'PUBLIC',
          subjectId: dto.subjectId,
          media: {
            create: dto.media.map((m, i) => ({
              type: m.type,
              url: m.url,
              thumbnailUrl: m.thumbnailUrl,
              blurhash: m.blurhash,
              width: m.width,
              height: m.height,
              durationSec: m.durationSec,
              position: i,
            })),
          },
        },
      });

      // upsert hashtags and link them
      for (const tag of tags) {
        const hashtag = await tx.hashtag.upsert({
          where: { tag },
          create: { tag },
          update: {},
        });
        await tx.postHashtag.create({
          data: { postId: created.id, hashtagId: hashtag.id },
        });
      }

      // reward content creation (Duolingo-style XP loop)
      await tx.user.update({
        where: { id: authorId },
        data: { xp: { increment: XP_PER_POST } },
      });

      return created;
    });

    // Fire-and-forget XP + streak update
    void this.xp.awardPostXP(authorId);

    // AI screen for educational value: approves, flags for review, or removes
    // (and warns the author). Runs inline so the response reflects the verdict.
    const status = await this.moderation.screenPost(post.id);
    if (status !== ModerationStatus.REMOVED) {
      await this.processMentions(post.id, authorId, dto.caption ?? '');
    }

    return this.findOne(post.id, authorId);
  }

  /** Resolve @mentions in a caption → tag rows + notifications. */
  private async processMentions(
    postId: string,
    authorId: string,
    caption: string,
  ): Promise<void> {
    const usernames = extractMentions(caption);
    if (!usernames.length) return;
    const users = await this.prisma.user.findMany({
      where: { username: { in: usernames }, NOT: { id: authorId } },
      select: { id: true },
    });
    if (!users.length) return;
    await this.prisma.$transaction([
      ...users.map((u) =>
        this.prisma.postMention.upsert({
          where: {
            postId_mentionedUserId: { postId, mentionedUserId: u.id },
          },
          create: { postId, mentionedUserId: u.id },
          update: {},
        }),
      ),
      ...users.map((u) =>
        this.prisma.notification.create({
          data: {
            userId: u.id,
            actorId: authorId,
            type: NotificationType.MENTION,
            postId,
          },
        }),
      ),
    ]);
  }

  async findOne(postId: string, viewerId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: this.postInclude(),
    });
    if (!post) throw new NotFoundException('Post not found');
    return this.decorate(post, viewerId);
  }

  async remove(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.prisma.post.delete({ where: { id: postId } });
    return { deleted: true };
  }

  /** Users who liked a post (Instagram shows this list). */
  async likers(postId: string, q: { cursor?: string; limit: number }) {
    const rows = await this.prisma.like.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor
        ? { cursor: { userId_postId: { userId: q.cursor, postId } }, skip: 1 }
        : {}),
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });
    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;
    return {
      items: slice.map((r) => r.user),
      nextCursor: hasMore ? slice[slice.length - 1].userId : null,
    };
  }

  /** Edit a post's caption — re-syncs hashtags, re-screens, re-processes mentions. */
  async editCaption(postId: string, userId: string, caption: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const tags = extractHashtags(caption);
    await this.prisma.$transaction(async (tx) => {
      await tx.post.update({ where: { id: postId }, data: { caption } });
      await tx.postHashtag.deleteMany({ where: { postId } });
      for (const tag of tags) {
        const hashtag = await tx.hashtag.upsert({
          where: { tag },
          create: { tag },
          update: {},
        });
        await tx.postHashtag.create({
          data: { postId, hashtagId: hashtag.id },
        });
      }
    });

    const status = await this.moderation.screenPost(postId);
    if (status !== ModerationStatus.REMOVED) {
      await this.processMentions(postId, userId, caption);
    }
    return this.findOne(postId, userId);
  }

  /** Count a view (used by feed/reels/post open). */
  async registerView(postId: string) {
    await this.prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });
    return { ok: true };
  }

  async like(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    try {
      await this.prisma.$transaction([
        this.prisma.like.create({ data: { postId, userId } }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
      if (post.authorId !== userId) {
        await this.prisma.notification.create({
          data: {
            userId: post.authorId,
            actorId: userId,
            type: NotificationType.LIKE,
            postId,
          },
        });
        // Award XP to the author for receiving a like
        void this.xp.awardLikeReceivedXP(post.authorId);
      }
    } catch (e) {
      // unique violation => already liked, make it idempotent
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return this.likeState(postId, userId);
      }
      throw e;
    }
    return this.likeState(postId, userId);
  }

  async unlike(postId: string, userId: string) {
    const deleted = await this.prisma.like.deleteMany({
      where: { postId, userId },
    });
    if (deleted.count > 0) {
      await this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      });
    }
    return this.likeState(postId, userId);
  }

  async save(postId: string, userId: string, collectionId?: string) {
    await this.prisma.bookmark.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId, collectionId },
      update: { collectionId },
    });
    await this.syncSaveCount(postId);
    return { saved: true };
  }

  async unsave(postId: string, userId: string) {
    await this.prisma.bookmark.deleteMany({ where: { userId, postId } });
    await this.syncSaveCount(postId);
    return { saved: false };
  }

  // ---- shared shaping (also reused by the feed module) ----

  postInclude(): Prisma.PostInclude {
    return {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isVerified: true,
        },
      },
      media: { orderBy: { position: 'asc' } },
      subject: { select: { id: true, nameEn: true } },
    };
  }

  async decorate<T extends { id: string }>(post: T, viewerId?: string) {
    if (!viewerId) return { ...post, viewer: { liked: false, saved: false } };
    const [liked, saved] = await Promise.all([
      this.prisma.like.findUnique({
        where: { userId_postId: { userId: viewerId, postId: post.id } },
        select: { postId: true },
      }),
      this.prisma.bookmark.findUnique({
        where: { userId_postId: { userId: viewerId, postId: post.id } },
        select: { postId: true },
      }),
    ]);
    return { ...post, viewer: { liked: !!liked, saved: !!saved } };
  }

  private async likeState(postId: string, userId: string) {
    const [post, liked] = await Promise.all([
      this.prisma.post.findUnique({
        where: { id: postId },
        select: { likeCount: true },
      }),
      this.prisma.like.findUnique({
        where: { userId_postId: { userId, postId } },
        select: { postId: true },
      }),
    ]);
    return { liked: !!liked, likeCount: post?.likeCount ?? 0 };
  }

  private async syncSaveCount(postId: string) {
    const count = await this.prisma.bookmark.count({ where: { postId } });
    await this.prisma.post.update({
      where: { id: postId },
      data: { saveCount: count },
    });
  }
}

/** Pull #hashtags out of caption text, normalised to lowercase, deduped. */
function extractHashtags(text: string): string[] {
  const matches = text.match(/#([\p{L}\p{N}_]+)/gu) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}
