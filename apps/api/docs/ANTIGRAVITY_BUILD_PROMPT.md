# Learnix — Antigravity Build Prompt

**Role:** You are Antigravity, the coding agent building Learnix. This document is your canonical
spec. A working, tested **reference core** already exists in this monorepo (`apps/api`) — it is
the source of truth for *patterns, contracts, and security behaviour*. Your job is to extend it
to the full production surface, keep every pattern below intact, and never regress the security
guarantees that already have passing e2e tests.

Learnix is a **global** education platform — Instagram-style social layer + Duolingo-style gamified
learning — for a **worldwide** audience. Mascot: **Lumi**. Brand gradient: teal → blue → purple.

---

## 0. Golden rules (do not violate)

1. **The reference core is canonical.** Match its structure, naming, error envelope, and security
   patterns exactly. When in doubt, read the existing file and mirror it.
2. **Global, not Kenya-only.** Every geography/language/currency/timezone decision must work for
   any country. See §3. There is no hardcoded default country in business logic.
3. **Security guarantees are non-negotiable.** The behaviours proven in
   `apps/api/test/*.e2e-spec.ts` (18 passing tests) must keep passing. Extend the suites; never
   weaken them. Run them in CI on every PR.
4. **Validation lives once**, in `@learnix/validation` (zod). Frontend and backend import the same
   schemas + error codes. Never duplicate validation logic.
5. **Secrets only via env**, validated at boot (`ConfigService`). Never commit secrets.
6. **Everything scales horizontally.** State lives in Postgres + Redis, never in process memory.
   See §5.

---

## 1. What already exists (reference core — read before building)

Monorepo: pnpm + Turbo. Node 22. TypeScript strict.

```
packages/
  db/           Prisma schema + client + seed        ← COMPLETE, migrated
  validation/   zod schemas, error codes, phone, geo ← COMPLETE, 46 unit tests pass
  config/       shared tsconfig / tailwind preset / eslint
apps/
  api/          NestJS 10 + Fastify                   ← REFERENCE CORE (this doc extends it)
    src/core/       config, prisma, redis, crypto, tokens, rate-limit, analytics, http, health
    src/providers/  sms (Twilio/Africa's Talking/hybrid), email (Resend), storage (R2)
    src/modules/    auth, users, profile, onboarding, tracks, sessions, security, privacy,
                    notification-prefs, account-lifecycle
    test/           18 e2e tests (attack cases, lifecycle, onboarding) — all green
    docs/openapi.json  61 endpoints
```

**Fully implemented and tested** (use as-is, extend carefully):
- Email/phone/guest registration, login (all identifiers), OAuth (Google PKCE; Apple stubbed).
- **Refresh rotation with family reuse-detection** (`TokenService.rotate`) — tested.
- **OTP with 5-attempt / 15-min lock**, Redis-only (`OtpService`) — tested.
- **Distributed rate limiting** (Redis sliding window) — tested.
- **argon2id + pepper** passwords, **AES-256-GCM** for TOTP secrets (`CryptoService`).
- Guest → account **in-place conversion** (keeps userId + onboarding) — tested.
- Onboarding state machine, placement quiz, transactional complete + gamification defaults — tested.
- Account lifecycle: deactivate/reactivate, delete + 30-day grace + purge job — tested.
- **Minor safeguards**: age-band → minor flag → forced-private, under-13 learning-only +
  parental-consent unlock — tested.
- 2FA TOTP setup/enable/disable + backup codes.
- Global country/language reference endpoints.

---

## 2. Decisions already made (⚠️ DECIDE items — resolved)

These were open in the original brief; they are now settled. Keep them unless product says otherwise.

| Area | Decision | Rationale |
|---|---|---|
| **SMS provider** | **Twilio (global) default**, with a **HybridSmsProvider** that routes African numbers to **Africa's Talking** to cut cost. `SMS_PROVIDER=hybrid` in prod. | Global reach + cost-aware for the origin market. Africa's Talking alone is Africa-only. |
| **Email provider** | **Resend** | Simple, good global deliverability. Already global. |
| **Storage** | **Cloudflare R2** (S3-compatible, presigned PUT direct from browser) | Cheap egress, global CDN. |
| **OAuth at v1** | **Google only.** Apple Sign-In stubbed behind the same interface; enable by setting `APPLE_CLIENT_ID`. | Avoids a paid Apple dev dependency for v1; abstraction already present. |
| **Under-13 policy** | **Learning-only mode** by default; social surfaces return `PARENTAL_CONSENT_REQUIRED` until a parent approves via emailed link. | COPPA-style safety; keeps the learning value flowing. |
| **Password strength** | zxcvbn-style estimator + common-password blocklist, contract `evaluate() → {score, ok, reason}`. | **YOU MUST swap** the in-repo estimator for `@zxcvbn-ts/core` + `@zxcvbn-ts/language-common` in production — keep the interface identical. |

---

## 3. GLOBAL scope — build every feature for a worldwide audience

This is the most common place to accidentally regress to Kenya-only. Enforce all of the following.

