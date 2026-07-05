import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { RedisService } from '../redis/redis.service';
import { AppException } from '../http/app-exception';
import { deviceContextFrom } from '../http/request-context';

/**
 * Distributed rate limiting (§9.1). Backed by Redis sliding windows so limits hold across
 * every API instance behind the load balancer — a per-process limiter would let N instances
 * each allow the full quota, defeating the point at scale.
 *
 * A route can declare MULTIPLE limits (e.g. login = 5/min/IP AND 10/hr/identifier).
 */
export type RateKeySource = 'ip' | 'identifier';

export interface RateRule {
  limit: number;
  windowSeconds: number;
  by: RateKeySource;
  /** Optional label so different routes sharing a source don't collide. */
  bucket?: string;
}

export const RATE_LIMIT_KEY = 'rate_limit_rules';
export const RateLimit = (...rules: RateRule[]) =>
  applyDecorators(SetMetadata(RATE_LIMIT_KEY, rules));

/** Common presets straight from §9.1. */
export const RateLimits = {
  login: [
    { limit: 5, windowSeconds: 60, by: 'ip', bucket: 'login' },
    { limit: 10, windowSeconds: 3600, by: 'identifier', bucket: 'login' },
  ] as RateRule[],
  otpSend: [
    { limit: 3, windowSeconds: 600, by: 'identifier', bucket: 'otp' },
    { limit: 10, windowSeconds: 86400, by: 'identifier', bucket: 'otp_day' },
  ] as RateRule[],
  usernameCheck: [{ limit: 30, windowSeconds: 60, by: 'ip', bucket: 'uname' }] as RateRule[],
  register: [{ limit: 5, windowSeconds: 3600, by: 'ip', bucket: 'register' }] as RateRule[],
  forgotPassword: [
    { limit: 3, windowSeconds: 3600, by: 'identifier', bucket: 'forgot' },
  ] as RateRule[],
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules = this.reflector.getAllAndOverride<RateRule[] | undefined>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!rules?.length) return true;

    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const { ipAddress } = deviceContextFrom(req);
    const ip = ipAddress ?? 'unknown';
    const body = (req.body ?? {}) as Record<string, unknown>;
    const identifier = String(body.identifier ?? body.email ?? body.phone ?? ip).toLowerCase();

    for (const rule of rules) {
      const subject = rule.by === 'ip' ? ip : identifier;
      const key = `rl:${rule.bucket ?? 'default'}:${rule.by}:${subject}`;
      const count = await this.redis.slidingIncr(key, rule.windowSeconds);
      if (count > rule.limit) {
        const ttl = await this.redis.client.ttl(key);
        throw AppException.rateLimited(ttl > 0 ? ttl : rule.windowSeconds);
      }
    }
    return true;
  }
}
