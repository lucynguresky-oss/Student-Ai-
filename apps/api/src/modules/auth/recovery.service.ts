import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { CryptoService } from '../../core/crypto/crypto.service';
import { PasswordStrengthService } from '../../core/crypto/password-strength.service';
import { OtpService } from '../../core/tokens/otp.service';
import { TokenService, type DeviceContext } from '../../core/tokens/token.service';
import { NotificationService } from '../../providers/providers.module';
import { ConfigService } from '../../core/config/config.service';
import { AppException } from '../../core/http/app-exception';
import { ERROR_CODES, type ResetPasswordInput, normalizeKenyanPhone } from '@learnix/validation';

/**
 * RecoveryService — verification + password recovery/change (§5.2).
 * Every entry point is enumeration-safe: forgot-password ALWAYS returns success (§9.1) and
 * only actually dispatches when the identifier resolves.
 */
@Injectable()
export class RecoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly crypto: CryptoService,
    private readonly strength: PasswordStrengthService,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly notifications: NotificationService,
    private readonly config: ConfigService,
  ) {}

  private assertStrong(pw: string): void {
    const r = this.strength.evaluate(pw);
    if (!r.ok) throw AppException.badRequest(ERROR_CODES.VALIDATION_ERROR, r.reason);
  }

  // ---------- Email verification ----------
  async confirmEmailByToken(token: string): Promise<void> {
    const key = `verify:email:${this.crypto.sha256(token)}`;
    const raw = await this.redis.client.get(key);
    if (!raw) throw AppException.badRequest(ERROR_CODES.VERIFICATION_TOKEN_INVALID);
    const { userId, email } = JSON.parse(raw) as { userId: string; email: string };
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date(), email },
    });
    await this.redis.client.del(key);
  }

  async confirmEmailByCode(userId: string, email: string, code: string): Promise<void> {
    const check = await this.otp.verify('VERIFY_EMAIL', email, code);
    if (!check.ok) throw AppException.badRequest(ERROR_CODES[check.reason]);
    await this.prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  }

  // ---------- Phone verification ----------
  async sendPhoneVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { phone: true } });
    if (!user.phone) throw AppException.badRequest(ERROR_CODES.PHONE_INVALID, 'No phone on file');
    const code = await this.otp.issue('VERIFY_PHONE', user.phone);
    await this.notifications.sendSms(user.phone, `Your Learnix verification code is ${code}.`);
  }

  async confirmPhone(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { phone: true } });
    if (!user.phone) throw AppException.badRequest(ERROR_CODES.PHONE_INVALID);
    const check = await this.otp.verify('VERIFY_PHONE', user.phone, code);
    if (!check.ok) throw AppException.badRequest(ERROR_CODES[check.reason]);
    await this.prisma.user.update({ where: { id: userId }, data: { phoneVerifiedAt: new Date() } });
  }

  // ---------- Forgot / reset ----------
  async forgotPassword(identifier: string): Promise<void> {
    // ALWAYS 200 (§9.1). Resolve email or phone; dispatch only if it exists.
    const id = identifier.trim();
    const asPhone = normalizeKenyanPhone(id);
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: id.toLowerCase() }, { username: id.toLowerCase() }, ...(asPhone.ok ? [{ phone: asPhone.e164! }] : [])],
      },
      select: { id: true, email: true, phone: true },
    });
    if (!user) return; // silent

    if (user.email) {
      const token = this.crypto.randomToken(24);
      await this.redis.client.set(`reset:${this.crypto.sha256(token)}`, JSON.stringify({ userId: user.id }), 'EX', 3600);
      const link = `${this.config.env.WEB_ORIGIN}/reset-password/${token}`;
      await this.notifications.sendEmail({
        to: user.email,
        subject: 'Reset your Learnix password',
        html: `<p>Reset your password:</p><p><a href="${link}">Choose a new password</a></p><p>This link expires in 1 hour. If you didn’t request this, ignore this email.</p>`,
        text: `Reset your Learnix password: ${link}`,
      });
    } else if (user.phone) {
      const code = await this.otp.issue('RESET_PASSWORD', user.phone);
      await this.notifications.sendSms(user.phone, `Your Learnix password reset code is ${code}.`);
    }
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    this.assertStrong(input.newPassword);
    let userId: string | null = null;

    if (input.token) {
      const key = `reset:${this.crypto.sha256(input.token)}`;
      const raw = await this.redis.client.get(key);
      if (!raw) throw AppException.badRequest(ERROR_CODES.VERIFICATION_TOKEN_INVALID);
      userId = (JSON.parse(raw) as { userId: string }).userId;
      await this.redis.client.del(key);
    } else if (input.otp && input.identifier) {
      const asPhone = normalizeKenyanPhone(input.identifier);
      if (!asPhone.ok) throw AppException.badRequest(ERROR_CODES.PHONE_INVALID);
      const check = await this.otp.verify('RESET_PASSWORD', asPhone.e164!, input.otp);
      if (!check.ok) throw AppException.badRequest(ERROR_CODES[check.reason]);
      const user = await this.prisma.user.findUnique({ where: { phone: asPhone.e164! }, select: { id: true } });
      userId = user?.id ?? null;
    }
    if (!userId) throw AppException.badRequest(ERROR_CODES.VERIFICATION_TOKEN_INVALID);

    const passwordHash = await this.crypto.hashPassword(input.newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    // Revoke ALL sessions on reset (§5.2).
    await this.tokens.revokeAllExcept(userId);
    await this.prisma.securityEvent.create({ data: { userId, type: 'PASSWORD_CHANGED', metadata: { via: 'reset' } } });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string, ctx: DeviceContext): Promise<void> {
    this.assertStrong(newPassword);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash || !(await this.crypto.verifyPassword(user.passwordHash, currentPassword))) {
      throw AppException.unauthorized(ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }
    const passwordHash = await this.crypto.hashPassword(newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    // Revoke OTHER sessions on change (§5.2), keep the current one.
    await this.tokens.revokeAllExcept(userId, ctx.currentSessionId);
    await this.prisma.securityEvent.create({
      data: { userId, type: 'PASSWORD_CHANGED', ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, metadata: { via: 'change' } },
    });
    // "Was this you?" alert (§9.1).
    if (user.email) {
      await this.notifications.sendEmail({
        to: user.email,
        subject: 'Your Learnix password was changed',
        html: `<p>Your password was just changed. If this wasn’t you, reset your password immediately and review your login activity.</p>`,
        text: 'Your Learnix password was changed. If this wasn’t you, reset it immediately.',
      });
    }
  }
}
