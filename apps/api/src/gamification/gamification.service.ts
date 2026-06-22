import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async getLeaderboard(limit = 10) {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        xp: true,
      },
      orderBy: {
        xp: 'desc',
      },
      take: limit,
    });
  }

  async addXp(userId: string, amount: number, reason: string) {
    await this.prisma.$transaction(async (tx) => {
      // Create XP event
      await tx.xpEvent.create({
        data: {
          userId,
          amount,
          reason,
        },
      });
      // Update User total XP
      await tx.user.update({
        where: { id: userId },
        data: { xp: { increment: amount } },
      });
    });
    
    // Return updated user
    return this.prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
  }
}