### 3.1 Phone
- Use `normalizePhone(raw, defaultCountry?)` from `@learnix/validation` (backed by
  **libphonenumber-js**). It returns `{ ok, e164, country, isMobile }`.
- The frontend **PhoneInput** must have a **country selector** (all 252 countries, flags, calling
  codes from `GET /reference/countries`) and convert national → E.164 *client-side* using the
  selected country before calling the API. The API's canonical phone value is E.164.
- `normalizeKenyanPhone` exists only as a backward-compat wrapper. Do not build new features on it.
- OTP delivery: only mobile numbers reliably receive SMS — use `isMobile` to warn/deny where needed.

### 3.2 Languages & i18n
- `COUNTRIES` (252) and `LANGUAGES` (185, with `rtl` flags) ship embedded in `@learnix/validation`
  (`geo.data.ts`, generated from CLDR via `scripts/gen-geo.cjs`).
- A user may pick **any** ISO-639-1 language as their content/interface preference. Validate against
  the full list (`languageCodeSchema`).
- **UI translation bundles ship incrementally.** `SHIPPED_UI_LANGUAGES` (currently `en`, `sw`) lists
  languages with a complete UI bundle; all others **fall back to English UI** but are still valid
  preferences. Never reject a language choice because the UI isn't translated yet.
- Build the i18n layer with **next-intl** (or equivalent). Structure: `messages/{lang}.json`, English
  as the fallback locale. Wire `defaultUiLanguageForCountry()` to pre-select during onboarding.
- **RTL:** Arabic, Hebrew, Persian, Urdu, etc. carry `rtl: true`. The web app must set
  `dir="rtl"` and mirror layout when the UI language is RTL. Test with Arabic.

### 3.3 Country / timezone / currency
- Country picker from `GET /reference/countries` (grouped by continent is available client-side via
  `countriesByContinent()`).
- **Timezone:** detect with `Intl.DateTimeFormat().resolvedOptions().timeZone` client-side and send
  it as the `timezone` preference (IANA string). Do not assume `Africa/Nairobi`. Reminder scheduling
  must respect each user's timezone.
- **Currency / payments:** when you build monetization, use the country's currency (from CLDR data)
  and a **global** processor (Stripe) alongside regional rails (M-Pesa via Daraja for Kenya, etc.).
  Route by country. (Out of scope for the accounts module, but design the `country` field to drive it.)

### 3.4 Copy
- All user-facing copy must be **region-neutral** and translatable. No "KCSE"-style national exam
  names hardcoded — the onboarding "exams" motivation is generic; exam names, if surfaced, come from
  a per-country content table you localize. Demo content may reference specific exams; product copy
  may not.

---

## 4. Data model (`packages/db/prisma/schema.prisma`)

Already implemented and migrated. Highlights + your responsibilities:

- Core: `User`, `Profile`, `OAuthAccount`, `Session`, `TwoFactor`, `UserPreference`,
  `LearningTrack`, `UserTrack`, `OnboardingState`, `BlockedUser`, `SecurityEvent`,
  `PlacementQuestion`, `UserStreak`.
- Justified additions beyond the original brief (keep): `PlacementQuestion`, `UserStreak`,
  `Session.rotatedAt`, `Session.prevRefreshTokenHash` (reuse detection).
- OTP codes: **Redis only**, never a table.
- **Indexing at scale:** ensure composite indexes exist for hot lookups — `User.username`,
  `User.email`, `Session.refreshTokenHash` (unique), `Session.tokenFamily`,
  `SecurityEvent(userId, createdAt)`. Add more as query patterns emerge.
- **Partitioning:** `SecurityEvent` and any future analytics/event tables are high-volume append
  tables — plan time-based partitioning (monthly) before they grow large, or offload to a separate
  analytics store. Cursor-paginate them (already done for `/security/events`).

When you extend the schema (social graph, lessons, XP ledger), keep migrations additive and logged
in `docs/BUILD_LOG.md`.

---

## 5. Scale architecture — "manage high numbers" (build these in)

The reference core is already stateless and Redis-coordinated. Complete the following for
production traffic. See `docs/SCALE.md` for the full rationale; summary of what you must implement:

1. **Connection pooling:** run Postgres behind **PgBouncer** (transaction mode). Set
   `DATABASE_URL` with `?pgbouncer=true&connection_limit=1` per instance. Never let N app
   instances × Prisma pool exceed Postgres `max_connections`.
2. **Read replicas:** provision a read replica, set `DATABASE_REPLICA_URL`. Route heavy read
   endpoints (public profiles, track catalogue, leaderboards) to the replica. `PrismaService`
   already exposes `readClient` for this.
3. **Caching:** extend the Redis cache-aside pattern (`RedisService.getOrSet`) already used for
   `/tracks` and username availability to other hot reads (public profiles, reference data).
   Invalidate on writes. Put reference endpoints behind a CDN with long TTLs.
