import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { PaypalClient } from './paypal.client';
import { EntitlementsService } from './entitlements.service';

/**
 * Server-authoritative PayPal prices (minor-unit cents for USD/EUR/GBP).
 * PayPal does NOT support KES — global users pay in USD/EUR/GBP.
 * Keep amounts in sync with M-Pesa prices and the UI pricing table.
 */
const PLAN_PRICES_CENTS: Record<string, Record<string, number>> = {
  PLUS:        { USD: 399,   EUR: 399,   GBP: 349   },
  PREMIUM:     { USD: 899,   EUR: 899,   GBP: 799   },
  TEACHER:     { USD: 1899,  EUR: 1899,  GBP: 1699  },
  CREATOR_PRO: { USD: 1399,  EUR: 1399,  GBP: 1249  },
  INSTITUTION: { USD: 10900, EUR: 10900, GBP: 9500  },
};

@Injectable()
export class PaypalPaymentsService {
  private readonly log = new Logger(PaypalPaymentsService.name);

  constructor(
    private readonly prisma:       PrismaService,
    private readonly paypal:       PaypalClient,
    private readonly entitlements: EntitlementsService,
  ) {}

  private priceFor(plan: string, currency: string): number {
    const cents = PLAN_PRICES_CENTS[plan]?.[currency];
    if (!cents) {
      throw new BadRequestException({
        code:    'PRICE_UNAVAILABLE',
        message: `No ${currency} price for plan ${plan}.`,
      });
    }
    return cents;
  }

  /**
   * Step 1: create PENDING Payment + PayPal order.
   * Client approves the orderId with the PayPal JS SDK, then calls capture().
   */
  async createOrder(input: { userId: string; plan: string; currency?: string }) {
    const currency  = (input.currency ?? 'USD').toUpperCase();
    const amtCents  = this.priceFor(input.plan, currency);
    const amtMajor  = amtCents / 100; // PayPal wants decimal dollars/euros

    const payment = await this.prisma.payment.create({
      data: {
        userId:   input.userId,
        plan:     input.plan,
        amount:   amtCents,
        currency,
        method:   'PAYPAL',
        status:   'PENDING',
      },
    });

    try {
      const order = await this.paypal.createOrder({
        amount:      amtMajor,
        currency,
        referenceId: `LRNX-${input.plan}`,
        customId:    payment.id,
        description: `Learnix ${input.plan}`,
        requestId:   randomUUID(),
      });

      await this.prisma.payment.update({
        where: { id: payment.id },
        data:  { providerOrderId: order.id },
      });

      return { paymentId: payment.id, orderId: order.id, status: 'PENDING' as const };
    } catch (err: any) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'FAILED', failureReason: 'PAYPAL_CREATE_FAILED' },
      });
      this.log.error(`PayPal create failed for ${payment.id}: ${String(err?.message)}`);
      throw new BadRequestException({ code: 'PAYPAL_CREATE_FAILED', message: 'Could not start PayPal checkout.' });
    }
  }

  /**
   * Step 2 (primary): capture after buyer approves.
   * Verifies amount before granting.
   */
  async capture(input: { userId: string; orderId: string }) {
    const payment = await this.prisma.payment.findFirst({
      where: { providerOrderId: input.orderId, userId: input.userId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'SUCCESS') return { id: payment.id, status: payment.status };

    const result = await this.paypal.captureOrder(input.orderId);

    if (result.status !== 'COMPLETED') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'FAILED', failureReason: `CAPTURE_${result.status}` },
      });
      return { id: payment.id, status: 'FAILED' as const };
    }

    // Verify captured amount (PayPal returns decimal; convert to cents)
    const capturedCents = Math.round(Number(result.amount?.value ?? '0') * 100);
    if (capturedCents !== payment.amount || result.amount?.currency_code !== payment.currency) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'FAILED', failureReason: 'AMOUNT_MISMATCH' },
      });
      this.log.error(`PayPal amount mismatch on payment ${payment.id}`);
      return { id: payment.id, status: 'FAILED' as const };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'SUCCESS', providerCaptureId: result.captureId },
    });
    await this.entitlements.grantForPayment(payment.id);
    return { id: payment.id, status: 'SUCCESS' as const };
  }

  /**
   * Step 3 (safety net): PayPal webhook.
   * PAYMENT.CAPTURE.COMPLETED handles tab-closed scenarios.
   * Verifies signature before trusting any payload.
   */
  async handleWebhook(headers: Record<string, any>, rawEvent: any): Promise<void> {
    const ok = await this.paypal.verifyWebhook(headers, rawEvent);
    if (!ok) {
      this.log.warn('Rejected PayPal webhook: signature verification failed');
      return;
    }

    const type = rawEvent?.event_type;
    if (type !== 'PAYMENT.CAPTURE.COMPLETED') return;

    const customId: string | undefined =
      rawEvent?.resource?.custom_id ??
      rawEvent?.resource?.purchase_units?.[0]?.custom_id;
    if (!customId) return;

    const payment = await this.prisma.payment.findUnique({ where: { id: customId } });
    if (!payment || payment.status === 'SUCCESS') return; // idempotent

    await this.prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'SUCCESS', providerCaptureId: rawEvent?.resource?.id },
    });
    await this.entitlements.grantForPayment(payment.id);
  }

  async getStatus(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return {
      id:       payment.id,
      status:   payment.status,
      plan:     payment.plan,
      amount:   payment.amount,
      currency: payment.currency,
    };
  }
}
