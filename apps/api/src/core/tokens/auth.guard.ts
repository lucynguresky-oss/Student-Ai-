import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { JwtService } from '../tokens/jwt.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../http/app-exception';
import { ERROR_CODES } from '@learnix/validation';
import type { AuthedUser } from '../http/request-context';

export const IS_PUBLIC_KEY = 'is_public';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const BLOCK_GUEST_KEY = 'block_guest';
/** Mark a route as unavailable to guest accounts (they must convert first). */
export const RequireRegistered = () => SetMetadata(BLOCK_GUEST_KEY, true);

const ACCESS_COOKIE = 'lx_access';

/**
 * AuthGuard — supports both cookie (web) and bearer (future mobile) transport (§2).
 * Verifies the RS256 access token, confirms the session is still live and the account is
 * usable, then attaches `req.user`.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<FastifyRequest & { user?: AuthedUser }>();
    const token = this.extractToken(req);
    if (!token) throw AppException.unauthorized();

    let claims;
    try {
      claims = await this.jwt.verifyAccess(token);
    } catch {
      throw AppException.unauthorized(ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    // Confirm session is live (supports server-side revocation / logout-all).
    const session = await this.prisma.session.findUnique({
      where: { id: claims.sid },
      select: { revokedAt: true, expiresAt: true, user: { select: { status: true, isGuest: true, isMinor: true } } },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw AppException.unauthorized(ERROR_CODES.AUTH_TOKEN_INVALID);
    }
    if (session.user.status === 'BANNED') {
      throw AppException.forbidden(ERROR_CODES.AUTH_ACCOUNT_BANNED);
    }

    const blockGuest = this.reflector.getAllAndOverride<boolean>(BLOCK_GUEST_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (blockGuest && session.user.isGuest) {
      throw AppException.forbidden(ERROR_CODES.AUTH_GUEST_ONLY, 'Create an account to do this');
    }

    req.user = {
      userId: claims.sub,
      sessionId: claims.sid,
      isGuest: session.user.isGuest,
      isMinor: session.user.isMinor,
    };
    return true;
  }

  private extractToken(req: FastifyRequest): string | null {
    const cookies = (req as unknown as { cookies?: Record<string, string> }).cookies;
    if (cookies?.[ACCESS_COOKIE]) return cookies[ACCESS_COOKIE];
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return null;
  }
}
