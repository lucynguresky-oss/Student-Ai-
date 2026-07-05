import { Controller, Get, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Public } from '../tokens/auth.guard';

/**
 * Health/metrics (scale requirement). Load balancers and orchestrators poll these to route
 * traffic only to healthy instances and to drain during rollouts.
 *  - /healthz   liveness  (process is up)
 *  - /readyz    readiness (DB + Redis reachable → safe to receive traffic)
 *  - /metrics   minimal Prometheus-format counters (extend with real histograms)
 */
@ApiTags('health')
@Controller()
export class HealthController {
  private started = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get('healthz')
  liveness() {
    return { status: 'ok', uptimeSec: Math.round((Date.now() - this.started) / 1000) };
  }

  @Public()
  @Get('readyz')
  async readiness() {
    const checks: Record<string, 'ok' | 'fail'> = { db: 'fail', redis: 'fail' };
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.db = 'ok';
    } catch {
      /* stays fail */
    }
    try {
      const pong = await this.redis.client.ping();
      checks.redis = pong === 'PONG' ? 'ok' : 'fail';
    } catch {
      /* stays fail */
    }
    const ready = Object.values(checks).every((c) => c === 'ok');
    return { ready, checks };
  }

  @Public()
  @Get('metrics')
  async metrics() {
    // Minimal exposition; production wires prom-client with request/latency/queue histograms.
    const mem = process.memoryUsage();
    return [
      '# HELP learnix_uptime_seconds Process uptime',
      '# TYPE learnix_uptime_seconds gauge',
      `learnix_uptime_seconds ${Math.round((Date.now() - this.started) / 1000)}`,
      '# HELP learnix_memory_rss_bytes Resident set size',
      '# TYPE learnix_memory_rss_bytes gauge',
      `learnix_memory_rss_bytes ${mem.rss}`,
    ].join('\n');
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
