import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileRequest } from '@learnix/types';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { username },
      include: {
        user: {
          select: {
            streak: true,
            status: true,
            ageBand: true,
          },
        },
      },
    });

    if (!profile) return null;

    // Get counts
    const followersCount = await this.prisma.follow.count({
      where: { followeeId: profile.userId },
    });
    const followingCount = await this.prisma.follow.count({
      where: { followerId: profile.userId },
    });
    const postsCount = await this.prisma.post.count({
      where: { authorId: profile.userId },
    });

    return {
      ...profile,
      followersCount,
      followingCount,
      postsCount,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileRequest) {
    // Need to handle username uniqueness if updating username
    if (data.username) {
      const existing = await this.prisma.profile.findUnique({
        where: { username: data.username },
      });
      if (existing && existing.userId !== userId) {
        throw new BadRequestException('Username is already taken');
      }
    }

    return this.prisma.profile.update({
      where: { userId },
      data,
    });
  }

  async followUser(followerId: string, targetUsername: string) {
    const targetProfile = await this.prisma.profile.findUnique({
      where: { username: targetUsername },
    });

    if (!targetProfile) {
      throw new NotFoundException('User not found');
    }

    if (followerId === targetProfile.userId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    await this.prisma.follow.upsert({
      where: {
        followerId_followeeId: {
          followerId,
          followeeId: targetProfile.userId,
        },
      },
      update: {},
      create: {
        followerId,
        followeeId: targetProfile.userId,
      },
    });
  }

  async unfollowUser(followerId: string, targetUsername: string) {
    const targetProfile = await this.prisma.profile.findUnique({
      where: { username: targetUsername },
    });

    if (!targetProfile) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.prisma.follow.delete({
        where: {
          followerId_followeeId: {
            followerId,
            followeeId: targetProfile.userId,
          },
        },
      });
    } catch (e) {
      // Ignore if not following
    }
  }
}
