import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Loads and validates environment. Fails fast on missing critical secrets in production.
 * ⚠️ DECIDE defaults (§15) resolved: SMS=africastalking, EMAIL=resend, STORAGE=r2, Apple=off,
 * under-13=learning-only — but all default to `mock` in dev/test unless overridden.
 */
function loadDotEnv() {
  // Minimal .env loader (no dependency). Real deployments inject env directly.
  try {
    const path = resolve(process.cwd(), '.env');
    const txt = readFileSync(path, 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1]!;
      if (process.env[key] !== undefined) continue;
      let val = m[2]!.trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val.replace(/\\n/g, '\n');
    }
  } catch {
    // no .env — rely on real env
  }
}
loadDotEnv();

function req(name: string): string {
  const v = process.env[name];
  if (!v) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required env: ${name}`);
    }
    return '';
  }
  return v;
}

const isTest = process.env.NODE_ENV === 'test';

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest,
  port: parseInt(process.env.PORT ?? '4000', 10),

  databaseUrl: isTest
    ? req('DATABASE_URL_TEST') || req('DATABASE_URL')
    : req('DATABASE_URL'),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',

  jwt: {
    kid: process.env.JWT_KID ?? 'key-dev',
    privateKey: req('JWT_PRIVATE_KEY'),
    publicKey: req('JWT_PUBLIC_KEY'),
    accessTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
    refreshTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS ?? '30', 10),
  },

  passwordPepper: req('PASSWORD_PEPPER'),
  twoFactorEncKey: req('TWO_FACTOR_ENC_KEY'),

  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  cookieDomain: process.env.COOKIE_DOMAIN ?? 'localhost',
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:4000',

  providers: {
    sms: (process.env.SMS_PROVIDER ?? 'mock') as 'mock' | 'africastalking' | 'twilio',
    email: (process.env.EMAIL_PROVIDER ?? 'mock') as 'mock' | 'resend' | 'ses',
    storage: (process.env.STORAGE_PROVIDER ?? 'mock') as 'mock' | 'r2' | 's3',
  },

  at: {
    apiKey: process.env.AT_API_KEY ?? '',
    username: process.env.AT_USERNAME ?? '',
    senderId: process.env.AT_SENDER_ID ?? '',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
    from: process.env.EMAIL_FROM ?? 'Learnix <no-reply@learnix.app>',
  },
  storage: {
    bucket: process.env.STORAGE_BUCKET ?? '',
    region: process.env.STORAGE_REGION ?? 'auto',
    endpoint: process.env.STORAGE_ENDPOINT ?? '',
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? '',
    publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL ?? 'http://localhost:4000/mock-media',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:4000/auth/oauth/google/callback',
  },

  // Apple Sign-In OFF at v1 (§15 decision). Endpoints exist but return a clear "not enabled" error.
  appleEnabled: (process.env.APPLE_ENABLED ?? 'false') === 'true',

  policyVersion: process.env.POLICY_VERSION ?? '2026-01-01',
};

export type Env = typeof env;
