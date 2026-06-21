import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReportStatus, ReportTargetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateReportInput {
  targetType: ReportTargetType;
  postId?: string;
  reportedUsername?: string;
  commentId?: string;
  reason: string;
  details?: string;
}

@Injectable()
export class SafetyService {
  constructor(private readonly prisma: PrismaService) {}

  async block(userId: string, username: string) {
    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === userId) {
      throw new BadRequestException('You cannot block yourself');
    }

    await this.prisma.$transaction([
      this.prisma.block.upsert({
        where: {
          blockerId_blockedId: { blockerId: userId, blockedId: target.id },
        },
        create: { blockerId: userId, blockedId: target.id },
        update: {},
      }),
      // blocking severs the follow relationship in both directions (like IG)
      this.prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: userId, followingId: target.id },
            { followerId: target.id, followingId: userId },
          ],
        },
      }),
    ]);
    return { blocked: true };
  }

  async unblock(userId: string, username: string) {
    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');
    await this.prisma.block.deleteMany({
      where: { blockerId: userId, blockedId: target.id },
    });
    return { blocked: false };
  }

  async listBlocked(userId: string) {
    const rows = await this.prisma.block.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        blocked: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    return rows.map((r) => r.blocked);
  }

  async report(reporterId: string, input: CreateReportInput) {
    let reportedUserId: string | undefined;
    if (input.targetType === ReportTargetType.USER) {
      if (!input.reportedUsername) {
        throw new BadRequestException('reportedUsername is required');
      }
      const u = await this.prisma.user.findUnique({
        where: { username: input.reportedUsername },
        select: { id: true },
      });
      if (!u) throw new NotFoundException('Reported user not found');
      reportedUserId = u.id;
    }
    if (input.targetType === ReportTargetType.POST && !input.postId) {
      throw new BadRequestException('postId is required');
    }
    if (input.targetType === ReportTargetType.COMMENT && !input.commentId) {
      throw new BadRequestException('commentId is required');
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetType: input.targetType,
        postId: input.postId,
        reportedUserId,
        commentId: input.commentId,
        reason: input.reason,
        details: input.details,
        status: ReportStatus.OPEN,
      },
    });
    return { id: report.id, status: report.status };
  }

  /** Admin/moderator report queue. */
  async reportQueue(role: string) {
    if (role !== 'ADMIN' && role !== 'TEACHER') {
      throw new ForbiddenException('Moderator access required');
    }
    return this.prisma.report.findMany({
      where: { status: ReportStatus.OPEN },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        reporter: { select: { id: true, username: true } },
      },
    });
  }

  /**
   * Union of users the given user has blocked and users who have blocked them.
   * Used to filter feeds, stories, search, and messaging in both directions.
   */
  async blockedAndBlockerIds(userId: string): Promise<string[]> {
    const [iBlocked, blockedMe] = await Promise.all([
      this.prisma.block.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
      }),
      this.prisma.block.findMany({
        where: { blockedId: userId },
        select: { blockerId: true },
      }),
    ]);
    return [
      ...new Set([
        ...iBlocked.map((b) => b.blockedId),
        ...blockedMe.map((b) => b.blockerId),
      ]),
    ];
  }

  async isBlockedBetween(a: string, b: string): Promise<boolean> {
    const found = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
      select: { blockerId: true },
    });
    return !!found;
  }
}
