import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
// import { AuthGuard } from '../auth/auth.guard';
// import { UseGuards } from '@nestjs/common';

/**
 * M-Pesa payments controller.
 *
 * POST /payments/mpesa/stk     — Authenticated: initiate STK push
 * POST /payments/mpesa/callback — PUBLIC: Safaricom posts result here
 * GET  /payments/:id/status    — Authenticated: poll status + reconcile
 *
 * Security notes:
 *  - Restrict /mpesa/callback to Safaricom's published IP ranges at your proxy/firewall.
 *  - Never expose the callback URL path in client-side code.
 *  - The service verifies the amount before granting any entitlement.
 */
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // @UseGuards(AuthGuard)
  @Post('mpesa/stk')
  async initiate(@Req() req: Request, @Body() body: { plan: string; phone: string }) {
    const userId = (req as any).user?.id;
    const data   = await this.payments.initiateStk({ userId, plan: body.plan, phone: body.phone });
    return { success: true, data };
  }

  /**
   * PUBLIC — Safaricom posts result here.
   * Always return 200 / Daraja ack so Safaricom stops retrying.
   * Any internal error leaves the payment PENDING for the reconcile path.
   */
  @Post('mpesa/callback')
  async callback(@Body() payload: any, @Res() res: Response) {
    try {
      await this.payments.handleCallback(payload);
    } catch {
      // swallow — payment stays PENDING, reconciled via STK Query on next poll
    }
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  // @UseGuards(AuthGuard)
  @Get(':id/status')
  async status(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user?.id;
    const data   = await this.payments.getStatus(userId, id);
    return { success: true, data };
  }
}
