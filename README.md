# Learnix — Accounts Centre + Personalized Onboarding

Backend reference implementation for **Learnix**, a global education platform (Instagram-style
social layer + Duolingo-style gamified learning) for a **worldwide** audience. Mascot **Lumi**;
brand gradient teal → blue → purple.

This repo contains a **working, tested reference core** of the backend plus a build prompt handing
the rest to the Antigravity coding agent. It was built to validate the hard, security-critical
parts before generating breadth.

## Status

| Package | What | State |
|---|---|---|
| `packages/db` | Prisma schema, migrations, seed | ✅ migrated; 13 tracks, 65 placement Qs, 3 demo users |
| `packages/validation` | Shared zod schemas, error codes, global phone, geo data | ✅ 46 unit tests pass |
| `apps/api` | NestJS 10 + Fastify — 11 modules, 61 endpoints | ✅ compiles, builds, **18 e2e tests pass** |
| `apps/web` | Next.js app | ⏳ deferred (see `apps/api/docs/ANTIGRAVITY_BUILD_PROMPT.md` §8) |

**Global by design:** 252 countries + 185 languages (CLDR-derived, embedded), libphonenumber-based
phone handling, Twilio-global SMS with cost-aware African routing, RTL-ready, timezone-aware.

## Architecture

- **Stateless API** — all shared state in Postgres + Redis, so it scales by adding instances.
  Details in `apps/api/docs/SCALE.md`.
- **Security-first** — argon2id+pepper passwords, RS256 access JWTs, opaque rotating refresh tokens
  with **family reuse-detection**, Redis-backed OTP with attempt-locking, distributed rate limits,
  AES-GCM for TOTP secrets, enumeration-safe auth, minor safeguards. All proven by e2e tests.
- **Validation once** — `@learnix/validation` is imported by both API and (future) web app.

## Run it

Prereqs: Node 22, pnpm 9, Postgres, Redis.

```bash
pnpm install

# Generate keys + env
cp .env.example .env
bash scripts/gen-keys.sh        # writes RS256 keypair into .env

# Database
pnpm --filter @learnix/db migrate       # apply migrations
pnpm --filter @learnix/db seed          # tracks + placement + demo users

# Build shared packages
pnpm --filter @learnix/validation build
pnpm --filter @learnix/db build

# Run the API
pnpm --filter @learnix/api start        # http://localhost:4000, docs at /docs
```

## Test

```bash
# Unit (shared validation — global phone, geo, schemas, scoring)
pnpm --filter @learnix/validation test

# E2E (real Postgres + Redis; mock SMS/email/storage)
#   attack cases, lifecycle, onboarding journey
cd apps/api && npx jest --config test/jest-e2e.json
```

## Regenerate OpenAPI

```bash
cd apps/api && npx ts-node src/openapi-export.ts   # writes docs/openapi.json (61 paths)
```

## Handoff docs

- `apps/api/docs/ANTIGRAVITY_BUILD_PROMPT.md` — **the build prompt for Antigravity** (canonical spec
  for completing the full production build, global scope + scale features throughout).
- `apps/api/docs/SCALE.md` — high-scale architecture (pooling, replicas, caching, queues, workers,
  observability).
- `apps/api/docs/BUILD_LOG.md` — schema additions, resolved decisions, globalization notes.
- `apps/api/docs/openapi.json` — API contract, 61 endpoints.

## Tech stack

pnpm + Turbo monorepo · NestJS 10 + Fastify · Prisma + PostgreSQL · Redis · BullMQ · zod ·
libphonenumber-js · argon2 · jose (RS256) · otplib · Swagger/OpenAPI. Providers: Twilio + Africa's
Talking (hybrid), Resend, Cloudflare R2, Google OAuth.
