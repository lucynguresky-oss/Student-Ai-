import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Central XP & streak engine.
 *
 * XP table (tunable):
 *   +10  creating a post
 *   + 2  leaving a comment
 *   + 1  receiving a like on your post
 *   +15  streak bonus (consecutive daily activity)
 *
 * Streak rule: if the user's lastActiveDate was yesterday, increment;
 * if it was today, no-op; if it was longer ago, reset to 1.
 */

const XP = {
  POST: 10,
  COMMENT: 2,
  LIKE_RECEIVED: 1,
  STREAK_BONUS: 15,
} as const;

@Injectable()
export class XpService {
  constructor(private readonly prisma: PrismaService) {}

  /** Award XP for creating a post and maintain the daily streak. */
  async awardPostXP(userId: string): Promise<void> {
    await this.award(userId, XP.POST);
  }

  /** Award XP for leaving a comment. */
  async awardCommentXP(userId: string): Promise<void> {
    await this.award(userId, XP.COMMENT);
  }

  /**
   * Award XP to the post owner when someone likes their post.
   * Called with the post *author* id, not the liker id.
   */
  async awardLikeReceivedXP(authorId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: authorId },
      data: { xp: { increment: XP.LIKE_RECEIVED } },
    });
  }

  // ---- private helpers ----

  private async award(userId: string, xpAmount: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastActiveDate: true, streakCount: true },
    });
    if (!user) return;

    const today = startOfDay(new Date());
    const lastActive = user.lastActiveDate
      ? startOfDay(user.lastActiveDate)
      : null;

    let streakDelta = 0;
    let bonusXp = 0;
    let newStreakCount = user.streakCount;

    if (!lastActive) {
      // first ever activity
      newStreakCount = 1;
      streakDelta = 0;
    } else {
      const daysDiff = diffDays(today, lastActive);
      if (daysDiff === 0) {
        // already active today — keep streak, no bonus
      } else if (daysDiff === 1) {
        // consecutive day — extend streak
        newStreakCount = user.streakCount + 1;
        bonusXp = XP.STREAK_BONUS;
      } else {
        // gap — reset streak
        newStreakCount = 1;
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xpAmount + bonusXp },
        streakCount: newStreakCount,
        lastActiveDate: today,
      },
    });

    void streakDelta; // suppress unused-var warning
  }
}

// ---- date helpers (avoids a heavy dependency) ----

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}
