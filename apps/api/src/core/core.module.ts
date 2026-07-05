import { Global, Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { CryptoService } from './crypto/crypto.service';
import { PasswordStrengthService } from './crypto/password-strength.service';
import { JwtService } from './tokens/jwt.service';
import { TokenService } from './tokens/token.service';
import { OtpService } from './tokens/otp.service';
import { AuthGuard } from './tokens/auth.guard';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';
import { AnalyticsService } from './analytics/analytics.service';
import { HealthModule } from './health/health.controller';

/**
 * CoreModule — cross-cutting infrastructure shared by every feature module.
 * Exported providers are available app-wide (Global) so modules import nothing extra.
 */
@Global()
@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, HealthModule],
  providers: [
    CryptoService,
    PasswordStrengthService,
    JwtService,
    TokenService,
    OtpService,
    AuthGuard,
    RateLimitGuard,
    AnalyticsService,
  ],
  exports: [
    CryptoService,
    PasswordStrengthService,
    JwtService,
    TokenService,
    OtpService,
    AuthGuard,
    RateLimitGuard,
    AnalyticsService,
    HealthModule,
  ],
})
export class CoreModule {}
