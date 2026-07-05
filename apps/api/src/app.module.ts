import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { CoreModule } from './core/core.module';
import { ProvidersModule } from './providers/providers.module';
import { AllExceptionsFilter } from './core/http/app-exception';
import { AuthModule } from './modules/auth/auth.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { TracksModule } from './modules/tracks/tracks.module';
import { ReferenceModule } from './modules/tracks/reference.module';
import { UsersModule } from './modules/users/users.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { SecurityModule } from './modules/security/security.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { NotificationPrefsModule } from './modules/notification-prefs/notification-prefs.module';
import { AccountLifecycleModule } from './modules/account-lifecycle/account-lifecycle.module';

@Module({
  imports: [
    CoreModule,
    ProvidersModule,
    AuthModule,
    OnboardingModule,
    TracksModule,
    ReferenceModule,
    UsersModule,
    SessionsModule,
    SecurityModule,
    PrivacyModule,
    NotificationPrefsModule,
    AccountLifecycleModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
