import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
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
        createdAt: true,
      },
    });

    if (!user) return null;

    // Get counts
    const followersCount = await this.prisma.follow.count({
      where: { followingId: user.id },
    });
    const followingCount = await this.prisma.follow.count({
      where: { followerId: user.id },
    });
    const postsCount = await this.prisma.post.count({
      where: { authorId: user.id },
    });

    return {
      ...user,
      userId: user.id, // For backward compatibility with clients expecting profile.userId
      followersCount,
      followingCount,
      postsCount,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    // We already have a UsersService for this, but since ProfilesController calls this:
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        isPrivate: true,
      },
    });
  }

  async followUser(followerId: string, targetUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (followerId === targetUser.id) {
      throw new BadRequestException('Cannot follow yourself');
    }

    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id,
        },
      },
      update: {},
      create: {
        followerId,
        followingId: targetUser.id,
        status: targetUser.isPrivate ? 'PENDING' : 'ACCEPTED',
      },
    });
  }

  async unfollowUser(followerId: string, targetUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUser.id,
          },
        },
      });
    } catch (e) {
      // Ignore if not following
    }
  }
}
