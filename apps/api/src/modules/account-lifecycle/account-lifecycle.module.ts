import { Body, Controller, Get, Post, Query, Req, UseGuards, Injectable, Logger, Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Queue, Worker } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CryptoService } from '../../core/crypto/crypto.service';
import { TokenService } from '../../core/tokens/token.service';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { ConfigService } from '../../core/config/config.service';
import { RedisService } from '../../core/redis/redis.service';
import { NotificationService } from '../../providers/providers.module';
import { AppException } from '../../core/http/app-exception';
import { AuthGuard, Public } from '../../core/tokens/auth.guard';
import { CurrentUser, deviceContextFrom, zodBody, type AuthedUser } from '../../core/http/request-context';
import { ProvidersModule } from '../../providers/providers.module';
import { passwordConfirmSchema, ERROR_CODES } from '@learnix/validation';

const GRACE_DAYS = 30;

@Injectable()
export class AccountLifecycleService {
  private readonly logger = new Logger(AccountLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly tokens: TokenService,
    private readonly analytics: AnalyticsService,
    private readonly notifications: NotificationService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  private async requirePassword(userId: string, password: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash || !(await this.crypto.verifyPassword(user.passwordHash, password))) {
      throw AppException.unauthorized(ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }
    return user;
  }

  /** Deactivate — reversible; reactivates automatically on next successful login (§5.5). */
  async deactivate(userId: string, password: string, ctx: { ipAddress?: string; userAgent?: string }) {
    await this.requirePassword(userId, password);
    await this.prisma.user.update({ where: { id: userId }, data: { status: 'DEACTIVATED' } });
    await this.tokens.revokeAllExcept(userId); // all sessions
    await this.prisma.securityEvent.create({ data: { userId, type: 'ACCOUNT_DEACTIVATED', ipAddress: ctx.ipAddress, metadata: {} } });
    this.analytics.track('account_deactivated', { userId }, {});
    return { status: 'DEACTIVATED' };
  }

  /** Delete — 30-day grace, hard purge by daily job (§5.5). */
  async requestDelete(userId: string, password: string, ctx: { ipAddress?: string; userAgent?: string }) {
    await this.requirePassword(userId, password);
    await this.prisma.user.update({ where: { id: userId }, data: { status: 'PENDING_DELETION', deletionRequestedAt: new Date() } });
    await this.tokens.revokeAllExcept(userId);
    await this.prisma.securityEvent.create({ data: { userId, type: 'DELETION_REQUESTED', ipAddress: ctx.ipAddress, metadata: {} } });
    this.analytics.track('deletion_requested', { userId }, {});
    const purgeAt = new Date(Date.now() + GRACE_DAYS * 24 * 3600 * 1000);
    return { status: 'PENDING_DELETION', purgeAt };
  }

  /** Cancel deletion during grace (§5.5). Called when a user logs in during the window. */
  async cancelDeletion(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.status !== 'PENDING_DELETION') throw AppException.badRequest(ERROR_CODES.ACCOUNT_NOT_IN_GRACE);
    await this.prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE', deletionRequestedAt: null } });
    await this.prisma.securityEvent.create({ data: { userId, type: 'DELETION_REQUESTED', metadata: { cancelled: true } } });
    this.analytics.track('deletion_cancelled', { userId }, {});
    return { status: 'ACTIVE' };
  }

  /** Data export (§5.5, §9.2 right of access) — queues a job, emails a signed link. */
  async requestExport(userId: string) {
    const bundle = await this.buildExport(userId);
    const token = this.crypto.randomToken(24);
    // Store the bundle briefly keyed by a signed token (72h). Real impl uploads to storage.
    await this.redis.client.set(`export:${this.crypto.sha256(token)}`, JSON.stringify(bundle), 'EX', 72 * 3600);
    const link = `${this.config.env.API_BASE_URL}/account/export/download?token=${token}`;
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
    if (user.email) {
      await this.notifications.sendEmail({
        to: user.email,
        subject: 'Your Learnix data export is ready',
        html: `<p>Your data export is ready. <a href="${link}">Download it here</a> (link expires in 72 hours).</p>`,
        text: `Your Learnix data export: ${link}`,
      });
    }
    return { queued: true };
  }

  async downloadExport(token: string) {
    const raw = await this.redis.client.get(`export:${this.crypto.sha256(token)}`);
    if (!raw) throw AppException.notFound(ERROR_CODES.NOT_FOUND, 'Export link expired');
    return JSON.parse(raw);
  }