4. **Queues + separate workers:** all SMS/email already go through **BullMQ** (`NotificationService`).
   In production, run the queue workers as a **separate process/deployment** (a `worker`
   entrypoint), not in the API process, so heavy jobs never starve request handling. Move the purge
   scheduler and avatar-processing there too. Add dead-letter handling + alerting on failures.
5. **Rate limiting:** already distributed (Redis). Add a global per-IP ceiling at the edge/CDN in
   addition to the per-route limits.
6. **Circuit breakers / timeouts:** wrap external providers (Twilio, Resend, Google) with timeouts
   and a breaker so a provider outage degrades gracefully instead of cascading.
7. **Observability:** structured JSON logs with request IDs (Fastify/pino, already on). Wire
   **prom-client** into `/metrics` with real histograms (request latency, queue depth, DB pool
   utilization, cache hit rate). Add OpenTelemetry tracing. Ship logs/metrics to your stack.
8. **Health/readiness:** `/healthz`, `/readyz`, `/metrics` exist — wire them to your load balancer
   and orchestrator so traffic only hits ready instances and drains on rollout (graceful shutdown
   via `enableShutdownHooks` is on).
9. **Search:** use **Meilisearch** for username/handle and (later) content search instead of DB
   `LIKE`. Index on write.
10. **Avatar/media:** browser → R2 presigned PUT (already), served via CDN. A worker validates
    magic bytes + size and generates 320px/96px webp variants (the confirm step is stubbed —
    implement the worker).
11. **Cost-aware SMS:** `HybridSmsProvider` routes African numbers to Africa's Talking, else Twilio.
    Batch bulk sends where the provider supports it.

---

## 6. Endpoints to complete

The reference core implements **61 endpoints** (`docs/openapi.json`) covering the full Accounts
Centre + Onboarding surface. Your additions:

- **Fill the stubs:** avatar variant worker; Apple Sign-In (when enabled); email-verification
  resend wiring in `VerifyController` (reuse `AuthService.sendEmailVerification`); real zxcvbn.
- **Social layer (next milestone):** follow/followers, feed, posts, comments, likes, messaging —
  all must honour `Profile.visibility`, `BlockedUser`, minor privacy locks, and the
  `whoCanMessage`/`whoCanComment` prefs already stored.
- **Learning layer:** lessons, XP/streak ledger, daily-goal tracking — build on `UserStreak`,
  `UserTrack`, and the `PlanResolver` interface (swap `DeterministicPlanResolver` for a
  pgvector/AI resolver behind the same interface).
- Keep every new endpoint: zod-validated (`ZodBody`), guarded (`AuthGuard`/`@Public`/
  `@RequireRegistered`), rate-limited where sensitive, documented (Swagger tags), and returning the
  `§5` error envelope.

---

## 7. Security requirements (keep the guarantees)

Every item below has a passing test or a clear pattern in the core. Preserve them:

- Refresh reuse → **revoke the whole token family** + log `SESSION_REVOKED`. (tested)
- OTP: 5 attempts → **15-min lock**, correct code rejected during lock. (tested)
- Registration/login/forgot are **enumeration-safe**: identical response whether or not the
  account exists; forgot-password **always** 200. (tested)
- Passwords: argon2id + pepper; strength gate. Alerts on password/email/2FA changes.
- Access = short-lived RS256 JWT (cookie or bearer); refresh = opaque, httpOnly, scoped to
  `/auth/refresh`. Sessions server-side revocable; max 10/user with eviction.
- Minors forced private; under-13 gated to learning-only until parental consent. (tested)
- All secrets in env; TOTP secrets AES-GCM at rest; refresh/verification tokens stored as SHA-256.
- CSRF: cookies are `SameSite=Lax`; add CSRF tokens for any state-changing form posts from the web
  app if you introduce non-XHR form submissions.

---

## 8. Web app (deferred in the reference; build next)

Stack: **Next.js (App Router) + Tailwind** (preset in `packages/config/tailwind-preset.js`, brand
tokens included). Use the shared `@learnix/validation` schemas for all forms.

- Onboarding funnel UI (10 steps, skippable where the state machine allows), placement quiz,
  plan-reveal.
- Accounts Centre (profile, security, sessions, privacy, notifications, lifecycle).
- Public profile `/u/[username]` (respects minor privacy).
- **i18n from day one** (next-intl), English complete, others fallback; **RTL** support.
- Country/language/phone pickers driven by `/reference/*`.
- Mascot **Lumi** present throughout; teal→blue→purple gradient.

---

## 9. How to work

- Read the reference file before writing its production sibling. Mirror patterns exactly.
- Extend the e2e suites for every new security-sensitive path. Keep all 18 existing tests green.
- Keep `docs/BUILD_LOG.md` updated (schema changes, decisions, deviations).
- Regenerate `docs/openapi.json` (`ts-node src/openapi-export.ts`) whenever endpoints change.
- Run: `pnpm --filter @learnix/validation test` (unit) and the api e2e suite (`jest --config
  test/jest-e2e.json`) before every PR.

Build it like production software for millions of learners worldwide. Correctness and the security
guarantees come first; breadth second.
