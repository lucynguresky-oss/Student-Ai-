# Learnix — Scale Architecture

How Learnix handles high numbers of users worldwide. Each lever below is either **built into the
reference core** or **specified for Antigravity to complete in production**. The design principle
is simple: **the API is stateless; all shared state lives in Postgres + Redis**, so you scale by
adding identical instances behind a load balancer.

---

## 1. Stateless, horizontally-scalable API  ✅ built

- No session state in process memory. Auth = RS256 access JWT (verifiable by any instance) +
  server-side session rows. Any instance can serve any request.
- Both cookie and bearer transport supported → no sticky sessions needed.
- Graceful shutdown (`enableShutdownHooks`) drains in-flight requests and closes DB/Redis/queue
  connections on rollout, so deploys don't drop traffic.
- `/healthz` (liveness), `/readyz` (DB+Redis reachable), `/metrics` let the load balancer and
  orchestrator route only to healthy instances and drain during deploys.

**Scale to more traffic:** add API instances. That's it.

---

## 2. Database

### Connection pooling  ⚙️ configure in prod
Postgres has a hard `max_connections`. With many app instances each holding a Prisma pool you can
exhaust it. Run **PgBouncer in transaction mode** in front of Postgres and point `DATABASE_URL` at
it with `?pgbouncer=true&connection_limit=1`. This multiplexes thousands of app-side "connections"
onto a small server-side pool.

### Read/write split  ✅ built, ⚙️ provision replica
Learnix is read-heavy (profile views, catalogue, session checks). `PrismaService` exposes a
`readClient` that targets `DATABASE_REPLICA_URL` when set (falls back to primary otherwise). Route
heavy reads to the replica; keep writes on the primary. Provision at least one replica in prod.

### Indexing  ✅ built, extend as needed
Unique/lookup indexes on `User.username`, `User.email`, `Session.refreshTokenHash`,
`Session.tokenFamily`, `SecurityEvent(userId, createdAt)`. Add composite indexes as new query
patterns appear. **Cursor-based pagination** on high-volume tables (`/security/events` already) —
never `OFFSET` on large tables.

### Partitioning / archival  ⚙️ plan before growth
`SecurityEvent` (and future event/analytics tables) are append-heavy. Partition by month, or ship
to a dedicated analytics store (e.g. ClickHouse/BigQuery) and keep only recent rows hot.

---

## 3. Redis — the coordination layer  ✅ built

Redis is what makes the stateless API *correct* at scale:

- **OTP codes** live only in Redis (hashed, TTL'd, attempt-locked). The 5-attempt lock is enforced
  across every instance because the counter is shared.
- **Distributed rate limiting** via sliding-window counters. A per-process limiter would let N
  instances each grant the full quota; the Redis counter enforces one global limit.
- **Cache-aside** (`RedisService.getOrSet`) for hot reads (track catalogue, username availability).
  Cache failures degrade to a direct DB read — never an error. Extend to public profiles + reference
  data; invalidate on writes.
- **OAuth PKCE state, 2FA challenges, reset/verify/export/consent tokens** — all short-TTL Redis keys.

Run Redis in a managed HA configuration (primary + replica, or cluster) in prod.

---

## 4. Async work — queues + separate workers  ✅ built, ⚙️ split process in prod

All SMS/email dispatch goes through **BullMQ** (`NotificationService`) with retry + exponential
backoff. This decouples the request path from provider latency — a slow SMS gateway can't hold an
HTTP request open, and transient failures retry automatically.

**In production, run the workers as a separate deployment** (a dedicated `worker` entrypoint), not
in the API process, so heavy/slow jobs never starve request handling. Move there:
- SMS + email queues
- The daily **purge scheduler** (BullMQ repeatable job, already uses a queue so it runs once across
  the fleet and survives restarts)
- **Avatar processing** (validate magic bytes + size, generate 320px/96px webp variants)
- Data-export bundling

Add dead-letter queues + alerting on repeated failures.

---

## 5. External providers — isolate failure  ⚙️ add breakers

Wrap Twilio / Africa's Talking / Resend / Google with **timeouts + circuit breakers** so a provider
outage degrades gracefully. **Cost-aware SMS routing** is built: `HybridSmsProvider` sends African
numbers via Africa's Talking (cheaper local delivery) and everything else via Twilio, falling back
to Twilio if Africa's Talking fails. Batch bulk sends where supported.

---

## 6. Delivery / edge  ⚙️ configure

- **CDN** in front of the API for cacheable GETs (reference data) and for **avatar/media** served
  from R2 (browser → R2 presigned PUT on the way in; CDN on the way out — bandwidth never touches
  the API).
- Response compression + ETag/conditional requests for cacheable endpoints.
- Global edge presence matters for a worldwide audience — put static/reference content close to users.

---

## 7. Search at scale  ⚙️ add Meilisearch

Username/handle lookups and (later) content/social search should use **Meilisearch**, indexed on
write, rather than DB `LIKE` scans. This keeps search fast and off the primary DB as the user base
grows.

---

## 8. Observability  ✅ base built, ⚙️ wire full stack

- Structured JSON logs with request IDs (Fastify/pino) — on.
- `/metrics` returns minimal Prometheus exposition today; wire **prom-client** with real histograms:
  request latency, error rates, **queue depth**, **DB pool utilization**, **cache hit rate**.
- Add **OpenTelemetry** tracing across API → DB → Redis → providers.
- Alert on: readiness failures, queue backlog, provider error spikes, rate-limit storms, DB pool
  saturation.

---

## 9. Capacity snapshot

| Concern | Mechanism | Status |
|---|---|---|
| More request traffic | Add stateless API instances behind LB | ✅ ready |
| DB connection limits | PgBouncer transaction pooling | ⚙️ configure |
| Read-heavy load | Read replica + `readClient` routing + cache | ✅ built / ⚙️ provision |
| Spiky OTP/email (exam season, launches) | BullMQ queues + retry, separate workers | ✅ built / ⚙️ split |
| Global latency | CDN + edge + regional SMS routing | ✅ routing built / ⚙️ CDN |
| Abuse / floods | Distributed rate limits + edge ceiling | ✅ built / ⚙️ edge |
| High-volume event tables | Cursor pagination + partitioning/archival | ✅ pagination / ⚙️ partition |
| Search | Meilisearch indexed on write | ⚙️ add |
| Provider outages | Timeouts + circuit breakers + fallback | ⚙️ add (fallback built) |

Legend: ✅ built into the reference core · ⚙️ specified for production completion.
