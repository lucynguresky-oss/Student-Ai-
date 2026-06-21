import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionsModule {}
