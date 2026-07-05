import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { AuthGuard, Public } from '../../core/tokens/auth.guard';

/**
 * Tracks (§5.6 step 1). The catalogue changes rarely and is read on every onboarding, so it's
 * cached in Redis (5 min) — a hot read that would otherwise hit the DB for every new visitor.
 */
@ApiTags('tracks')
@Controller('tracks')
@UseGuards(AuthGuard)
export class TracksController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  async list() {
    return this.redis.getOrSet('tracks:active', 300, async () => {
      const tracks = await this.prisma.learningTrack.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, slug: true, title: true, description: true, iconUrl: true, category: true },
      });
      return { tracks };
    });
  }
}

@Module({ controllers: [TracksController] })
export class TracksModule {}
