import { Global, Module } from '@nestjs/common';
import { ConfigService } from '../core/config/config.service';
import { ConsoleMockSmsProvider, AfricasTalkingSmsProvider, TwilioSmsProvider, HybridSmsProvider, SMS_PROVIDER, type SmsProvider } from './sms/sms.provider';
import { ConsoleMockEmailProvider, ResendEmailProvider, SesEmailProvider, EMAIL_PROVIDER, type EmailProvider } from './email/email.provider';
import { MockStorageProvider, R2StorageProvider, STORAGE_PROVIDER, type StorageProvider } from './storage/storage.provider';
import { NotificationService } from './notification.service';

// Re-export so existing imports of NotificationService from providers.module keep working.
export { NotificationService } from './notification.service';

// ---- Provider selection by env flag (§5.2 "wire via Nest DI + env flag") ----
function smsFactory(config: ConfigService): SmsProvider {
  switch (config.env.SMS_PROVIDER) {
    case 'africastalking':
      return new AfricasTalkingSmsProvider(config);
    case 'twilio':
      return new TwilioSmsProvider(config);
    case 'hybrid':
      // Global default: Africa's Talking for African numbers, Twilio worldwide.
      return new HybridSmsProvider(new AfricasTalkingSmsProvider(config), new TwilioSmsProvider(config));
    default:
      return new ConsoleMockSmsProvider();
  }
}
function emailFactory(config: ConfigService): EmailProvider {
  switch (config.env.EMAIL_PROVIDER) {
    case 'resend':
      return new ResendEmailProvider(config);
    case 'ses':
      return new SesEmailProvider();
    default:
      return new ConsoleMockEmailProvider();
  }
}
function storageFactory(config: ConfigService): StorageProvider {
  switch (config.env.STORAGE_PROVIDER) {
    case 'r2':
      return new R2StorageProvider(config);
    case 's3':
      return new R2StorageProvider(config); // S3 is SigV4-compatible; same signer
    default:
      return new MockStorageProvider(config);
  }
}

@Global()
@Module({
  providers: [
    { provide: SMS_PROVIDER, useFactory: smsFactory, inject: [ConfigService] },
    { provide: EMAIL_PROVIDER, useFactory: emailFactory, inject: [ConfigService] },
    { provide: STORAGE_PROVIDER, useFactory: storageFactory, inject: [ConfigService] },
    {
      provide: NotificationService,
      useFactory: (config: ConfigService, sms: SmsProvider, email: EmailProvider) =>
        new NotificationService(config, { instance: sms }, { instance: email }),
      inject: [ConfigService, SMS_PROVIDER, EMAIL_PROVIDER],
    },
  ],
  exports: [NotificationService, SMS_PROVIDER, EMAIL_PROVIDER, STORAGE_PROVIDER],
})
export class ProvidersModule {}
