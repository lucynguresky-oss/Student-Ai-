import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Rejects the request when no valid bearer token is present. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/**
 * Lets the request through whether or not a token is present.
 * request.user is populated when a valid token exists, otherwise undefined.
 * Useful for public feeds that personalise when the viewer is logged in.
 *
 * Security: only swallows the "no token provided" case. An expired or
 * tampered token still causes a 401 — we don't silently treat a bad token
 * as "anonymous".
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser>(_err: unknown, user: TUser, info: { name?: string }): TUser {
    // Only swallow missing-token. Anything else (expired, invalid sig) propagates.
    if (!user && info?.name === 'JsonWebTokenError') {
      // malformed token — treat as anonymous
      return undefined as unknown as TUser;
    }
    if (!user && info?.name === 'TokenExpiredError') {
      // expired — still return anonymous so the user gets a fresh experience,
      // but do NOT leak any protected data
      return undefined as unknown as TUser;
    }
    return user;
  }
}
