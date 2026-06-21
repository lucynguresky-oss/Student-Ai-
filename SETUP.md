# Learnix API â€” backend foundation

NestJS 10 (Fastify) + Prisma + Postgres 16/pgvector. This is the Instagram-style
social core: auth, social graph, posts/media, feed ranking, likes, comments,
saves, hashtags, notifications â€” plus XP/streak hooks for the learning loop.

Everything here **compiles and type-checks clean** (`nest build` + `tsc --noEmit`).

## Where it goes

Copy the `apps/api` folder into your repo root (it merges with your existing
monorepo layout). The `infra/docker/docker-compose.yml` matches the README's
services â€” use it if you don't already have one.

```
your-repo/
â”œâ”€ apps/
â”‚  â””â”€ api/        â† copy this in
â””â”€ infra/
   â””â”€ docker/     â† compose file (Postgres+pgvector, Redis, Meili, Mailhog)
```

## Run it

```bash
# 1. infra
docker compose -f infra/docker/docker-compose.yml up -d

# 2. api
cd apps/api
cp .env.example .env          # then set real JWT secrets: openssl rand -hex 48
npm install                   # or pnpm install at the repo root
npm run db:generate
npm run db:migrate            # creates the schema (name it e.g. "init")
npm run db:seed               # demo users + a post (password: Password123)
npm run dev                   # http://localhost:4000  â€” docs at /docs
```

Open **http://localhost:4000/docs** for the live Swagger API.

## Endpoints (all under `/api`)

**Auth** â€” `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`,
`POST /auth/logout`, `GET /auth/me`

**Users / graph** â€” `GET /users/:username`, `GET /users/:username/followers`,
`GET /users/:username/following`, `POST|DELETE /users/:username/follow`,
`POST /users/:username/accept` (approve a private-account request)

**Posts** â€” `POST /posts`, `GET /posts/:id`, `DELETE /posts/:id`,
`POST|DELETE /posts/:id/like`, `POST|DELETE /posts/:id/save`

**Feed** â€” `GET /feed/home` (following, cursor-paginated),
`GET /feed/explore` (ranked), `GET /feed/user/:username`,
`GET /feed/hashtag/:tag`

**Comments** â€” `GET|POST /posts/:postId/comments`,
`GET /comments/:commentId/replies`, `DELETE /comments/:commentId`,
`POST|DELETE /comments/:commentId/like`

**Notifications** â€” `GET /notifications` (cursor-paginated, with actor + post
preview), `GET /notifications/unread-count`, `POST /notifications/read`
(`{ "all": true }` or `{ "ids": [...] }`)

**AI moderation** â€” every new post is screened by Claude for educational value.
Approved posts appear in feeds; non-educational posts are REMOVED (hidden) and the
author gets a `MODERATION` notification. Borderline posts are FLAGGED for review.
`POST /moderation/posts/:id/appeal` (author), `GET /moderation/queue` (teacher/admin),
`POST /moderation/posts/:id/status` (admin override). Decision thresholds live at the
top of `moderation.service.ts`. Run `pnpm test` for the moderation unit tests.

**Messaging (REST)** â€” `GET /conversations`, `POST /conversations/direct`
(`{ "username": "..." }`), `GET /conversations/:id`,
`GET /conversations/:id/messages`, `POST /conversations/:id/read`

**Realtime (Socket.IO, namespace `/realtime`)** â€” connect with
`io('/realtime', { auth: { token: accessToken } })`. Events:
`conversation:join`, `message:send` â†’ broadcasts `message:new`, `typing`, `read`,
`presence:update`. **Calls (WebRTC signaling):** `call:invite` â†’ peers get
`call:incoming`; `call:accept` / `call:decline` / `call:end`; and `call:signal`
relays SDP/ICE between peers (the actual audio/video stream is peer-to-peer WebRTC â€”
the client builds the `RTCPeerConnection`, the server only relays signaling).

## Quick smoke test

```bash
# register
curl -s localhost:4000/api/auth/register -H 'content-type: application/json' \
  -d '{"email":"me@test.com","username":"me","password":"Password123","displayName":"Me"}'

# grab the accessToken from the response, then:
TOKEN=...   # paste it
curl -s localhost:4000/api/feed/home -H "authorization: Bearer $TOKEN"
```

## Auth model

Access token (15m) + refresh token (7d). Refresh tokens are stored **hashed** in
the DB with a `jti`, and **rotate on every refresh** (old one is revoked) â€” so a
leaked refresh token can be cut off. `POST /auth/logout` revokes it.

## What's intentionally left as the next layer

- **Media uploads**: posts take media *URLs*. Wire S3/Cloudflare R2 presigned
  uploads + a transcode worker (HLS for REELs) in front. The schema already has
  `blurhash`, `thumbnailUrl`, `durationSec`.
- **Realtime**: notification read APIs are implemented; add a WebSocket gateway
  to *push* them live (the `/notifications` REST endpoints are the fallback).
- **Search**: Meilisearch is in the compose file; index users + hashtags + captions.
- **RAG AI tutor**: `pgvector` is enabled in the schema; add an `embeddings`
  table + retrieval service (Voyage embeddings â†’ Claude).
- **Counter integrity**: denormalised counts are kept in sync in the service
  layer; for very high traffic move them to a queue/worker.
