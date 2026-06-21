import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async check() {
    return {
      data: {
        status: 'ok',
        version: '0.1.0',
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        timestamp: new Date().toISOString(),
      },
    };
  }

  async checkReadiness() {
    const services: Record<string, 'up' | 'down'> = {};

    // Check Postgres
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      services.postgres = 'up';
    } catch {
      services.postgres = 'down';
    }

    const allUp = Object.values(services).every((s) => s === 'up');

    return {
      data: {
        status: allUp ? 'ok' : 'degraded',
        version: '0.1.0',
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        timestamp: new Date().toISOString(),
        services,
      },
    };
  }
}
