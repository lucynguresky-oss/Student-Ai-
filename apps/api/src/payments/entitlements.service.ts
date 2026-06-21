import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { SubscriptionPlan } from '@prisma/client';

/**
 * Maps the Payment.plan string to a valid SubscriptionPlan enum value.
 * The payment services store plan as a string key (e.g. 'PLUS', 'PREMIUM').
 * We need to convert to the Prisma enum (e.g. 'PLUS_PLAN').
 */
function toPlanEnum(planKey: string): SubscriptionPlan {
  const map: Record<string, SubscriptionPlan> = {
    PLUS:        SubscriptionPlan.PLUS_PLAN,
    PREMIUM:     SubscriptionPlan.PREMIUM,
    TEACHER:     SubscriptionPlan.TEACHER,
    CREATOR_PRO: SubscriptionPlan.CREATOR_PRO,
    INSTITUTION: SubscriptionPlan.INSTITUTION,
    FREE:        SubscriptionPlan.FREE,
    // Passthrough for values already in enum form
    PLUS_PLAN:   SubscriptionPlan.PLUS_PLAN,
  };
  return map[planKey] ?? SubscriptionPlan.PLUS_PLAN;
}

/**
 * Grants / extends a subscription AFTER payment is confirmed.
 * Idempotent: granting the same paymentId twice must NOT double-extend.
 * All payment paths (M-Pesa callback, PayPal webhook, PayPal capture) route here.
 */
@Injectable()
export class EntitlementsService {
  private readonly log = new Logger(EntitlementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async grantForPayment(paymentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return;
    if (payment.entitlementGranted) return; // idempotent guard

    const now       = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const plan = toPlanEnum(payment.plan ?? 'FREE');

    const existingSub = await this.prisma.subscription.findFirst({
      where: { userId: payment.userId },
    });

    if (existingSub) {
      await this.prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          plan,
          status: 'ACTIVE',
          currentPeriodEnd: periodEnd,
          provider: payment.method ?? 'none',
        },
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          userId: payment.userId,
          plan,
          status: 'ACTIVE',
          currentPeriodEnd: periodEnd,
          provider: payment.method ?? 'none',
        },
      });
    }

    await this.prisma.$transaction([

      this.prisma.payment.update({
        where: { id: payment.id },
        data:  { entitlementGranted: true },
      }),
    ]);

    this.log.log(`Granted ${plan} to user ${payment.userId} via payment ${payment.id}`);
  }
}