  private async buildExport(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true, preferences: true, onboarding: true, tracks: { include: { track: true } }, securityEvents: { take: 500, orderBy: { createdAt: 'desc' } } },
    });
    // Data minimization: export the user's own data only, no secrets.
    return {
      exportedAt: new Date().toISOString(),
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone, ageBand: user.ageBand, createdAt: user.createdAt },
      profile: user.profile,
      preferences: user.preferences,
      onboarding: user.onboarding,
      tracks: user.tracks.map((t) => ({ slug: t.track.slug, level: t.level, isPrimary: t.isPrimary })),
      securityEvents: user.securityEvents.map((e) => ({ type: e.type, at: e.createdAt })),
    };
  }

  // ---------- Parental consent (§9.3, under-13 learning-only → unlock) ----------
  async requestParentalConsent(userId: string, parentEmail: string) {
    const token = this.crypto.randomToken(24);
    await this.redis.client.set(`consent:${this.crypto.sha256(token)}`, JSON.stringify({ userId }), 'EX', 7 * 24 * 3600);
    const link = `${this.config.env.WEB_ORIGIN}/parental-consent/${token}`;
    await this.notifications.sendEmail({
      to: parentEmail,
      subject: 'Approve your child’s Learnix account',
      html: `<p>A child has signed up for Learnix, a learning app, and needs your approval to unlock social features. <a href="${link}">Approve here</a>. If you don’t recognize this, you can ignore it — the account stays in learning-only mode.</p>`,
      text: `Approve your child's Learnix account: ${link}`,
    });
    return { sent: true };
  }

  async confirmParentalConsent(token: string) {
    const raw = await this.redis.client.get(`consent:${this.crypto.sha256(token)}`);
    if (!raw) throw AppException.badRequest(ERROR_CODES.VERIFICATION_TOKEN_INVALID);
    const { userId } = JSON.parse(raw) as { userId: string };
    await this.prisma.user.update({ where: { id: userId }, data: { parentalConsentAt: new Date() } });
    await this.redis.client.del(`consent:${this.crypto.sha256(token)}`);
    return { ok: true };
  }

  /** Hard purge of accounts past the grace window (§5.5). Idempotent; run daily. */
  async purgeExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 3600 * 1000);
    const expired = await this.prisma.user.findMany({
      where: { status: 'PENDING_DELETION', deletionRequestedAt: { lte: cutoff } },
      select: { id: true },
    });
    for (const { id } of expired) {
      // Cascade removes profile/prefs/onboarding/tracks/sessions; anonymize security events.
      await this.prisma.securityEvent.updateMany({ where: { userId: id }, data: { userId: null, ipAddress: null, userAgent: null } });
      await this.prisma.user.delete({ where: { id } });
      this.logger.log(`Purged account ${id}`);
    }
    return expired.length;
  }
}

@ApiTags('account')
@Controller('account')
@UseGuards(AuthGuard)
export class AccountLifecycleController {
  constructor(private readonly lifecycle: AccountLifecycleService) {}

  @Post('deactivate')
  deactivate(@CurrentUser() user: AuthedUser, @Body(zodBody(passwordConfirmSchema)) body: any, @Req() req: FastifyRequest) {
    return this.lifecycle.deactivate(user.userId, body.password, deviceContextFrom(req));
  }

  @Post('delete')
  del(@CurrentUser() user: AuthedUser, @Body(zodBody(passwordConfirmSchema)) body: any, @Req() req: FastifyRequest) {
    return this.lifecycle.requestDelete(user.userId, body.password, deviceContextFrom(req));
  }

  @Post('delete/cancel')
  cancel(@CurrentUser() user: AuthedUser) {
    return this.lifecycle.cancelDeletion(user.userId);
  }

  @Post('export')
  export(@CurrentUser() user: AuthedUser) {
    return this.lifecycle.requestExport(user.userId);
  }

  @Public()
  @Get('export/download')
  download(@Query('token') token: string) {
    return this.lifecycle.downloadExport(token);
  }

  @Post('parental-consent/request')
  consentRequest(@CurrentUser() user: AuthedUser, @Body() body: { parentEmail: string }) {
    return this.lifecycle.requestParentalConsent(user.userId, body.parentEmail);
  }

  @Public()
  @Post('parental-consent/confirm')
  consentConfirm(@Body() body: { token: string }) {
    return this.lifecycle.confirmParentalConsent(body.token);
  }
}

/**
 * Purge scheduler. A BullMQ repeatable job triggers purgeExpired() daily. Running it through
 * the queue (not a naked setInterval) means it survives restarts and runs once across many
 * instances (scale requirement).
 */
@Injectable()
export class PurgeScheduler implements OnModuleInit, OnModuleDestroy {
  private queue!: Queue;
  private worker!: Worker;

  constructor(private readonly lifecycle: AccountLifecycleService, private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const connection = { url: this.config.env.REDIS_URL } as any;
    this.queue = new Queue('lifecycle-purge', { connection });
    await this.queue.add('daily', {}, { repeat: { pattern: '0 3 * * *' }, jobId: 'daily-purge' }); // 03:00 UTC
    this.worker = new Worker('lifecycle-purge', async () => this.lifecycle.purgeExpired(), { connection });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }
}

@Module({
  imports: [ProvidersModule],
  controllers: [AccountLifecycleController],
  providers: [AccountLifecycleService, PurgeScheduler],
  exports: [AccountLifecycleService],
})
export class AccountLifecycleModule {}
