import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { RedisService } from '../src/core/redis/redis.service';

export interface TestApp {
  app: NestFastifyApplication;
  prisma: PrismaService;
  redis: RedisService;
  /** Raw injects returning parsed JSON body + set-cookie map. */
  req: (opts: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    url: string;
    body?: unknown;
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
    ip?: string;
  }) => Promise<{ status: number; json: any; cookies: Record<string, string> }>;
  reset: () => Promise<void>;
  close: () => Promise<void>;
}

export async function bootstrapTestApp(): Promise<TestApp> {
  const adapter = new FastifyAdapter({ logger: false });
  let app: NestFastifyApplication;
  try {
    app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
      logger: ['error', 'warn'],
      abortOnError: false,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('TEST APP BOOT FAILURE:', (e as Error).message);
    throw e;
  }
  await app.register(fastifyCookie as any);
  await app.init();
  await (app.getHttpAdapter().getInstance() as any).ready();

  const prisma = app.get(PrismaService);
  const redis = app.get(RedisService);
  const instance = app.getHttpAdapter().getInstance();

  const req: TestApp['req'] = async ({ method, url, body, cookies, headers, ip }) => {
    const cookieHeader = cookies
      ? Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
      : undefined;
    const res = await instance.inject({
      method,
      url,
      payload: body as any,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        // Distinct client IP per test isolates distributed rate-limit buckets.
        'x-forwarded-for': ip ?? `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...headers,
      },
    });
    const setCookies: Record<string, string> = {};
    const raw = res.headers['set-cookie'];
    const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const c of arr) {
      const [pair] = c.split(';');
      const eq = pair.indexOf('=');
      setCookies[pair.slice(0, eq)] = pair.slice(eq + 1);
    }
    let json: any = null;
    try {
      json = res.body ? JSON.parse(res.body) : null;
    } catch {
      json = res.body;
    }
    return { status: res.statusCode, json, cookies: setCookies };
  };

  const reset = async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "User","Session","SecurityEvent","BlockedUser","TwoFactor" RESTART IDENTITY CASCADE;',
    );
    // Clear the test Redis DB (OTP, rate limits, caches, challenges).
    await redis.client.flushdb();
  };

  const close = async () => {
    await app.close();
  };

  return { app, prisma, redis, req, reset, close };
}
