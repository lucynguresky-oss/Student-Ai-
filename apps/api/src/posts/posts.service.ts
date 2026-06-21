import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(userId?: string, cursor?: string, limit: number = 20) {
    let whereClause: any = {
      deletedAt: null,
      moderationState: 'APPROVED',
    };

    if (userId) {
      const learnerProfile = await this.prisma.learnerProfile.findUnique({
        where: { userId },
      });

      if (learnerProfile) {
        let levelName: string | undefined = undefined;
        if (learnerProfile.levelId) {
          const level = await this.prisma.educationLevel.findUnique({
            where: { id: learnerProfile.levelId },
          });
          if (level) {
            levelName = level.name;
          }
        }

        whereClause = {
          ...whereClause,
          OR: [
            {
              subjectId: { in: learnerProfile.subjectIds },
              ...(levelName ? { level: levelName } : {}),
            },
            {
              subjectId: null,
              level: null,
            },
          ],
        };
      }
    }

    const posts = await this.prisma.post.findMany({
      where: whereClause,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        media: true,
        video: true,
        subject: true,
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    const authorIds = posts.map(p => p.authorId);
    const profiles = await this.prisma.profile.findMany({
      where: { userId: { in: authorIds } },
    });
    
    const profileMap = new Map(profiles.map(p => [p.userId, p]));

    return posts.map(post => ({
      ...post,
      author: profileMap.get(post.authorId),
    }));
  }

  async createPost(userId: string, data: any) {
    return this.prisma.post.create({
      data: {
        authorId: userId,
        type: data.type || 'TEXT',
        body: data.body,
        subjectId: data.subjectId,
        topicId: data.topicId,
      },
    });
  }

  async reactToPost(userId: string, postId: string, kind: string = 'LIKE') {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.reaction.upsert({
      where: {
        userId_postId_kind: {
          userId,
          postId,
          kind,
        },
      },
      update: {},
      create: {
        userId,
        postId,
        kind,
      },
    });
  }

  async savePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    
    return this.prisma.save.upsert({
      where: {
        userId_postId: {
          userId,
          postId,
        }
      },
      update: {},
      create: {
        userId,
        postId,
      }
    });
  }

  async addComment(userId: string, postId: string, body: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        body,
        parentId: null, // MVP: top-level comments only
      },
    });
  }

  async getComments(postId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });

    return comments.map(c => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      author: {
        username: c.author.profile?.username || 'unknown',
        displayName: c.author.profile?.displayName || 'Unknown User',
      },
    }));
  }
}
