import { Injectable } from '@nestjs/common';
import { ModerationStatus, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CursorPaginationDto, Page } from '../common/dto/pagination.dto';

/** Lightweight search across users, hashtags, and posts (Postgres ILIKE).
 *  Wire Meilisearch here later when the search volume demands it — the
 *  service interface stays identical.
 */
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Unified search: returns users, hashtags, and posts that match the query.
   * `type` narrows to a single kind; defaults to 'all'.
   */
  async search(
    q: string,
    type: 'users' | 'hashtags' | 'posts' | 'all' = 'all',
    viewerId?: string,
  ) {
    const term = q.trim();
    if (!term) return { users: [], hashtags: [], posts: [] };

    const [users, hashtags, posts] = await Promise.all([
      type === 'hashtags' || type === 'posts'
        ? Promise.resolve([])
        : this.prisma.user.findMany({
            where: {
              OR: [
                { username: { contains: term, mode: 'insensitive' } },
                { displayName: { contains: term, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
              role: true,
              _count: { select: { followers: true } },
            },
            orderBy: { followers: { _count: 'desc' } },
            take: 10,
          }),

      type === 'users' || type === 'posts'
        ? Promise.resolve([])
        : this.prisma.hashtag.findMany({
            where: {
              tag: {
                contains: term.replace(/^#/, ''),
                mode: 'insensitive',
              },
            },
            select: {
              id: true,
              tag: true,
              _count: { select: { posts: true } },
            },
            orderBy: { posts: { _count: 'desc' } },
            take: 10,
          }),

      type === 'users' || type === 'hashtags'
        ? Promise.resolve([])
        : this.prisma.post.findMany({
            where: {
              visibility: Visibility.PUBLIC,
              moderationStatus: ModerationStatus.APPROVED,
              caption: { contains: term, mode: 'insensitive' },
            },
            select: {
              id: true,
              caption: true,
              type: true,
              likeCount: true,
              commentCount: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  isVerified: true,
                },
              },
              media: {
                take: 1,
                orderBy: { position: 'asc' },
                select: { url: true, thumbnailUrl: true, type: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          }),
    ]);

    void viewerId;

    return { users, hashtags, posts };
  }

  /**
   * XP leaderboard — ranked by total XP.
   * Optionally filtered to users who have posts on a given subject.
   */
  async leaderboard(
    limit = 20,
    subjectId?: string,
  ): Promise<{ rank: number; user: object; xp: number }[]> {
    const where = subjectId
      ? {
          posts: {
            some: {
              subjectId,
              moderationStatus: ModerationStatus.APPROVED,
            },
          },
        }
      : {};

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
        role: true,
        xp: true,
        streakCount: true,
      },
      orderBy: { xp: 'desc' },
      take: limit,
    });

    return users.map((u, i) => ({ rank: i + 1, user: u, xp: u.xp }));
  }

  /**
   * Paginated list of posts in a specific subject — used by the curriculum
   * subject-detail screen.
   */
  async postsBySubject(
    subjectId: string,
    q: CursorPaginationDto,
    viewerId?: string,
  ): Promise<Page<unknown>> {
    const rows = await this.prisma.post.findMany({
      where: {
        subjectId,
        visibility: Visibility.PUBLIC,
        moderationStatus: ModerationStatus.APPROVED,
      },
      select: {
        id: true,
        caption: true,
        type: true,
        likeCount: true,
        commentCount: true,
        saveCount: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        media: {
          take: 1,
          orderBy: { position: 'asc' },
          select: { url: true, thumbnailUrl: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });

    void viewerId;
    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;
    return {
      items: slice,
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }
}
