import { Body, Controller, Delete, Post, UseGuards, Injectable, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CryptoService } from '../../core/crypto/crypto.service';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { NotificationService } from '../../providers/providers.module';
import { AppException } from '../../core/http/app-exception';
import { AuthGuard } from '../../core/tokens/auth.guard';
import { CurrentUser, zodBody, type AuthedUser } from '../../core/http/request-context';
import { ProvidersModule } from '../../providers/providers.module';
import { totpEnableSchema, disable2faSchema, ERROR_CODES } from '@learnix/validation';

@Injectable()
export class SecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly analytics: AnalyticsService,
    private readonly notifications: NotificationService,
  ) {}

  /** Setup: generate secret + otpauth URI + QR + 10 backup codes (shown once). §5.4 */
  async setupTotp(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { username: true, email: true } });
    const secret = authenticator.generateSecret();
    const label = user.email ?? user.username;
    const otpauth = authenticator.keyuri(label, 'Learnix', secret);
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    const backupPlain = Array.from({ length: 10 }, () => this.crypto.randomToken(5).slice(0, 10));
    const backupCodes = backupPlain.map((c) => ({ hash: this.crypto.sha256(c), usedAt: null }));

    // Store encrypted secret (not yet enabled until first code verifies).
    await this.prisma.twoFactor.upsert({
      where: { userId },
      update: { totpSecretEnc: this.crypto.encrypt(secret), backupCodes, enabledAt: null },
      create: { userId, totpSecretEnc: this.crypto.encrypt(secret), backupCodes },
    });

    return { otpauth, qr: qrDataUrl, backupCodes: backupPlain };
  }

  async enableTotp(userId: string, code: string) {
    const tf = await this.prisma.twoFactor.findUnique({ where: { userId } });
    if (!tf) throw AppException.badRequest(ERROR_CODES.AUTH_2FA_INVALID, 'Run setup first');
    const secret = this.crypto.decrypt(tf.totpSecretEnc);
    if (!authenticator.verify({ token: code, secret })) {
      throw AppException.badRequest(ERROR_CODES.AUTH_2FA_INVALID);
    }
    await this.prisma.twoFactor.update({ where: { userId }, data: { enabledAt: new Date() } });
    await this.prisma.securityEvent.create({ data: { userId, type: '2FA_ENABLED', metadata: {} } });
    this.analytics.track('2fa_enabled', { userId }, {});
    return { enabled: true };
  }

  async disableTotp(userId: string, password: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash || !(await this.crypto.verifyPassword(user.passwordHash, password))) {
      throw AppException.unauthorized(ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }
    const tf = await this.prisma.twoFactor.findUnique({ where: { userId } });
    if (!tf?.enabledAt) throw AppException.badRequest(ERROR_CODES.AUTH_2FA_INVALID, '2FA is not enabled');
    const secret = this.crypto.decrypt(tf.totpSecretEnc);
    if (!authenticator.verify({ token: code, secret })) throw AppException.badRequest(ERROR_CODES.AUTH_2FA_INVALID);

    await this.prisma.twoFactor.delete({ where: { userId } });
    await this.prisma.securityEvent.create({ data: { userId, type: '2FA_DISABLED', metadata: {} } });
    this.analytics.track('2fa_disabled', { userId }, {});
    // Alert (§9.1).
    if (user.email) {
      await this.notifications.sendEmail({
        to: user.email,
        subject: 'Two-factor authentication disabled',
        html: `<p>2FA was turned off on your Learnix account. If this wasn’t you, secure your account now.</p>`,
        text: '2FA was disabled on your Learnix account. If this wasn’t you, secure your account.',
      });
    }
    return { disabled: true };
  }
}

@ApiTags('security')
@Controller('security')
@UseGuards(AuthGuard)
export class SecurityController {
  constructor(private readonly security: SecurityService) {}

  @Post('2fa/totp/setup')
  setup(@CurrentUser() user: AuthedUser) {
    return this.security.setupTotp(user.userId);
  }

  @Post('2fa/totp/enable')
  enable(@CurrentUser() user: AuthedUser, @Body(zodBody(totpEnableSchema)) body: any) {
    return this.security.enableTotp(user.userId, body.code);
  }

  @Delete('2fa')
  disable(@CurrentUser() user: AuthedUser, @Body(zodBody(disable2faSchema)) body: any) {
    return this.security.disableTotp(user.userId, body.password, body.code);
  }
}

@Module({
  imports: [ProvidersModule],
  controllers: [SecurityController],
  providers: [SecurityService],
})
export class SecurityModule {}
