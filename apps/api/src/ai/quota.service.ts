import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

/**
 * Server-side daily AI quota enforcement.
 *
 * Plan limits are defined here. Wire to the same pricing source M-Pesa prices
 * come from so quota and price can never disagree.
 *
 * Quota resets daily at midnight UTC (simple: we count by calendar date).
 * For timezone-aware reset, replace date.toISOString().slice(0,10) with
 * a tz-aware implementation using the learner's country timezone.
 */

const PLAN_LIMITS: Record<string, number> = {
  FREE:        10,
  PLUS:        50,
  PREMIUM:     150,
  TEACHER:     200,
  CREATOR_PRO: 200,
  INSTITUTION: 500,
};

const DEFAULT_LIMIT = PLAN_LIMITS['FREE']!;

@Injectable()
export class QuotaService {
  private readonly log = new Logger(QuotaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks whether the user has remaining quota.
   * Returns { allowed, used, limit, plan }.
   */
  async check(userId: string): Promise<{
    allowed: boolean;
    used:    number;
    limit:   number;
    plan:    string;
  }> {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    // Look up the user's active subscription plan
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    const plan  = sub?.plan ?? 'FREE';
    const limit = PLAN_LIMITS[plan] ?? DEFAULT_LIMIT;

    // Count AI asks today
    const used = await this.prisma.xpEvent.count({
      where: {
        userId,
        kind: 'ai_ask',
        createdAt: {
          gte: new Date(`${today}T00:00:00.000Z`),
          lt:  new Date(`${today}T23:59:59.999Z`),
        },
      },
    });

    return { allowed: used < limit, used, limit, plan };
  }

  /** Records one AI ask event for quota tracking. */
  async consume(userId: string): Promise<void> {
    await this.prisma.xpEvent.create({
      data: {
        userId,
        kind:   'ai_ask',
        amount: 0,       // no XP for asks; XP may be awarded on rated answers separately
        metadata: { source: 'tutor' },
      },
    });
  }
}
