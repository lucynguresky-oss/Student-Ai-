import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '../config/config.service';

/**
 * RedisService — a single shared connection plus small, safe helpers.
 *
 * Redis is the coordination layer that makes the API horizontally scalable (see docs/SCALE.md):
 *  - OTP codes (§4 "OTP codes live in Redis only")
 *  - distributed sliding-window rate limits (§9.1) — correct across N instances
 *  - cache-aside for hot reads (tracks, username availability, profile-by-handle)
 *
 * BullMQ opens its own connections; this one is for direct key ops.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis(config.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    this.logger.log('Redis connected');
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }

  // ---------- Cache-aside helper ----------
  /**
   * getOrSet: return cached JSON if present, else compute, cache with TTL, and return.
   * Used for hot read paths. Cache failures never break the request — they degrade to a
   * direct compute.
   */
  async getOrSet<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
    try {
      const hit = await this.client.get(key);
      if (hit) return JSON.parse(hit) as T;
    } catch (e) {
      this.logger.warn(`cache get failed for ${key}: ${(e as Error).message}`);
    }
    const value = await compute();
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (e) {
      this.logger.warn(`cache set failed for ${key}: ${(e as Error).message}`);
    }
    return value;
  }

  async invalidate(...keys: string[]): Promise<void> {
    if (keys.length) await this.client.del(...keys);
  }

  /**
   * Distributed sliding-window counter. Increments the window key and sets TTL on first hit.
   * Returns the current count within the window. O(1), safe across instances.
   */
  async slidingIncr(key: string, windowSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, windowSeconds);
    return count;
  }
}
