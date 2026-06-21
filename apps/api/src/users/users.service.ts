import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { FollowStatus, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SafetyService } from '../safety/safety.service';
import {
  ChangePasswordDto,
  ChangeUsernameDto,
  UpdateProfileDto,
} from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safety: SafetyService,
  ) {}

  /** Update editable profile fields. */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        isPrivate: dto.isPrivate,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        isPrivate: true,
        isVerified: true,
        role: true,
        xp: true,
        streakCount: true,
      },
    });
    return user;
  }

  async changeUsername(userId: string, dto: ChangeUsernameDto) {
    const taken = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: { id: true },
    });
    if (taken && taken.id !== userId) {
      throw new ConflictException('That username is already taken');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { username: dto.username },
    });
    return { username: dto.username };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 12) },
    });
    // invalidate existing sessions after a password change
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  /** Public profile + counts + whether the viewer follows them. */
  async getProfile(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        isPrivate: true,
        isVerified: true,
        xp: true,
        streakCount: true,
        createdAt: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    let followState: FollowStatus | 'NONE' = 'NONE';
    if (viewerId && viewerId !== user.id) {
      const edge = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId: viewerId, followingId: user.id },
        },
        select: { status: true },
      });
      followState = edge?.status ?? 'NONE';
    }

    const isOwner = viewerId === user.id;
    const canViewPosts =
      isOwner || !user.isPrivate || followState === FollowStatus.ACCEPTED;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isPrivate: user.isPrivate,
      isVerified: user.isVerified,
      xp: user.xp,
      streakCount: user.streakCount,
      createdAt: user.createdAt,
      counts: {
        posts: user._count.posts,
        followers: user._count.followers,
        following: user._count.following,
      },
      viewer: { isOwner, followState, canViewPosts },
    };
  }

  /** Follow a user. Private accounts get a PENDING request instead. */
  async follow(followerId: string, username: string) {
    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, isPrivate: true },
    });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === followerId) {
      throw new BadRequestException('You cannot follow yourself');
    }
    if (await this.safety.isBlockedBetween(followerId, target.id)) {
      throw new ForbiddenException('Unavailable');
    }

    const status = target.isPrivate
      ? FollowStatus.PENDING
      : FollowStatus.ACCEPTED;

    const edge = await this.prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId: target.id },
      },
      create: { followerId, followingId: target.id, status },
      update: {}, // already following / requested — no-op
      select: { status: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: target.id,
        actorId: followerId,
        type:
          status === FollowStatus.PENDING
            ? NotificationType.FOLLOW_REQUEST
            : NotificationType.FOLLOW,
      },
    });

    return { status: edge.status };
  }

  async unfollow(followerId: string, username: string) {
    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');

    await this.prisma.follow.deleteMany({
      where: { followerId, followingId: target.id },
    });
    return { status: 'NONE' };
  }

  /** Target user accepts a pending follow request. */
  async acceptRequest(ownerId: string, requesterUsername: string) {
    const requester = await this.prisma.user.findUnique({
      where: { username: requesterUsername },
      select: { id: true },
    });
    if (!requester) throw new NotFoundException('User not found');

    const edge = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: requester.id,
          followingId: ownerId,
        },
      },
    });
    if (!edge || edge.status !== FollowStatus.PENDING) {
      throw new BadRequestException('No pending request from that user');
    }

    await this.prisma.follow.update({
      where: {
        followerId_followingId: {
          followerId: requester.id,
          followingId: ownerId,
        },
      },
      data: { status: FollowStatus.ACCEPTED },
    });
    return { status: FollowStatus.ACCEPTED };
  }

  async listFollowers(username: string, viewerId?: string) {
    const user = await this.assertVisible(username, viewerId);
    return this.prisma.follow.findMany({
      where: { followingId: user.id, status: FollowStatus.ACCEPTED },
      orderBy: { createdAt: 'desc' },
      select: { follower: this.cardSelect() },
    });
  }

  async listFollowing(username: string, viewerId?: string) {
    const user = await this.assertVisible(username, viewerId);
    return this.prisma.follow.findMany({
      where: { followerId: user.id, status: FollowStatus.ACCEPTED },
      orderBy: { createdAt: 'desc' },
      select: { following: this.cardSelect() },
    });
  }

  /** Permanently delete the caller's own account (GDPR-friendly). */
  async deleteAccount(userId: string): Promise<{ deleted: boolean }> {
    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
  }

  // ---- helpers ----

  private async assertVisible(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, isPrivate: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.isPrivate || user.id === viewerId) return user;

    const edge = viewerId
      ? await this.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerId,
              followingId: user.id,
            },
          },
          select: { status: true },
        })
      : null;
    if (edge?.status !== FollowStatus.ACCEPTED) {
      throw new ForbiddenException('This account is private');
    }
    return user;
  }

  private cardSelect() {
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
