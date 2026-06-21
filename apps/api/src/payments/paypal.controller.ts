import { Body, Controller, Get, Headers, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PaypalPaymentsService } from './paypal.payments.service';
// import { AuthGuard } from '../auth/auth.guard';
// import { UseGuards } from '@nestjs/common';

/**
 * PayPal payments controller.
 *
 * POST /payments/paypal/create-order  — Authenticated: create order, get orderId
 * POST /payments/paypal/capture/:id   — Authenticated: capture after buyer approves
 * POST /payments/paypal/webhook       — PUBLIC: PayPal posts events (signature verified)
 * GET  /payments/paypal/:id/status    — Authenticated: poll status
 *
 * IMPORTANT for the webhook: PayPal signature verification needs the RAW body.
 * Enable rawBody in NestFactory: `NestFactory.create(AppModule, { rawBody: true })`
 * and pass req.rawBody to handleWebhook, or apply a raw body-parser middleware
 * scoped to /payments/paypal/webhook.
 */
@Controller('payments/paypal')
export class PaypalController {
  constructor(private readonly paypal: PaypalPaymentsService) {}

  // @UseGuards(AuthGuard)
  @Post('create-order')
  async createOrder(
    @Req() req: Request,
    @Body() body: { plan: string; currency?: string },
  ) {
    const userId = (req as any).user?.id;
    const data   = await this.paypal.createOrder({ userId, plan: body.plan, currency: body.currency });
    return { success: true, data };
  }

  // @UseGuards(AuthGuard)
  @Post('capture/:orderId')
  async capture(@Req() req: Request, @Param('orderId') orderId: string) {
    const userId = (req as any).user?.id;
    const data   = await this.paypal.capture({ userId, orderId });
    return { success: true, data };
  }

  /**
   * PUBLIC webhook — NO auth. PayPal posts events here.
   * Always return 200 so PayPal stops retrying.
   */
  @Post('webhook')
  async webhook(
    @Headers() headers: Record<string, any>,
    @Body() event: any,
    @Res() res: Response,
  ) {
    try {
      await this.paypal.handleWebhook(headers, event);
    } catch {
      // swallow; capture() is the primary confirmation path
    }
    res.status(200).json({ received: true });
  }

  // @UseGuards(AuthGuard)
  @Get(':id/status')
  async status(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user?.id;
    const data   = await this.paypal.getStatus(userId, id);
    return { success: true, data };
  }
}
