import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { CryptoService } from '../../core/crypto/crypto.service';
import { TokenService, type DeviceContext, type TokenPair } from '../../core/tokens/token.service';
import { ConfigService } from '../../core/config/config.service';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { AppException } from '../../core/http/app-exception';
import { AccountService } from '../users/account.service';
import { ERROR_CODES } from '@learnix/validation';
import { createHash, randomBytes } from 'node:crypto';
import type { OAuthProvider } from '@learnix/db';

interface OAuthProfile {
  provider: OAuthProvider;
  providerAccountId: string;
  email?: string;
  emailVerified?: boolean;
}

/**
 * OAuthService (§5.1). Google is implemented end-to-end (PKCE). Apple is DECIDED as
 * NOT-at-v1 (§15): the start endpoint returns a clear "not enabled" error so the abstraction
 * is present without requiring a paid Apple Developer account. Flip APPLE_CLIENT_ID to enable.
 *
 * Account linking rule (§5.1, §13): if the provider email matches an existing VERIFIED email,
 * link to that account instead of creating a duplicate.
 */
@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly crypto: CryptoService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
    private readonly analytics: AnalyticsService,
  ) {}

  /** Build the provider redirect URL + PKCE, stash the verifier keyed by state (10 min). */
  async start(provider: string): Promise<{ url: string; state: string }> {
    if (provider === 'apple') {
      if (!this.config.env.APPLE_CLIENT_ID) {
        throw AppException.badRequest(ERROR_CODES.VALIDATION_ERROR, 'Apple Sign-In is not enabled');
      }
    }
    if (provider !== 'google') throw AppException.notFound();
    const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } = this.config.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
      throw AppException.badRequest(ERROR_CODES.VALIDATION_ERROR, 'Google OAuth is not configured');
    }

    const state = randomBytes(16).toString('base64url');
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    await this.redis.client.set(`oauth:pkce:${state}`, JSON.stringify({ provider, codeVerifier }), 'EX', 600);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'select_account',
    });
    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`, state };
  }

  /** Exchange the code and resolve/link the account, returning tokens. */
  async callback(provider: string, code: string, state: string, ctx: DeviceContext): Promise<TokenPair> {
    const raw = await this.redis.client.get(`oauth:pkce:${state}`);
    if (!raw) throw AppException.badRequest(ERROR_CODES.OAUTH_STATE_INVALID);
    const { codeVerifier } = JSON.parse(raw) as { provider: string; codeVerifier: string };
    await this.redis.client.del(`oauth:pkce:${state}`);

    const profile = await this.exchangeGoogle(code, codeVerifier);
    const user = await this.findOrLink(profile, ctx);
    return this.tokens.issueForUser(user, ctx);
  }

  private async exchangeGoogle(code: string, codeVerifier: string): Promise<OAuthProfile> {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = this.config.env;
    const body = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
    });
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!tokenRes.ok) throw AppException.badRequest(ERROR_CODES.OAUTH_STATE_INVALID, 'Token exchange failed');
    const tokens = (await tokenRes.json()) as { id_token: string; access_token: string };

    // Decode id_token payload (already signed by Google; verified via HTTPS token endpoint).
    const payload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1]!, 'base64url').toString()) as {
      sub: string;
      email?: string;
      email_verified?: boolean;
    };
    return {
      provider: 'GOOGLE',
      providerAccountId: payload.sub,
      email: payload.email?.toLowerCase(),
      emailVerified: payload.email_verified,
    };
  }

  private async findOrLink(profile: OAuthProfile, ctx: DeviceContext) {
    // 1) Already linked?
    const linked = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: profile.provider, providerAccountId: profile.providerAccountId } },
      include: { user: true },
    });
    if (linked) return linked.user;

    // 2) Email matches an existing VERIFIED account → link (§13).
    if (profile.email && profile.emailVerified) {
      const existing = await this.prisma.user.findUnique({ where: { email: profile.email } });
      if (existing && existing.emailVerifiedAt) {
        await this.prisma.oAuthAccount.create({
          data: { userId: existing.id, provider: profile.provider, providerAccountId: profile.providerAccountId, providerEmail: profile.email },
        });
        await this.prisma.securityEvent.create({
          data: { userId: existing.id, type: 'OAUTH_LINKED', ipAddress: ctx.ipAddress, metadata: { provider: profile.provider } },
        });
        return existing;
      }
    }

    // 3) Create a fresh account.
    const username = await this.freeUsername(profile.email);
    const user = await this.prisma.user.create({
      data: {
        username,
        email: profile.email,
        emailVerifiedAt: profile.emailVerified ? new Date() : null,
        profile: { create: { displayHandle: username } },
        preferences: { create: { notifications: { push: { streak: true, social: true, product: true }, email: { streak: true, social: false, product: true }, sms: { streak: false, social: false, product: false } } } },
        onboarding: { create: {} },
        oauthAccounts: { create: { provider: profile.provider, providerAccountId: profile.providerAccountId, providerEmail: profile.email } },
      },
    });
    this.analytics.track('signup_completed', { userId: user.id }, { method: profile.provider.toLowerCase() });
    return user;
  }

  private async freeUsername(email?: string): Promise<string> {
    const base = (email?.split('@')[0] ?? 'learner').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 20) || 'learner';
    for (let i = 0; i < 20; i++) {
      const candidate = i === 0 ? base : `${base}${Math.floor(Math.random() * 9000) + 100}`;
      if (candidate.length < 3) continue;
      const exists = await this.prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
      if (!exists) return candidate;
    }
    return AccountService.guestUsername();
  }
}
