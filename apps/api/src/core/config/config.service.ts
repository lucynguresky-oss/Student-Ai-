import { Injectable } from '@nestjs/common';
import { z } from 'zod';

/**
 * Central config (§9.1 "secrets only via env"). Validated at boot — the app refuses to
 * start with a malformed environment rather than failing at first request.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1),
  DATABASE_URL_TEST: z.string().optional(),
  // Optional read-replica URL for read/write split at scale (see scale doc).
  DATABASE_REPLICA_URL: z.string().optional(),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_KID: z.string().default('key-dev'),
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),

  PASSWORD_PEPPER: z.string().min(16),
  TWO_FACTOR_ENC_KEY: z.string().min(16), // base64 32-byte key

  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  API_BASE_URL: z.string().default('http://localhost:4000'),

  SMS_PROVIDER: z.enum(['mock', 'africastalking', 'twilio', 'hybrid']).default('mock'),
  EMAIL_PROVIDER: z.enum(['mock', 'resend', 'ses']).default('mock'),
  STORAGE_PROVIDER: z.enum(['mock', 'r2', 's3']).default('mock'),

  AT_API_KEY: z.string().optional(),
  AT_USERNAME: z.string().optional(),
  AT_SENDER_ID: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Learnix <no-reply@learnix.app>'),

  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().default('auto'),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_PUBLIC_BASE_URL: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_REDIRECT_URI: z.string().optional(),

  POLICY_VERSION: z.string().default('2026-01-01'),
});

export type Env = z.infer<typeof envSchema>;

@Injectable()
export class ConfigService {
  readonly env: Env;

  constructor() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new Error(`Invalid environment configuration: ${issues}`);
    }
    this.env = parsed.data;
  }

  get isProd(): boolean {
    return this.env.NODE_ENV === 'production';
  }
  get isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }

  /** PEM keys are stored with literal \n in env; expand them for jose. */
  get jwtPrivateKeyPem(): string {
    return this.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
  }
  get jwtPublicKeyPem(): string {
    return this.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
  }
}
