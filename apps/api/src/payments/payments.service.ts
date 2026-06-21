import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { DarajaClient } from './daraja.client';
import { EntitlementsService } from './entitlements.service';
import { normalizeKenyanMsisdn } from './msisdn';

/**
 * Server-authoritative M-Pesa prices in KES (minor units = whole shillings here).
 * Keep in sync with PayPal prices and the UI pricing table.
 * Source of truth for what we charge — never trust client-sent amounts.
 */
const PLAN_PRICES_KES: Record<string, number> = {
  PLUS:         500,
  PREMIUM:     1200,
  TEACHER:     2500,
  CREATOR_PRO: 1800,
  INSTITUTION: 15000,
};

@Injectable()
export class PaymentsService {
  private readonly log = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma:       PrismaService,
    private readonly daraja:       DarajaClient,
    private readonly entitlements: EntitlementsService,
  ) {}

  /**
   * Step 1 — validate input, create PENDING Payment, fire STK push.
   * We create the DB row FIRST so that a fast Safaricom callback always finds it.
   */
  async initiateStk(input: { userId: string; plan: string; phone: string }) {
    const msisdn = normalizeKenyanMsisdn(input.phone);
    if (!msisdn) {
      throw new BadRequestException({
        code:    'INVALID_PHONE',
        message: 'Enter a valid Kenyan number, e.g. 0712 345 678.',
      });
    }

    const amount = PLAN_PRICES_KES[input.plan];
    if (!amount) {
      throw new BadRequestException({ code: 'INVALID_PLAN', message: 'Unknown plan.' });
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId:   input.userId,
        plan:     input.plan,
        amount,
        currency: 'KES',
        method:   'MPESA',
        status:   'PENDING',
        msisdn,
      },
    });

    try {
      const res = await this.daraja.stkPush({
        msisdn,
        amount,
        accountReference: `LRNX-${input.plan}`,
        description:      'Learnix plan',
      });

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          checkoutRequestId: res.checkoutRequestId,
          merchantRequestId: res.merchantRequestId,
        },
      });

      return { paymentId: payment.id, status: 'PENDING' as const };
    } catch (err: any) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'FAILED', failureReason: 'STK_PUSH_FAILED' },
      });
      this.log.error(`STK push failed for payment ${payment.id}: ${String(err?.message)}`);
      throw new BadRequestException({
        code:    'STK_PUSH_FAILED',
        message: 'Could not start the M-Pesa prompt. Please try again.',
      });
    }
  }

  /**
   * Step 2 — Safaricom POSTs result here. Idempotent.
   * Verifies amount before granting. Always returns void so the controller
   * can send the Daraja 200 ack regardless of outcome.
   */
  async handleCallback(payload: any): Promise<void> {
    const cb = payload?.Body?.stkCallback;
    if (!cb) {
      this.log.warn('Callback with no stkCallback body');
      return;
    }

    const checkoutRequestId: string = cb.CheckoutRequestID;
    const resultCode:        number  = Number(cb.ResultCode);
    const resultDesc:        string  = cb.ResultDesc;

    const payment = await this.prisma.payment.findFirst({
      where: { checkoutRequestId },
    });
    if (!payment) {
      this.log.warn(`Callback for unknown CheckoutRequestID ${checkoutRequestId}`);
      return;
    }

    // Idempotency guard
    if (payment.status === 'SUCCESS' || payment.status === 'FAILED') return;

    if (resultCode !== 0) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'FAILED', failureReason: (resultDesc ?? 'CANCELLED').slice(0, 200) },
      });
      return;
    }

    // Extract receipt + paid amount from callback metadata
    const items: Array<{ Name: string; Value: any }> = cb.CallbackMetadata?.Item ?? [];
    const meta = Object.fromEntries(items.map((i) => [i.Name, i.Value]));
    const paidAmount  = Number(meta['Amount']);
    const receiptCode = String(meta['MpesaReceiptNumber'] ?? '');

    if (paidAmount !== payment.amount) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'FAILED', failureReason: `AMOUNT_MISMATCH expected ${payment.amount} got ${paidAmount}` },
      });
      this.log.error(`Amount mismatch on payment ${payment.id}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'SUCCESS', mpesaReceipt: receiptCode },
    });

    await this.entitlements.grantForPayment(payment.id);
  }

  /**
   * Step 3 — client polls this. After 25 s grace we reconcile via STK Query
   * so a payment can never hang in PENDING forever.
   */
  async getStatus(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const ageMs = Date.now() - payment.createdAt.getTime();
    if (payment.status === 'PENDING' && payment.checkoutRequestId && ageMs > 25_000) {
      try {
        const q  = await this.daraja.stkQuery(payment.checkoutRequestId);
        const rc = Number(q.ResultCode);
        if (rc === 0) {
          await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS' } });
          await this.entitlements.grantForPayment(payment.id);
        } else if (!Number.isNaN(rc)) {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data:  { status: 'FAILED', failureReason: (q.ResultDesc ?? 'QUERY_FAILED').slice(0, 200) },
          });
        }
      } catch {
        // Leave PENDING; scheduled reconciler handles it
      }
    }

    const fresh = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    return { id: fresh.id, status: fresh.status, plan: fresh.plan, amount: fresh.amount };
  }
}
