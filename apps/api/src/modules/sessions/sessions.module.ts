import { Controller, Delete, Get, Param, Query, UseGuards, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TokenService } from '../../core/tokens/token.service';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { AuthGuard } from '../../core/tokens/auth.guard';
import { CurrentUser, type AuthedUser } from '../../core/http/request-context';

@ApiTags('sessions')
@Controller()
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get('sessions')
  async list(@CurrentUser() user: AuthedUser) {
    const sessions = await this.prisma.session.findMany({
      where: { userId: user.userId, revokedAt: null },
      orderBy: { lastActiveAt: 'desc' },
      select: { id: true, deviceName: true, deviceType: true, approxLocation: true, lastActiveAt: true, createdAt: true },
    });
    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        deviceName: s.deviceName ?? 'Unknown device',
        deviceType: s.deviceType,
        approxLocation: s.approxLocation,
        lastActiveAt: s.lastActiveAt,
        isCurrent: s.id === user.sessionId,
      })),
    };
  }

  @Delete('sessions/:id')
  async revoke(@CurrentUser() user: AuthedUser, @Param('id') id: string) {
    // Only allow revoking own sessions.
    const owned = await this.prisma.session.findFirst({ where: { id, userId: user.userId }, select: { id: true } });
    if (owned) {
      await this.tokens.revokeSession(id);
      this.analytics.track('session_revoked', { userId: user.userId, sessionId: user.sessionId }, { target: id });
    }
    return { ok: true };
  }

  @Get('security/events')
  async events(@CurrentUser() user: AuthedUser, @Query('cursor') cursor?: string): Promise<any> {
    // Cursor-based pagination (scale: avoids OFFSET on a high-volume append table).
    const take = 20;
    const events = await this.prisma.securityEvent.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, type: true, ipAddress: true, userAgent: true, createdAt: true, metadata: true },
    });
    const hasMore = events.length > take;
    const page = hasMore ? events.slice(0, take) : events;
    return { events: page, nextCursor: hasMore ? page[page.length - 1]!.id : null };
  }
}

@Module({ controllers: [SessionsController] })
export class SessionsModule {}
