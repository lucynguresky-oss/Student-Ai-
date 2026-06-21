import { Controller, Get, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /** Get all plans for display on upgrade page */
  @Get('plans')
  getPlans() {
    return { data: this.subscriptionService.getPlans() };
  }

  /** Get current user's plan and limits */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyPlan(@CurrentUser() user: any) {
    const limits = await this.subscriptionService.getLimits(user.userId);
    return { data: limits };
  }

  /** Get AI usage today */
  @UseGuards(JwtAuthGuard)
  @Get('me/ai-usage')
  async getAiUsage(@CurrentUser() user: any) {
    const used = await this.subscriptionService.getAiUsageToday(user.userId);
    const limits = await this.subscriptionService.getLimits(user.userId);
    const max = limits.limits.aiMessagesPerDay;
    return {
      data: {
        used,
        max,
        remaining: max === -1 ? -1 : Math.max(0, max - used),
        unlimited: max === -1,
      },
    };
  }

  /** Process subscription billing checkout */
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async checkout(
    @CurrentUser() user: any,
    @Body('plan') plan: string,
    @Body('phone') phone: string,
  ) {
    return this.subscriptionService.checkout(user.userId, plan, phone);
  }

  /** Self-serve subscription cancellation */
  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  async cancelSubscription(@CurrentUser() user: any) {
    return this.subscriptionService.cancelSubscription(user.userId);
  }

  /** Self-serve refund request */
  @UseGuards(JwtAuthGuard)
  @Post('refund')
  async requestRefund(
    @CurrentUser() user: any,
    @Body('subscriptionId') subscriptionId: string,
  ) {
    return this.subscriptionService.requestRefund(user.userId, subscriptionId);
  }

  /** M-Pesa STK push response webhook */
  @Post('webhooks/mpesa')
  async mpesaWebhook(@Body() payload: any) {
    return this.subscriptionService.handleMpesaWebhook(payload);
  }

  /** Stripe checkout session response webhook */
  @Post('webhooks/stripe')
  async stripeWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.subscriptionService.handleStripeWebhook(payload, signature);
  }
}
