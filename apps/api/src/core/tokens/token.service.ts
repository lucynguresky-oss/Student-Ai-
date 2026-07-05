import { Injectable, Logger } from '@nestjs/common';
import type { User } from '@learnix/db';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { JwtService } from './jwt.service';
import { ConfigService } from '../config/config.service';

export interface DeviceContext {
  deviceName?: string;
  deviceType?: string; // web | android | ios
  ipAddress?: string;
  userAgent?: string;
  approxLocation?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string; // opaque; caller sets it as an httpOnly cookie or returns as bearer
  sessionId: string;
  expiresAt: Date;
}

const MAX_SESSIONS = 10; // §5.1: max 10 active sessions/user, oldest evicted

/**
 * TokenService — the security-critical heart of auth (§5.1).
 *
 * Refresh flow:
 *  1. issueForUser() creates a Session with a fresh tokenFamily and stores sha256(refresh).
 *  2. rotate() looks up the presented refresh by hash.
 *     - If it maps to a live session → rotate: mint a new refresh, update the hash, keep the family.
 *     - If it maps to an ALREADY-ROTATED/absent hash within a known family → REUSE. Revoke the
 *       entire family, log SECURITY event, and force re-login. (Detects stolen-token replay.)
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private refreshExpiry(): Date {
    const days = this.config.env.REFRESH_TOKEN_TTL_DAYS;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  async issueForUser(user: Pick<User, 'id' | 'isGuest' | 'isMinor'>, ctx: DeviceContext): Promise<TokenPair> {
    // Evict oldest sessions beyond the cap.
    const active = await this.prisma.session.findMany({
      where: { userId: user.id, revokedAt: null },
      orderBy: { lastActiveAt: 'asc' },
      select: { id: true },
    });
    if (active.length >= MAX_SESSIONS) {
      const toEvict = active.slice(0, active.length - MAX_SESSIONS + 1).map((s) => s.id);
      await this.prisma.session.updateMany({
        where: { id: { in: toEvict } },
        data: { revokedAt: new Date() },
      });
    }

    const refreshToken = this.crypto.randomToken(32);
    const tokenFamily = this.crypto.randomToken(16);
    const expiresAt = this.refreshExpiry();

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: this.crypto.sha256(refreshToken),
        tokenFamily,
        deviceName: ctx.deviceName,
        deviceType: ctx.deviceType,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        approxLocation: ctx.approxLocation,
        expiresAt,
      },
    });

    const accessToken = await this.jwt.signAccess({
      sub: user.id,
      sid: session.id,
      isGuest: user.isGuest,
      isMinor: user.isMinor,
    });

    return { accessToken, refreshToken, sessionId: session.id, expiresAt };
  }

  /**
   * Rotate a refresh token. Returns a new pair on success. Throws 'REUSE' or 'INVALID'.
   *
   * Reuse detection works by tracking the immediately-previous token hash on the session:
   *  - Presented == current hash → legitimate rotation. We shift current→prev, mint a new current.
   *  - Presented == a session's PREV hash → the client replayed a token we already rotated away.
   *    That means the token was captured/leaked → revoke the whole family and force re-login.
   *  - Presented matches nothing live → invalid/forged.
   */
  async rotate(presentedRefresh: string, ctx: DeviceContext): Promise<TokenPair> {
    const hash = this.crypto.sha256(presentedRefresh);

    // Case 1: presented is the CURRENT token of a live session → rotate.
    const current = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
      include: { user: { select: { id: true, isGuest: true, isMinor: true, status: true } } },
    });
    if (current && current.revokedAt === null && current.expiresAt > new Date()) {
      const newRefresh = this.crypto.randomToken(32);
      const expiresAt = this.refreshExpiry();
      await this.prisma.session.update({
        where: { id: current.id },
        data: {
          prevRefreshTokenHash: hash, // remember the token we're rotating away from
          refreshTokenHash: this.crypto.sha256(newRefresh),
          rotatedAt: new Date(),
          lastActiveAt: new Date(),
          expiresAt,
          ipAddress: ctx.ipAddress ?? current.ipAddress,
          userAgent: ctx.userAgent ?? current.userAgent,
        },
      });
      const accessToken = await this.jwt.signAccess({
        sub: current.user.id,
        sid: current.id,
        isGuest: current.user.isGuest,
        isMinor: current.user.isMinor,
      });
      return { accessToken, refreshToken: newRefresh, sessionId: current.id, expiresAt };
    }

    // Case 2: presented matches a session's PREVIOUS hash → replay of a rotated-away token.
    const replayed = await this.prisma.session.findUnique({
      where: { prevRefreshTokenHash: hash },
      select: { tokenFamily: true, userId: true },
    });
    if (replayed) {
      await this.revokeFamily(replayed.tokenFamily, replayed.userId, ctx, 'refresh_reuse_detected');
      throw new Error('REUSE');
    }

    // Case 3: presented belongs to an already-revoked session row → also treat as reuse.
    if (current && current.revokedAt !== null) {
      await this.revokeFamily(current.tokenFamily, current.userId, ctx, 'refresh_reuse_revoked_session');
      throw new Error('REUSE');
    }

    // Case 4: unknown/forged.
    throw new Error('INVALID');
  }

  /** Revoke every session in a family (reuse-detection response). */
  async revokeFamily(
    tokenFamily: string,
    userId: string,
    ctx: DeviceContext,
    reason: string,
  ): Promise<void> {
    await this.prisma.session.updateMany({
      where: { tokenFamily, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.securityEvent.create({
      data: {
        userId,
        type: 'SESSION_REVOKED',
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { reason, tokenFamily },
      },
    });
    this.logger.warn(`Revoked token family ${tokenFamily} for user ${userId} (${reason})`);
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllExcept(userId: string, keepSessionId?: string): Promise<number> {
    const res = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null, ...(keepSessionId ? { NOT: { id: keepSessionId } } : {}) },
      data: { revokedAt: new Date() },
    });
    return res.count;
  }
}
