import {
  createParamDecorator,
  ExecutionContext,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ZodError, type ZodTypeAny } from 'zod';
import { AppException } from './app-exception';
import { ERROR_CODES } from '@learnix/validation';

/** Body-validation pipe backed by a zod schema (single source of truth with the web app). */
@Injectable()
export class ZodBody<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}
  transform(value: unknown): unknown {
    try {
      return this.schema.parse(value);
    } catch (e) {
      if (e instanceof ZodError) {
        throw AppException.badRequest(ERROR_CODES.VALIDATION_ERROR, undefined, {
          issues: e.issues.map((i) => ({ path: i.path, message: i.message })),
        });
      }
      throw e;
    }
  }
}

export function zodBody<T extends ZodTypeAny>(schema: T): ZodBody<T> {
  return new ZodBody(schema);
}

export interface AuthedUser {
  userId: string;
  sessionId: string;
  isGuest: boolean;
  isMinor: boolean;
}

/** Injects the authenticated user attached by AuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthedUser => {
    const req = ctx.switchToHttp().getRequest<FastifyRequest & { user?: AuthedUser }>();
    if (!req.user) throw AppException.unauthorized();
    return req.user;
  },
);

/** Coarse device/IP context from the request, used for session records + security events. */
export function deviceContextFrom(req: FastifyRequest): {
  ipAddress?: string;
  userAgent?: string;
} {
  const fwd = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim() || req.ip;
  const ua = req.headers['user-agent'];
  return { ipAddress: ip, userAgent: Array.isArray(ua) ? ua[0] : ua };
}
