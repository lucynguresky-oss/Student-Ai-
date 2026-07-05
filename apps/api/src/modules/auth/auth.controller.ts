import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { RecoveryService } from './recovery.service';
import { OAuthService } from './oauth.service';
import { TokenService } from '../../core/tokens/token.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuthGuard, Public } from '../../core/tokens/auth.guard';
import { RateLimitGuard, RateLimit, RateLimits } from '../../core/rate-limit/rate-limit.guard';
import { CurrentUser, deviceContextFrom, zodBody, type AuthedUser } from '../../core/http/request-context';
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from './cookies';
import { ConfigService } from '../../core/config/config.service';
import { AppException } from '../../core/http/app-exception';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { UAParser } from 'ua-parser-js';
import {
  registerEmailSchema,
  registerPhoneStartSchema,
  registerPhoneVerifySchema,
  guestSchema,
  guestConvertSchema,
  loginSchema,
  loginOtpStartSchema,
  loginOtpVerifySchema,
  twoFactorVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailConfirmSchema,
  ERROR_CODES,
} from '@learnix/validation';

/** Enrich device context with parsed UA name (§4 Session.deviceName) + session id when authed. */
function ctxFrom(req: FastifyRequest, user?: AuthedUser) {
  const base = deviceContextFrom(req);
  const ua = new UAParser(base.userAgent ?? '');
  const browser = ua.getBrowser().name;
  const os = ua.getOS().name;
  const deviceName = browser && os ? `${browser} on ${os}` : (os ?? browser ?? undefined);
  return { ...base, deviceName, deviceType: 'web', currentSessionId: user?.sessionId };
}

