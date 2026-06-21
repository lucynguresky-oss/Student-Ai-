import { z } from 'zod';

/**
 * Zod-validated environment schema.
 * Fails fast on boot if any required variable is missing or invalid.
 */
export const EnvSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .url()
    .describe('PostgreSQL connection string'),

  // Redis
  REDIS_URL: z
    .string()
    .default('redis://localhost:6379')
    .describe('Redis connection string'),

  // JWT
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters')
    .describe('Secret for signing JWT access tokens'),

  JWT_REFRESH_SECRET: z
    .string()
    .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters')
    .describe('Secret for signing JWT refresh tokens'),

  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default('15m')
    .describe('Access token expiration (e.g., "15m")'),

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default('30d')
    .describe('Refresh token expiration (e.g., "30d")'),

  // Server
  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(4000)
    .describe('API server port'),

  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development')
    .describe('Runtime environment'),

  // Meilisearch (optional in dev)
  MEILI_URL: z.string().optional(),
  MEILI_MASTER_KEY: z.string().optional(),

  // AI (optional)
  OPENAI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

/**
 * Validates process.env against the schema.
 * Call this at the top of main.ts before NestFactory.create.
 */
export function validateEnv(): EnvConfig {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error('\n❌ Environment validation failed:\n');
    console.error(formatted);
    console.error('\nCheck your .env / .env.local file and try again.\n');
    process.exit(1);
  }

  return result.data;
}
