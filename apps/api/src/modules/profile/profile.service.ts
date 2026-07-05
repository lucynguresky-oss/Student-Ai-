import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { OtpService } from '../../core/tokens/otp.service';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { NotificationService } from '../../providers/providers.module';
import { STORAGE_PROVIDER, type StorageProvider } from '../../providers/storage/storage.provider';
import { AppException } from '../../core/http/app-exception';
import { AccountService } from '../users/account.service';
import type { DeviceContext } from '../../core/tokens/token.service';
import {
  ERROR_CODES,
  usernameSchema,
  type UpdateProfileInput,
} from '@learnix/validation';

const USERNAME_COOLDOWN_DAYS = 14;
const USERNAME_MAX_CHANGES_PER_YEAR = 2;

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly analytics: AnalyticsService,
    private readonly notifications: NotificationService,
    private readonly accounts: AccountService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Record<string, any> | null> {
    // Minor privacy is enforced elsewhere; profile fields here don't include visibility.
    await this.prisma.profile.update({
      where: { userId },
      data: {
        displayName: input.displayName ?? undefined,
        bio: input.bio ?? undefined,
        links: input.links ?? undefined,
        country: input.country ?? undefined,
        language: input.language ?? undefined,
      },
    });
    return this.accounts.selfObject(userId);
  }

  async checkUsername(candidate: string) {
    const parsed = usernameSchema.safeParse(candidate);
    if (!parsed.success) {
      return { available: false, reason: 'invalid', suggestions: [] as string[] };
    }
    const available = await this.accounts.isUsernameAvailable(parsed.data);
    const suggestions = available ? [] : await this.accounts.suggestUsernames(parsed.data);
    return { available, suggestions };
  }

  /** Username change: 14-day cooldown, max 2/365d, old handle reserved 14 days (§5.3). */
  async changeUsername(userId: string, candidate: string) {
    const parsed = usernameSchema.safeParse(candidate);
    if (!parsed.success) throw AppException.badRequest(ERROR_CODES.USERNAME_INVALID);
    const newUsername = parsed.data;

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.username === newUsername) return { username: newUsername };

    // Cooldown.
    if (user.usernameChangedAt) {
      const days = (Date.now() - user.usernameChangedAt.getTime()) / (24 * 3600 * 1000);
      if (days < USERNAME_COOLDOWN_DAYS) throw AppException.badRequest(ERROR_CODES.USERNAME_CHANGE_COOLDOWN);
    }
    // Yearly limit (count resets are handled by a job; here we check the rolling counter).
    if (user.usernameChangeCount >= USERNAME_MAX_CHANGES_PER_YEAR) {
      throw AppException.badRequest(ERROR_CODES.USERNAME_CHANGE_LIMIT);
    }

    const free = await this.accounts.isUsernameAvailable(newUsername);
    if (!free) throw AppException.conflict(ERROR_CODES.USERNAME_TAKEN);

    const oldUsername = user.username;
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { username: newUsername, usernameChangedAt: new Date(), usernameChangeCount: { increment: 1 } },
      }),
      this.prisma.profile.update({ where: { userId }, data: { displayHandle: newUsername } }),
    ]);

    // Reserve the old handle for 14 days (Redis TTL guard consulted by availability check).
    await this.accounts.invalidateUsername(oldUsername);
    await this.accounts.invalidateUsername(newUsername);
    this.analytics.track('username_changed', { userId }, {});
    return { username: newUsername };
  }

  // ---------- Avatar (§5.3) ----------
  async presignAvatar(userId: string, contentType: string) {
    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    const key = `avatars/${userId}/${Date.now()}.${ext}`;
    return this.storage.presignPut(key, contentType, 5 * 1024 * 1024);
  }

  async confirmAvatar(userId: string, key: string) {
    // In production a worker fetches the object, validates magic bytes + size, and generates
    // 320px + 96px webp variants (§5.3). Here we record the public URL.
    const publicUrl = this.storage.publicUrl(key);
    await this.prisma.profile.update({ where: { userId }, data: { avatarUrl: publicUrl } });
    this.analytics.track('avatar_uploaded', { userId }, {});
    return { avatarUrl: publicUrl };
  }

  // ---------- Email / phone change (§5.3) ----------
  async changeEmailStart(userId: string, email: string) {
    const taken = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (taken) throw AppException.conflict(ERROR_CODES.EMAIL_TAKEN);
    const code = await this.otp.issue('CHANGE_EMAIL', `${userId}:${email}`);
    await this.notifications.sendEmail({
      to: email,
      subject: 'Confirm your new Learnix email',
      html: `<p>Enter this code to confirm your new email: <b>${code}</b></p>`,
      text: `Your Learnix email change code: ${code}`,
    });
  }

  async changeEmailConfirm(userId: string, email: string, code: string, ctx: DeviceContext) {
    const check = await this.otp.verify('CHANGE_EMAIL', `${userId}:${email}`, code);
    if (!check.ok) throw AppException.badRequest(ERROR_CODES[check.reason]);
    const old = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
    await this.prisma.user.update({ where: { id: userId }, data: { email, emailVerifiedAt: new Date() } });
    await this.prisma.securityEvent.create({ data: { userId, type: 'EMAIL_CHANGED', ipAddress: ctx.ipAddress, metadata: {} } });
    // Alert the OLD address (§5.3).
    if (old.email) {
      await this.notifications.sendEmail({
        to: old.email,
        subject: 'Your Learnix email was changed',
        html: `<p>The email on your account was changed. If this wasn’t you, contact support immediately.</p>`,
        text: 'Your Learnix email was changed. If this wasn’t you, contact support.',
      });
    }
    return { ok: true };
  }

  async changePhoneStart(userId: string, phone: string) {
    const taken = await this.prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (taken) throw AppException.conflict(ERROR_CODES.PHONE_TAKEN);
    const code = await this.otp.issue('CHANGE_PHONE', `${userId}:${phone}`);
    await this.notifications.sendSms(phone, `Your Learnix verification code is ${code}.`);
  }

  async changePhoneConfirm(userId: string, phone: string, code: string, ctx: DeviceContext) {
    const check = await this.otp.verify('CHANGE_PHONE', `${userId}:${phone}`, code);
    if (!check.ok) throw AppException.badRequest(ERROR_CODES[check.reason]);
    await this.prisma.user.update({ where: { id: userId }, data: { phone, phoneVerifiedAt: new Date() } });
    await this.prisma.securityEvent.create({ data: { userId, type: 'PHONE_CHANGED', ipAddress: ctx.ipAddress, metadata: {} } });
    return { ok: true };
  }
}