@ApiTags('auth')
@Controller('auth')
@UseGuards(AuthGuard, RateLimitGuard) // AuthGuard first; @Public opts out
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly recovery: RecoveryService,
    private readonly oauth: OAuthService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
    private readonly analytics: AnalyticsService,
  ) {}

  // ---------- Registration ----------
  @Public()
  @RateLimit(...RateLimits.register)
  @Post('register/email')
  @ApiOperation({ summary: 'Register with email + password + username' })
  async registerEmail(@Body(zodBody(registerEmailSchema)) body: any, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const { pair } = await this.auth.registerEmail(body, ctxFrom(req));
    setAuthCookies(res, pair, this.config);
    return { accessToken: pair.accessToken, sessionId: pair.sessionId };
  }

  @Public()
  @RateLimit(...RateLimits.otpSend)
  @HttpCode(200)
  @Post('register/phone/start')
  async registerPhoneStart(@Body(zodBody(registerPhoneStartSchema)) body: any) {
    await this.auth.registerPhoneStart(body.phone);
    return { ok: true }; // enumeration-safe generic response
  }

  @Public()
  @RateLimit(...RateLimits.register)
  @Post('register/phone/verify')
  async registerPhoneVerify(@Body(zodBody(registerPhoneVerifySchema)) body: any, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const { pair } = await this.auth.registerPhoneVerify(body, ctxFrom(req));
    setAuthCookies(res, pair, this.config);
    return { accessToken: pair.accessToken, sessionId: pair.sessionId };
  }

  // ---------- Guest ----------
  @Public()
  @Post('guest')
  async guest(@Body(zodBody(guestSchema)) body: any, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const { pair } = await this.auth.createGuest(body.deviceId, ctxFrom(req));
    setAuthCookies(res, pair, this.config);
    return { accessToken: pair.accessToken, sessionId: pair.sessionId, isGuest: true };
  }

  @Post('guest/convert')
  @ApiOperation({ summary: 'Upgrade a guest to a real account in place (keeps userId + progress)' })
  async convert(@CurrentUser() user: AuthedUser, @Body(zodBody(guestConvertSchema)) body: any, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const { pair } = await this.auth.convertGuest(user.userId, body, ctxFrom(req, user));
    setAuthCookies(res, pair, this.config);
    return { accessToken: pair.accessToken, sessionId: pair.sessionId, isGuest: false };
  }

  // ---------- Login ----------
  @Public()
  @RateLimit(...RateLimits.login)
  @Post('login')
  async login(@Body(zodBody(loginSchema)) body: any, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const outcome = await this.auth.login(body, ctxFrom(req));
    if (outcome.kind === '2fa_required') {
      return { twoFactorRequired: true, challengeToken: outcome.challengeToken };
    }
    setAuthCookies(res, outcome.pair, this.config);
    return { accessToken: outcome.pair.accessToken, sessionId: outcome.pair.sessionId };
  }

  @Public()
  @RateLimit(...RateLimits.otpSend)
  @HttpCode(200)
  @Post('login/otp/start')
  async loginOtpStart(@Body(zodBody(loginOtpStartSchema)) body: any) {
    await this.auth.loginOtpStart(body.phone);
    return { ok: true };
  }

  @Public()
  @RateLimit(...RateLimits.login)
  @Post('login/otp/verify')
  async loginOtpVerify(@Body(zodBody(loginOtpVerifySchema)) body: any, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const { pair } = await this.auth.loginOtpVerify(body.phone, body.otp, ctxFrom(req));
    setAuthCookies(res, pair, this.config);
    return { accessToken: pair.accessToken, sessionId: pair.sessionId };
  }

  @Public()
  @RateLimit(...RateLimits.login)
  @Post('2fa/verify')
  async twoFactorVerify(@Body(zodBody(twoFactorVerifySchema)) body: any, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const { pair } = await this.auth.verifyTwoFactor(body, ctxFrom(req));
    setAuthCookies(res, pair, this.config);
    return { accessToken: pair.accessToken, sessionId: pair.sessionId };
  }

  // ---------- OAuth ----------
  @Public()
  @Post('oauth/:provider/start')
  async oauthStart(@Param('provider') provider: string) {
    return this.oauth.start(provider);
  }

  @Public()
  @Get('oauth/:provider/callback')
  async oauthCallback(@Param('provider') provider: string, @Query('code') code: string, @Query('state') state: string, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    if (!code || !state) throw AppException.badRequest(ERROR_CODES.OAUTH_STATE_INVALID);
    const pair = await this.oauth.callback(provider, code, state, ctxFrom(req));
    setAuthCookies(res, pair, this.config);
    // In the real app this redirects back into the SPA; here we return tokens for testability.
    return { accessToken: pair.accessToken, sessionId: pair.sessionId };
  }

  // ---------- Refresh / logout ----------
  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token; reuse of a rotated token revokes the family' })
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const cookies = (req as unknown as { cookies?: Record<string, string> }).cookies;
    const presented = cookies?.[REFRESH_COOKIE] ?? (req.body as { refreshToken?: string })?.refreshToken;
    if (!presented) throw AppException.unauthorized(ERROR_CODES.AUTH_TOKEN_INVALID);
    try {
      const pair = await this.tokens.rotate(presented, ctxFrom(req));
      setAuthCookies(res, pair, this.config);
      return { accessToken: pair.accessToken, sessionId: pair.sessionId };
    } catch (e) {
      clearAuthCookies(res, this.config);
      if ((e as Error).message === 'REUSE') throw AppException.unauthorized(ERROR_CODES.AUTH_REFRESH_REUSE);
      throw AppException.unauthorized(ERROR_CODES.AUTH_TOKEN_INVALID);
    }
  }

  @Post('logout')
  async logout(@CurrentUser() user: AuthedUser, @Res({ passthrough: true }) res: FastifyReply) {
    await this.tokens.revokeSession(user.sessionId);
    clearAuthCookies(res, this.config);
    return { ok: true };
  }

  @Post('logout-all')
  async logoutAll(@CurrentUser() user: AuthedUser, @Query('all') all: string, @Res({ passthrough: true }) res: FastifyReply) {
    const keep = all === 'true' ? undefined : user.sessionId;
    const count = await this.tokens.revokeAllExcept(user.userId, keep);
    if (all === 'true') clearAuthCookies(res, this.config);
    this.analytics.track('session_revoked', { userId: user.userId, sessionId: user.sessionId }, { scope: 'logout_all', count });
    return { revoked: count };
  }

  // ---------- Verification & recovery ----------
  @Public()
  @Post('password/forgot')
  @RateLimit(...RateLimits.forgotPassword)
  @HttpCode(200)
  async forgot(@Body(zodBody(forgotPasswordSchema)) body: any) {
    await this.recovery.forgotPassword(body.identifier);
    return { ok: true }; // ALWAYS 200 (§9.1)
  }

  @Public()
  @Post('password/reset')
  async reset(@Body(zodBody(resetPasswordSchema)) body: any) {
    await this.recovery.resetPassword(body);
    return { ok: true };
  }

  @Post('password')
  async changePassword(@CurrentUser() user: AuthedUser, @Body(zodBody(changePasswordSchema)) body: any, @Req() req: FastifyRequest) {
    await this.recovery.changePassword(user.userId, body.currentPassword, body.newPassword, ctxFrom(req, user));
    return { ok: true };
  }
}

/** Email/phone verification endpoints (§5.2) live under /verify. */
@ApiTags('verify')
@Controller('verify')
@UseGuards(AuthGuard, RateLimitGuard)
export class VerifyController {
  constructor(
    private readonly recovery: RecoveryService,
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('email/send')
  async sendEmail(@CurrentUser() user: AuthedUser) {
    const userDb = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { email: true },
    });
    if (!userDb.email) {
      throw AppException.badRequest(ERROR_CODES.VALIDATION_ERROR, 'No email on file');
    }
    await this.auth.sendEmailVerification(user.userId, userDb.email);
    return { ok: true };
  }

  @Public()
  @Post('email/confirm')
  async confirmEmail(@Body(zodBody(verifyEmailConfirmSchema)) body: any) {
    await this.recovery.confirmEmailByToken(body.token);
    return { ok: true };
  }

  @Post('phone/send')
  async sendPhone(@CurrentUser() user: AuthedUser) {
    await this.recovery.sendPhoneVerification(user.userId);
    return { ok: true };
  }

  @Post('phone/confirm')
  async confirmPhone(@CurrentUser() user: AuthedUser, @Body() body: { code: string }) {
    await this.recovery.confirmPhone(user.userId, body.code);
    return { ok: true };
  }
}
