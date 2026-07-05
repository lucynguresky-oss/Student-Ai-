import type { FastifyReply } from 'fastify';
import type { ConfigService } from '../../core/config/config.service';
import type { TokenPair } from '../../core/tokens/token.service';

export const ACCESS_COOKIE = 'lx_access';
export const REFRESH_COOKIE = 'lx_refresh';
const REFRESH_PATH = '/auth/refresh';

/**
 * Cookie transport for web (§5.1): httpOnly, Secure, SameSite=Lax. Access cookie scoped to /,
 * refresh cookie scoped to /auth/refresh so it's only ever sent to the rotation endpoint.
 */
export function setAuthCookies(reply: FastifyReply, pair: TokenPair, config: ConfigService): void {
  const secure = config.isProd;
  const domain = config.env.COOKIE_DOMAIN;

  reply.setCookie(ACCESS_COOKIE, pair.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    domain,
    maxAge: 15 * 60, // 15 min
  });
  reply.setCookie(REFRESH_COOKIE, pair.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: REFRESH_PATH,
    domain,
    maxAge: config.env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

export function clearAuthCookies(reply: FastifyReply, config: ConfigService): void {
  const domain = config.env.COOKIE_DOMAIN;
  reply.clearCookie(ACCESS_COOKIE, { path: '/', domain });
  reply.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH, domain });
}
