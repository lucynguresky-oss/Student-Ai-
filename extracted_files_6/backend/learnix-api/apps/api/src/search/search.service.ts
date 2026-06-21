import { Injectable } from '@nestjs/common';
import { ModerationStatus, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SafetyService } from '../safety/safety.service';

type SearchType = 'all' | 'users' | 'hashtags' | 'posts';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safety: SafetyService,
  ) {}

  async search(viewerId: string | undefined, raw: string, type: SearchType = 'all') {
    const q = raw.trim();
    if (q.length < 1) return { users: [], hashtags: [], posts: [] };

    const blocked = viewerId
      ? await this.safety.blockedAndBlockerIds(viewerId)
      : [];

    const [users, hashtags, posts] = await Promise.all([
      type === 'all' || type === 'users' ? this.users(q, blocked) : [],
      type === 'all' || type === 'hashtags' ? this.hashtags(q) : [],
      type === 'all' || type === 'posts' ? this.posts(q, blocked) : [],
    ]);

    return { users, hashtags, posts };
  }

  private users(q: string, blocked: string[]) {
    // strip a leading @ so "@amina" and "amina" both work
    const term = q.replace(/^@/, '');
    return this.prisma.user.findMany({
      where: {
        id: blocked.length ? { notIn: blocked } : undefined,
        OR: [
          { username: { contains: term, mode: 'insensitive' } },
          { displayName: { contains: term, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ isVerified: 'desc' }, { username: 'asc' }],
      take: 12,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
        _count: { select: { followers: true } },
      },
    });
  }

  private async hashtags(q: string) {
    const term = q.replace(/^#/, '').toLowerCase();
    const rows = await this.prisma.hashtag.findMany({
      where: { tag: { contains: term } },
      take: 12,
      include: { _count: { select: { posts: true } } },
    });
    return rows
      .map((h) => ({ id: h.id, tag: h.tag, postCount: h._count.posts }))
      .sort((a, b) => b.postCount - a.postCount);
  }

  private posts(q: string, blocked: string[]) {
    return this.prisma.post.findMany({
      where: {
        visibility: Visibility.PUBLIC,
        moderationStatus: ModerationStatus.APPROVED,
        caption: { contains: q, mode: 'insensitive' },
        ...(blocked.length ? { authorId: { notIn: blocked } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 18,
      select: {
        id: true,
        caption: true,
        likeCount: true,
        commentCount: true,
        author: { select: { id: true, username: true, avatarUrl: true } },
        media: {
          take: 1,
          orderBy: { position: 'asc' },
          select: { thumbnailUrl: true, url: true },
        },
      },
    });
  }
}
