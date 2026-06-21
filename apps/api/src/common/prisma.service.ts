import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Shared Prisma service — singleton across the API.
 * Wraps PrismaClient so it can be injected via NestJS DI.
 */
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
