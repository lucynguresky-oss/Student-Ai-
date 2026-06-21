import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { EntitlementsService } from './entitlements.service';
// M-Pesa (East Africa)
import { DarajaClient } from './daraja.client';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
// PayPal (global)
import { PaypalClient } from './paypal.client';
import { PaypalPaymentsService } from './paypal.payments.service';
import { PaypalController } from './paypal.controller';

/**
 * Both payment gateways in one module, sharing the same entitlement/idempotency rules.
 * Country → provider routing lives in payment-provider.interface.ts (chooseProvider).
 * Register this module in AppModule alongside ConfigModule.forRoot({ isGlobal: true }).
 */
@Module({
  imports:     [ConfigModule],
  controllers: [PaymentsController, PaypalController],
  providers:   [
    PrismaService,
    EntitlementsService,
    // M-Pesa
    DarajaClient,
    PaymentsService,
    // PayPal
    PaypalClient,
    PaypalPaymentsService,
  ],
  exports: [PaymentsService, PaypalPaymentsService, EntitlementsService],
})
export class PaymentsModule {}
