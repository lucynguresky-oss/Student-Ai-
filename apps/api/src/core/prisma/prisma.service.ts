import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@learnix/db';
import { ConfigService } from '../config/config.service';

/**
 * PrismaService.
 *
 * Scale note (see docs/SCALE.md): the API is read-heavy (profile lookups, track lists,
 * session validation). We expose an optional read-replica client so hot GET paths can be
 * routed to a replica, keeping the primary free for writes. When DATABASE_REPLICA_URL is
 * unset, `read` falls back to the primary so behaviour is identical in dev/test.
 *
 * Connection pooling is handled at the URL layer (PgBouncer in transaction mode in prod —
 * append ?pgbouncer=true&connection_limit=1 to DATABASE_URL). Do NOT open more Prisma
 * pools than the DB can serve across all instances.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly replica?: PrismaClient;

  constructor(private readonly config: ConfigService) {
    super({
      datasources: { db: { url: config.env.DATABASE_URL } },
      log: config.isProd ? ['warn', 'error'] : ['warn', 'error'],
    });

    if (config.env.DATABASE_REPLICA_URL) {
      this.replica = new PrismaClient({
        datasources: { db: { url: config.env.DATABASE_REPLICA_URL } },
        log: ['warn', 'error'],
      });
    }
  }

  /**
   * Read-optimized client. Returns the replica when DATABASE_REPLICA_URL is configured, else
   * the primary. Note: model delegates (`.user`, `.session`, …) are only reliably exposed on
   * the concrete client instances, so callers use `prisma.user` directly on hot paths today;
   * `readClient` is available for explicit replica routing where a replica exists.
   */
  get readClient(): PrismaClient {
    return this.replica ?? (this as unknown as PrismaClient);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    if (this.replica) {
      await this.replica.$connect();
      this.logger.log('Connected primary + read replica');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    if (this.replica) await this.replica.$disconnect();
  }
}
