import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CryptoService } from '../../core/crypto/crypto.service';
import { PasswordStrengthService } from '../../core/crypto/password-strength.service';
import { TokenService, type DeviceContext, type TokenPair } from '../../core/tokens/token.service';
import { OtpService } from '../../core/tokens/otp.service';
import { RedisService } from '../../core/redis/redis.service';
import { ConfigService } from '../../core/config/config.service';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { NotificationService } from '../../providers/providers.module';
import { AppException } from '../../core/http/app-exception';
import { AccountService } from '../users/account.service';
import {
  ERROR_CODES,
  type RegisterEmailInput,
  type RegisterPhoneVerifyInput,
  type GuestConvertInput,
  type LoginInput,
  type TwoFactorVerifyInput,
} from '@learnix/validation';
import { authenticator } from 'otplib';

const DEFAULT_NOTIFICATIONS = {
  push: { streak: true, social: true, product: true },
  email: { streak: true, social: false, product: true },
  sms: { streak: false, social: false, product: false },
};

export type LoginOutcome =
  | { kind: 'tokens'; pair: TokenPair }
  | { kind: '2fa_required'; challengeToken: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly strength: PasswordStrengthService,
    private readonly tokens: TokenService,
    private readonly otp: OtpService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly analytics: AnalyticsService,
    private readonly notifications: NotificationService,
    private readonly accounts: AccountService,
  ) {}

  private assertStrongPassword(pw: string): void {
    const r = this.strength.evaluate(pw);
    if (!r.ok) throw AppException.badRequest(ERROR_CODES.VALIDATION_ERROR, r.reason);
  }

  private async logEvent(userId: string | null, type: string, ctx: DeviceContext, metadata?: Record<string, unknown>) {
    await this.prisma.securityEvent.create({
      data: { userId: userId ?? undefined, type, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, metadata: (metadata ?? {}) as any },
    });
  }

  // ---------- Registration: email ----------
  async registerEmail(input: RegisterEmailInput, ctx: DeviceContext): Promise<{ pair: TokenPair }> {
    this.assertStrongPassword(input.password);

    // Enumeration-safe (§9.1): if the email OR username already exists, we must NOT reveal which.
    // We still can't create a duplicate, so we return an identical-looking success WITHOUT
    // touching the existing account. The client gets tokens only for genuinely new accounts;
    // for a collision we mint a throwaway guest-less response shape is unsafe — instead we
    // detect collision and short-circuit to the SAME generic 200 the caller would see, but
    // issue NO session for the existing account. (§13: "exact same body/status".)
    const [emailTaken, usernameTaken] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: input.email }, select: { id: true } }),
      this.prisma.user.findUnique({ where: { username: input.username }, select: { id: true } }),
    ]);

    if (emailTaken || usernameTaken) {
      // Do not create, do not leak. Return a response indistinguishable from success.
      // The account owner is unaffected; an attacker learns nothing.
      return { pair: await this.decoyPair(ctx) };
    }

    const passwordHash = await this.crypto.hashPassword(input.password);
    const user = await this.prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash,
        profile: { create: { displayHandle: input.username } },
        preferences: { create: { notifications: DEFAULT_NOTIFICATIONS } },
        onboarding: { create: {} },
      },
    });

    await this.logEvent(user.id, 'LOGIN_SUCCESS', ctx, {
      via: 'register_email',
      policyVersion: input.policyVersion,
      acceptedTos: input.acceptedTos,
    });
    const pair = await this.tokens.issueForUser(user, ctx);
    this.analytics.track('signup_completed', { userId: user.id, sessionId: pair.sessionId }, { method: 'email' });
    // Fire-and-forget verification email.
    void this.sendEmailVerification(user.id, input.email);
    return { pair };
  }

  /**
   * A response for the enumeration-collision case that is byte-identical in shape to a real
   * registration but is NOT bound to the existing account. We create an ephemeral guest that
   * is immediately abandoned — the attacker gets a valid-looking token for a throwaway account,
   * not the victim's. This keeps status + body identical (§13) while leaking nothing.
   */
  private async decoyPair(ctx: DeviceContext): Promise<TokenPair> {
    const user = await this.prisma.user.create({
      data: { username: AccountService.guestUsername(), isGuest: true, onboarding: { create: {} } },
    });
    return this.tokens.issueForUser(user, ctx);
  }

  // ---------- Registration: phone ----------
  async registerPhoneStart(phone: string): Promise<void> {
    // Enumeration-safe: always behaves the same. Only send if the number is free.
    const exists = await this.prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (!exists) {
      const code = await this.otp.issue('REGISTER_PHONE', phone);
      await this.notifications.sendSms(phone, `Your Learnix code is ${code}. It expires in 10 minutes.`);
    }
  }

  async registerPhoneVerify(input: RegisterPhoneVerifyInput, ctx: DeviceContext): Promise<{ pair: TokenPair }> {
    const check = await this.otp.verify('REGISTER_PHONE', input.phone, input.otp);
    if (!check.ok) throw AppException.badRequest(ERROR_CODES[check.reason]);

    const [phoneTaken, usernameTaken] = await Promise.all([
      this.prisma.user.findUnique({ where: { phone: input.phone }, select: { id: true } }),
      this.prisma.user.findUnique({ where: { username: input.username }, select: { id: true } }),
    ]);
    if (phoneTaken || usernameTaken) return { pair: await this.decoyPair(ctx) };

    const user = await this.prisma.user.create({
      data: {
        username: input.username,
        phone: input.phone,
        phoneVerifiedAt: new Date(),
        profile: { create: { displayHandle: input.username } },
        preferences: { create: { notifications: DEFAULT_NOTIFICATIONS } },
        onboarding: { create: {} },
      },
    });
    await this.logEvent(user.id, 'LOGIN_SUCCESS', ctx, { via: 'register_phone', policyVersion: input.policyVersion });
    const pair = await this.tokens.issueForUser(user, ctx);
    this.analytics.track('signup_completed', { userId: user.id, sessionId: pair.sessionId }, { method: 'phone' });
    return { pair };
  }

  // ---------- Guest ----------
  async createGuest(deviceId: string, ctx: DeviceContext): Promise<{ pair: TokenPair }> {
    const deviceHash = this.crypto.sha256(deviceId);
    // Resume an existing guest for this device if present (§6 abandonment resume).
    const existing = await this.prisma.user.findUnique({ where: { guestDeviceId: deviceHash } });
    const user =
      existing ??
      (await this.prisma.user.create({
        data: {
          username: AccountService.guestUsername(),
          isGuest: true,
          guestDeviceId: deviceHash,
          onboarding: { create: {} },
        },
      }));
    const pair = await this.tokens.issueForUser(user, ctx);
    if (!existing) this.analytics.track('guest_created', { userId: user.id, sessionId: pair.sessionId });
    return { pair };
  }

  /**
   * Guest → real account, IN PLACE (§5.1): keep userId, keep all onboarding progress, flip
   * isGuest=false. No row migration — the same User row is upgraded.
   */
  async convertGuest(userId: string, input: GuestConvertInput, ctx: DeviceContext): Promise<{ pair: TokenPair }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppException.notFound();
    if (!user.isGuest) throw AppException.forbidden(ERROR_CODES.AUTH_NOT_GUEST);

    const data: Record<string, unknown> = { isGuest: false };
    let method = input.method;

    if (input.method === 'email') {
      this.assertStrongPassword(input.password!);
      const taken = await this.prisma.user.findUnique({ where: { email: input.email! }, select: { id: true } });
      if (taken) throw AppException.conflict(ERROR_CODES.EMAIL_TAKEN);
      data.email = input.email;
      data.passwordHash = await this.crypto.hashPassword(input.password!);
    } else if (input.method === 'phone') {
      const check = await this.otp.verify('REGISTER_PHONE', input.phone!, input.otp!);
      if (!check.ok) throw AppException.badRequest(ERROR_CODES[check.reason]);
      const taken = await this.prisma.user.findUnique({ where: { phone: input.phone! }, select: { id: true } });
      if (taken) throw AppException.conflict(ERROR_CODES.PHONE_TAKEN);
      data.phone = input.phone;
      data.phoneVerifiedAt = new Date();
    } else {
      // OAuth conversion is handled in OAuthService.linkOnConvert; guarded here.
      throw AppException.badRequest(ERROR_CODES.VALIDATION_ERROR, 'Use the OAuth callback to convert via provider');
    }

    // Optionally replace the auto guest username.
    if (input.username && input.username !== user.username) {
      const free = await this.accounts.isUsernameAvailable(input.username);
      if (!free) throw AppException.conflict(ERROR_CODES.USERNAME_TAKEN);
      data.username = input.username;
      await this.prisma.profile.update({ where: { userId }, data: { displayHandle: input.username } });
      await this.accounts.invalidateUsername(user.username);
    }

    await this.prisma.user.update({ where: { id: userId }, data });
    await this.logEvent(userId, 'GUEST_CONVERTED', ctx, { method });

    const minutesAsGuest = Math.max(0, Math.round((Date.now() - user.createdAt.getTime()) / 60000));
    // Re-issue tokens so the access JWT reflects isGuest=false. Revoke the guest session that
    // made this call, then mint a fresh session on the (now registered) same user row.
    if (ctx.currentSessionId) await this.tokens.revokeSession(ctx.currentSessionId);
    const refreshed = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const pair = await this.tokens.issueForUser(refreshed, ctx);
    this.analytics.track('guest_converted', { userId, sessionId: pair.sessionId }, { method, minutesAsGuest });
    return { pair };
  }

  // ---------- Login ----------
  async login(input: LoginInput, ctx: DeviceContext): Promise<LoginOutcome> {
    // Resolve identifier: email | username | phone. Phone is already E.164-normalized by the
    // schema only when it parses as a phone; here identifier is a raw string, so try all three.
    const id = input.identifier.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: id.toLowerCase() },
          { username: id.toLowerCase() },
          { phone: id },
        ],
      },
      include: { twoFactor: true },
    });

    // Constant-ish work whether or not the user exists (mitigates timing enumeration).
    if (!user || !user.passwordHash) {
      await this.crypto.verifyPassword(
        '$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        input.password,
      );
      await this.logEvent(user?.id ?? null, 'LOGIN_FAILED', ctx, { reason: 'no_user_or_password' });
      this.analytics.track('login_failed', {}, { method: 'password' });
      throw AppException.unauthorized(ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }

    const ok = await this.crypto.verifyPassword(user.passwordHash, input.password);
    if (!ok) {
      await this.logEvent(user.id, 'LOGIN_FAILED', ctx, { reason: 'bad_password' });
      this.analytics.track('login_failed', { userId: user.id }, { method: 'password' });
      throw AppException.unauthorized(ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }

    // Deactivated → auto-reactivate on successful login (§5.5).
    if (user.status === 'DEACTIVATED') {
      await this.prisma.user.update({ where: { id: user.id }, data: { status: 'ACTIVE' } });
    }
    if (user.status === 'BANNED') throw AppException.forbidden(ERROR_CODES.AUTH_ACCOUNT_BANNED);

    // 2FA challenge if enabled.
    if (user.twoFactor?.enabledAt) {
      const challengeToken = this.crypto.randomToken(24);
      await this.otp.clearLock('TWO_FACTOR', user.id); // ensure fresh
      // Stash the pending login in Redis keyed by the challenge token (5 min).
      await this.stashChallenge(challengeToken, user.id, ctx);
      return { kind: '2fa_required', challengeToken };
    }

    await this.finishLogin(user.id, ctx, 'password');
    const pair = await this.tokens.issueForUser(user, ctx);
    return { kind: 'tokens', pair };
  }

  async loginOtpStart(phone: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (user) {
      const code = await this.otp.issue('LOGIN_OTP', phone);
      await this.notifications.sendSms(phone, `Your Learnix login code is ${code}.`);
    }
    // else: silent (enumeration-safe)
  }

  async loginOtpVerify(phone: string, code: string, ctx: DeviceContext): Promise<{ pair: TokenPair }> {
    const check = await this.otp.verify('LOGIN_OTP', phone, code);
    if (!check.ok) throw AppException.badRequest(ERROR_CODES[check.reason]);
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw AppException.unauthorized(ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    if (user.status === 'DEACTIVATED') {
      await this.prisma.user.update({ where: { id: user.id }, data: { status: 'ACTIVE' } });
    }
    await this.finishLogin(user.id, ctx, 'otp');
    const pair = await this.tokens.issueForUser(user, ctx);
    return { pair };
  }

  // ---------- 2FA verify ----------
  async verifyTwoFactor(input: TwoFactorVerifyInput, ctx: DeviceContext): Promise<{ pair: TokenPair }> {
    const stashed = await this.readChallenge(input.challengeToken);
    if (!stashed) throw AppException.unauthorized(ERROR_CODES.AUTH_2FA_INVALID);

    const tf = await this.prisma.twoFactor.findUnique({ where: { userId: stashed.userId } });
    if (!tf?.enabledAt) throw AppException.unauthorized(ERROR_CODES.AUTH_2FA_INVALID);

    let verified = false;
    if (input.totp) {
      const secret = this.crypto.decrypt(tf.totpSecretEnc);
      verified = authenticator.verify({ token: input.totp, secret });
    } else if (input.backupCode) {
      const codes = tf.backupCodes as Array<{ hash: string; usedAt: string | null }>;
      const hash = this.crypto.sha256(input.backupCode.trim());
      const match = codes.find((c) => c.hash === hash && !c.usedAt);
      if (match) {
        match.usedAt = new Date().toISOString();
        await this.prisma.twoFactor.update({ where: { userId: stashed.userId }, data: { backupCodes: codes } });
        verified = true;
      }
    }
    if (!verified) throw AppException.unauthorized(ERROR_CODES.AUTH_2FA_INVALID);

    await this.clearChallenge(input.challengeToken);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: stashed.userId } });
    await this.finishLogin(user.id, ctx, '2fa');
    const pair = await this.tokens.issueForUser(user, ctx);
    return { pair };
  }

  private async finishLogin(userId: string, ctx: DeviceContext, method: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
    await this.logEvent(userId, 'LOGIN_SUCCESS', ctx, { method });
    this.analytics.track('login_success', { userId }, { method });
  }

  // ---------- Email verification helper ----------
  async sendEmailVerification(userId: string, email: string): Promise<void> {
    const code = await this.otp.issue('VERIFY_EMAIL', email);
    const token = this.crypto.randomToken(24);
    // Store token→userId for the link path (24h) alongside the in-app code path.
    await this.redis.client.set(`verify:email:${this.crypto.sha256(token)}`, JSON.stringify({ userId, email }), 'EX', 24 * 3600);
    const link = `${this.config.env.WEB_ORIGIN}/verify/email/${token}`;
    await this.notifications.sendEmail({
      to: email,
      subject: 'Verify your Learnix email',
      html: `<p>Welcome to Learnix! Confirm your email:</p><p><a href="${link}">Verify email</a></p><p>Or enter this code: <b>${code}</b></p>`,
      text: `Verify your Learnix email: ${link}  (code: ${code})`,
    });
  }

  // ---------- 2FA challenge stash (Redis) ----------
  private async stashChallenge(token: string, userId: string, ctx: DeviceContext): Promise<void> {
    await this.redis.client.set(`2fa:challenge:${token}`, JSON.stringify({ userId }), 'EX', 300);
  }
  private async readChallenge(token: string): Promise<{ userId: string } | null> {
    const raw = await this.redis.client.get(`2fa:challenge:${token}`);
    return raw ? (JSON.parse(raw) as { userId: string }) : null;
  }
  private async clearChallenge(token: string): Promise<void> {
    await this.redis.client.del(`2fa:challenge:${token}`);
  }
}

// Augment DeviceContext locally with the optional session hint used during conversion.
declare module '../../core/tokens/token.service' {
  interface DeviceContext {
    currentSessionId?: string;
  }
}
