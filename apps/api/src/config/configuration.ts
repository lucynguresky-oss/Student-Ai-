export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  // CORS_ORIGINS: comma-separated list of allowed origins.
  // Leave unset in dev to allow all origins.
  cors: {
    origins: process.env.CORS_ORIGINS,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    voyageApiKey: process.env.VOYAGE_API_KEY,
    moderationModel:
      process.env.MODERATION_MODEL ?? 'claude-haiku-4-5-20251001',
  },
  // Rate limiting — global defaults, can be overridden per-route with @Throttle()
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10), // ms window
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10), // req/window
  },
});

