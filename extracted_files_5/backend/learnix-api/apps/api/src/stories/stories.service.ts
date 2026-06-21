import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FollowStatus, MediaType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SafetyService } from '../safety/safety.service';

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

export interface CreateStoryInput {
  type?: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  blurhash?: string;
  durationSec?: number;
  caption?: string;
}

@Injectable()
export class StoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safety: SafetyService,
  ) {}

  async create(authorId: string, input: CreateStoryInput) {
    return this.prisma.story.create({
      data: {
        authorId,
        type: input.type ?? MediaType.IMAGE,
        mediaUrl: input.mediaUrl,
        thumbnailUrl: input.thumbnailUrl,
        blurhash: input.blurhash,
        durationSec: input.durationSec,
        caption: input.caption,
        expiresAt: new Date(Date.now() + STORY_TTL_MS),
      },
    });
  }

  /** Story tray: active stories from people you follow (+ your own), grouped by author. */
  async tray(viewerId: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: viewerId, status: FollowStatus.ACCEPTED },
      select: { followingId: true },
    });
    const blocked = await this.safety.blockedAndBlockerIds(viewerId);
    const authorIds = [...following.map((f) => f.followingId), viewerId].filter(
      (id) => !blocked.includes(id),
    );

    const stories = await this.prisma.story.findMany({
      where: { authorId: { in: authorIds }, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
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

    // which of these has the viewer already seen?
    const seen = await this.prisma.storyView.findMany({
      where: { viewerId, storyId: { in: stories.map((s) => s.id) } },
      select: { storyId: true },
    });
    const seenSet = new Set(seen.map((s) => s.storyId));

    // group by author
    const groups = new Map<string, { author: unknown; stories: typeof stories; hasUnseen: boolean }>();
    for (const s of stories) {
      const g = groups.get(s.authorId) ?? {
        author: s.author,
        stories: [] as typeof stories,
        hasUnseen: false,
      };
      g.stories.push(s);
      if (!seenSet.has(s.id)) g.hasUnseen = true;
      groups.set(s.authorId, g);
    }

    // unseen rings first (like Instagram), your own ring pinned to front
    return [...groups.values()].sort((a, b) => {
      const aOwn = (a.author as { id: string }).id === viewerId ? 1 : 0;
      const bOwn = (b.author as { id: string }).id === viewerId ? 1 : 0;
      if (aOwn !== bOwn) return bOwn - aOwn;
      return Number(b.hasUnseen) - Number(a.hasUnseen);
    });
  }

  /** Active stories for one user (if the viewer is allowed to see them). */
  async forUser(username: string, viewerId: string) {
    const author = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, isPrivate: true },
    });
    if (!author) throw new NotFoundException('User not found');
    await this.assertCanView(author.id, author.isPrivate, viewerId);

    const stories = await this.prisma.story.findMany({
      where: { authorId: author.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
    });
    const seen = await this.prisma.storyView.findMany({
      where: { viewerId, storyId: { in: stories.map((s) => s.id) } },
      select: { storyId: true },
    });
    const seenSet = new Set(seen.map((s) => s.storyId));
    return stories.map((s) => ({ ...s, viewed: seenSet.has(s.id) }));
  }

  async view(storyId: string, viewerId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { authorId: true, expiresAt: true },
    });
    if (!story || story.expiresAt < new Date()) {
      throw new NotFoundException('Story not found or expired');
    }
    const author = await this.prisma.user.findUnique({
      where: { id: story.authorId },
      select: { isPrivate: true },
    });
    await this.assertCanView(story.authorId, author?.isPrivate ?? false, viewerId);

    await this.prisma.storyView.upsert({
      where: { storyId_viewerId: { storyId, viewerId } },
      create: { storyId, viewerId },
      update: {},
    });
    return { viewed: true };
  }

  /** Author-only list of who viewed a story. */
  async viewers(storyId: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { authorId: true },
    });
    if (!story) throw new NotFoundException('Story not found');
    if (story.authorId !== userId) {
      throw new ForbiddenException('Only the author can see viewers');
    }
    const views = await this.prisma.storyView.findMany({
      where: { storyId },
      orderBy: { viewedAt: 'desc' },
      select: {
        viewedAt: true,
        viewer: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    return views.map((v) => ({ ...v.viewer, viewedAt: v.viewedAt }));
  }

  async remove(storyId: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { authorId: true },
    });
    if (!story) throw new NotFoundException('Story not found');
    if (story.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own stories');
    }
    await this.prisma.story.delete({ where: { id: storyId } });
    return { deleted: true };
  }

  // ---- helpers ----

  private async assertCanView(
    authorId: string,
    isPrivate: boolean,
    viewerId: string,
  ) {
    if (authorId === viewerId) return;
    if (await this.safety.isBlockedBetween(authorId, viewerId)) {
      throw new ForbiddenException('Unavailable');
    }
    if (!isPrivate) return;
    const edge = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: viewerId, followingId: authorId },
      },
      select: { status: true },
    });
    if (edge?.status !== FollowStatus.ACCEPTED) {
      throw new ForbiddenException('This account is private');
    }
  }
}
