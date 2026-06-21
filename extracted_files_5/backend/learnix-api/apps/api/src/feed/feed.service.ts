import { Injectable } from '@nestjs/common';
import {
  FollowStatus,
  ModerationStatus,
  PostType,
  Visibility,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PostsService } from '../posts/posts.service';
import { SafetyService } from '../safety/safety.service';
import { CursorPaginationDto, Page } from '../common/dto/pagination.dto';

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posts: PostsService,
    private readonly safety: SafetyService,
  ) {}

  /**
   * Home feed: posts from accounts the viewer follows (+ their own),
   * newest first, keyset/cursor paginated for stable infinite scroll.
   */
  async home(viewerId: string, q: CursorPaginationDto): Promise<Page<unknown>> {
    const following = await this.prisma.follow.findMany({
      where: { followerId: viewerId, status: FollowStatus.ACCEPTED },
      select: { followingId: true },
    });
    const blocked = await this.safety.blockedAndBlockerIds(viewerId);
    const authorIds = [...following.map((f) => f.followingId), viewerId].filter(
      (id) => !blocked.includes(id),
    );

    const rows = await this.prisma.post.findMany({
      where: {
        authorId: { in: authorIds },
        moderationStatus: ModerationStatus.APPROVED,
      },
      include: this.posts.postInclude(),
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1, // fetch one extra to detect the next page
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });

    return this.paginate(rows, q.limit, viewerId);
  }

  /**
   * Explore: public posts the viewer does NOT already follow, ranked by a
   * time-decayed engagement score (a lightweight, transparent ranker).
   */
  async explore(viewerId: string | undefined, limit = 30) {
    const following = viewerId
      ? await this.prisma.follow.findMany({
          where: { followerId: viewerId },
          select: { followingId: true },
        })
      : [];
    const excludeIds = [...following.map((f) => f.followingId)];
    if (viewerId) {
      excludeIds.push(viewerId);
      excludeIds.push(...(await this.safety.blockedAndBlockerIds(viewerId)));
    }

    const since = new Date(Date.now() - 14 * 86_400_000); // last 14 days
    const candidates = await this.prisma.post.findMany({
      where: {
        visibility: Visibility.PUBLIC,
        moderationStatus: ModerationStatus.APPROVED,
        createdAt: { gte: since },
        ...(excludeIds.length ? { authorId: { notIn: excludeIds } } : {}),
      },
      include: this.posts.postInclude(),
      orderBy: { createdAt: 'desc' },
      take: 300, // candidate pool, then rank in memory
    });

    const ranked = candidates
      .map((p) => ({ post: p, score: rankScore(p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.post);

    const items = await Promise.all(
      ranked.map((p) => this.posts.decorate(p, viewerId)),
    );
    return { items };
  }

  /** A user's own grid of posts (profile screen), cursor paginated. */
  async byUser(
    username: string,
    viewerId: string | undefined,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) return { items: [], nextCursor: null };

    const rows = await this.prisma.post.findMany({
      where: {
        authorId: user.id,
        moderationStatus: ModerationStatus.APPROVED,
      },
      include: this.posts.postInclude(),
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    return this.paginate(rows, q.limit, viewerId);
  }

  /** Posts a user has been @mentioned/tagged in. */
  async taggedPosts(
    username: string,
    viewerId: string | undefined,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) return { items: [], nextCursor: null };
    const blocked = viewerId
      ? await this.safety.blockedAndBlockerIds(viewerId)
      : [];
    const rows = await this.prisma.post.findMany({
      where: {
        moderationStatus: ModerationStatus.APPROVED,
        visibility: Visibility.PUBLIC,
        mentions: { some: { mentionedUserId: user.id } },
        ...(blocked.length ? { authorId: { notIn: blocked } } : {}),
      },
      include: this.posts.postInclude(),
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    return this.paginate(rows, q.limit, viewerId);
  }

  /** All public posts under a hashtag. */
  async byHashtag(
    tag: string,
    viewerId: string | undefined,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const rows = await this.prisma.post.findMany({
      where: {
        visibility: Visibility.PUBLIC,
        moderationStatus: ModerationStatus.APPROVED,
        hashtags: { some: { hashtag: { tag: tag.toLowerCase() } } },
      },
      include: this.posts.postInclude(),
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    return this.paginate(rows, q.limit, viewerId);
  }

  /** Reels: a vertical feed of short videos (REEL/VIDEO posts), block-aware. */
  async reels(
    viewerId: string | undefined,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const blocked = viewerId
      ? await this.safety.blockedAndBlockerIds(viewerId)
      : [];
    const rows = await this.prisma.post.findMany({
      where: {
        visibility: Visibility.PUBLIC,
        moderationStatus: ModerationStatus.APPROVED,
        type: { in: [PostType.REEL, PostType.VIDEO] },
        ...(blocked.length ? { authorId: { notIn: blocked } } : {}),
      },
      include: this.posts.postInclude(),
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    return this.paginate(rows, q.limit, viewerId);
  }

  // ---- helpers ----

  private async paginate<T extends { id: string }>(
    rows: T[],
    limit: number,
    viewerId?: string,
  ): Promise<Page<unknown>> {
    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    const items = await Promise.all(
      slice.map((p) => this.posts.decorate(p, viewerId)),
    );
    return {
      items,
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }
}

/**
 * Transparent ranking: engagement weighted, then decayed by age.
 * score = (likes + 2*comments + 1.5*saves + log views) / (hours + 2)^1.5
 */
function rankScore(p: {
  likeCount: number;
  commentCount: number;
  saveCount: number;
  viewCount: number;
  createdAt: Date;
}): number {
  const engagement =
    p.likeCount +
    2 * p.commentCount +
    1.5 * p.saveCount +
    Math.log10(p.viewCount + 1);
  const ageHours = (Date.now() - p.createdAt.getTime()) / 3_600_000;
  return engagement / Math.pow(ageHours + 2, 1.5);
}
