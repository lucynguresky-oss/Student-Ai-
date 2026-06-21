# Learnix Backend — Full Source Bundle

Every file for the `apps/api` backend, in one document. Recreate the structure exactly as shown by each `## path` heading.

Verified: `nest build` + `tsc --noEmit` + `prisma generate` all pass clean.

## File tree

```
learnix-api/
  AI_TUTOR_INTEGRATION.md
  SETUP.md
  apps/
    api/
      .env.example
      nest-cli.json
      package.json
      prisma/
        schema.prisma
        seed.ts
      src/
        ai-tutor/
          ai-tutor.controller.ts
          ai-tutor.module.ts
          ai-tutor.service.ts
          llm.service.ts
          prompts.ts
        app.module.ts
        auth/
          auth.controller.ts
          auth.module.ts
          auth.service.ts
          dto/
            auth.dto.ts
          guards/
            jwt-auth.guard.ts
          strategies/
            jwt.strategy.ts
        comments/
          comments.controller.ts
          comments.module.ts
          comments.service.ts
          dto/
            create-comment.dto.ts
        common/
          decorators/
            current-user.decorator.ts
          dto/
            pagination.dto.ts
          text.util.ts
        config/
          configuration.ts
        feed/
          feed.controller.ts
          feed.module.ts
          feed.service.ts
        main.ts
        messaging/
          chat.gateway.ts
          messaging.controller.ts
          messaging.module.ts
          messaging.service.ts
        moderation/
          moderation.controller.ts
          moderation.module.ts
          moderation.service.ts
        notifications/
          dto/
            mark-read.dto.ts
          notifications.controller.ts
          notifications.module.ts
          notifications.service.ts
        posts/
          dto/
            create-post.dto.ts
          posts.controller.ts
          posts.module.ts
          posts.service.ts
        prisma/
          prisma.module.ts
          prisma.service.ts
        safety/
          safety.controller.ts
          safety.module.ts
          safety.service.ts
        saved/
          saved.controller.ts
          saved.module.ts
          saved.service.ts
        search/
          search.controller.ts
          search.module.ts
          search.service.ts
        stories/
          stories.controller.ts
          stories.module.ts
          stories.service.ts
        users/
          dto/
            update-profile.dto.ts
          users.controller.ts
          users.module.ts
          users.service.ts
      test/
        llm.spec.ts
        moderation.spec.ts
        text.spec.ts
      tsconfig.json
  infra/
    docker/
      docker-compose.yml
```


## SETUP.md

````markdown
# Learnix API — backend foundation

NestJS 10 (Fastify) + Prisma + Postgres 16/pgvector. This is the Instagram-style
social core: auth, social graph, posts/media, feed ranking, likes, comments,
saves, hashtags, notifications — plus XP/streak hooks for the learning loop.

Everything here **compiles and type-checks clean** (`nest build` + `tsc --noEmit`).

## Where it goes

Copy the `apps/api` folder into your repo root (it merges with your existing
monorepo layout). The `infra/docker/docker-compose.yml` matches the README's
services — use it if you don't already have one.

```
your-repo/
├─ apps/
│  └─ api/        ← copy this in
└─ infra/
   └─ docker/     ← compose file (Postgres+pgvector, Redis, Meili, Mailhog)
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
npm run dev                   # http://localhost:4000  — docs at /docs
```

Open **http://localhost:4000/docs** for the live Swagger API.

## Endpoints (all under `/api`)

**Auth** — `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`,
`POST /auth/logout`, `GET /auth/me`

**Users / graph** — `GET /users/:username`, `GET /users/:username/followers`,
`GET /users/:username/following`, `POST|DELETE /users/:username/follow`,
`POST /users/:username/accept` (approve a private-account request)

**Posts** — `POST /posts`, `GET /posts/:id`, `DELETE /posts/:id`,
`POST|DELETE /posts/:id/like`, `POST|DELETE /posts/:id/save`

**Feed** — `GET /feed/home` (following, cursor-paginated),
`GET /feed/explore` (ranked), `GET /feed/user/:username`,
`GET /feed/hashtag/:tag`

**Comments** — `GET|POST /posts/:postId/comments`,
`GET /comments/:commentId/replies`, `DELETE /comments/:commentId`,
`POST|DELETE /comments/:commentId/like`

**Notifications** — `GET /notifications` (cursor-paginated, with actor + post
preview), `GET /notifications/unread-count`, `POST /notifications/read`
(`{ "all": true }` or `{ "ids": [...] }`)

**AI moderation** — every new post is screened by Claude for educational value.
Approved posts appear in feeds; non-educational posts are REMOVED (hidden) and the
author gets a `MODERATION` notification. Borderline posts are FLAGGED for review.
`POST /moderation/posts/:id/appeal` (author), `GET /moderation/queue` (teacher/admin),
`POST /moderation/posts/:id/status` (admin override). Decision thresholds live at the
top of `moderation.service.ts`. Run `pnpm test` for the moderation unit tests.

**Messaging (REST)** — `GET /conversations`, `POST /conversations/direct`
(`{ "username": "..." }`), `GET /conversations/:id`,
`GET /conversations/:id/messages`, `POST /conversations/:id/read`

**Realtime (Socket.IO, namespace `/realtime`)** — connect with
`io('/realtime', { auth: { token: accessToken } })`. Events:
`conversation:join`, `message:send` → broadcasts `message:new`, `typing`, `read`,
`presence:update`. **Calls (WebRTC signaling):** `call:invite` → peers get
`call:incoming`; `call:accept` / `call:decline` / `call:end`; and `call:signal`
relays SDP/ICE between peers (the actual audio/video stream is peer-to-peer WebRTC —
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
the DB with a `jti`, and **rotate on every refresh** (old one is revoked) — so a
leaked refresh token can be cut off. `POST /auth/logout` revokes it.

## What's intentionally left as the next layer

- **Media uploads**: posts take media *URLs*. Wire S3/Cloudflare R2 presigned
  uploads + a transcode worker (HLS for REELs) in front. The schema already has
  `blurhash`, `thumbnailUrl`, `durationSec`.
- **Realtime**: notification read APIs are implemented; add a WebSocket gateway
  to *push* them live (the `/notifications` REST endpoints are the fallback).
- **Search**: Meilisearch is in the compose file; index users + hashtags + captions.
- **RAG AI tutor**: `pgvector` is enabled in the schema; add an `embeddings`
  table + retrieval service (Voyage embeddings → Claude).
- **Counter integrity**: denormalised counts are kept in sync in the service
  layer; for very high traffic move them to a queue/worker.

---

## Added in this update (Instagram parity)

**Stories (24h ephemeral)** — `POST /stories`, `GET /stories/tray` (followed users,
unseen rings first, your own pinned), `GET /stories/user/:username`,
`POST /stories/:id/view`, `GET /stories/:id/viewers` (author only), `DELETE /stories/:id`.

**Profile & account editing** — `PATCH /users/me` (displayName, bio, avatarUrl,
isPrivate), `PATCH /users/me/username`, `PATCH /users/me/password` (verifies current,
revokes existing sessions).

**Saved tab + collections** — `GET /saved`, `GET /collections`,
`POST /collections`, `DELETE /collections/:id`, `GET /collections/:id/posts`,
`PUT /saved/:postId/collection`.

**Block** — `POST /users/:username/block` (also severs follows both ways),
`DELETE /users/:username/block`, `GET /users/me/blocked`. Blocks are filtered out of
home/explore feeds, stories, follow, and DMs in both directions.

**Report** — `POST /reports` (`targetType` POST/USER/COMMENT + reason),
`GET /reports/queue` (teacher/admin).

---

## Added in this update (discovery + engagement)

**Search** — `GET /search?q=...&type=all|users|hashtags|posts` (case-insensitive,
block-aware; `@name` and `#tag` prefixes work).

**Reels feed** — `GET /feed/reels` (vertical feed of REEL/VIDEO posts, ranked,
cursor-paginated, block-aware).

**Share a post to DM** — `POST /conversations/:id/share` (`{ postId }`); message
history now returns a `sharedPost` preview on POST_SHARE messages.

**@mentions & tagging** — `@username` in a caption or comment notifies that user
(MENTION) and, for captions, records a tag. `GET /feed/user/:username/tagged`
returns posts a user is tagged in.

**Engagement completions** — `GET /posts/:id/likes` (who liked, paginated),
`PATCH /posts/:id` (edit caption — re-syncs hashtags, re-screens, re-mentions),
`POST /posts/:id/view` (count a view).

---

## Added in this update — real AI tutor (replaces the stub)

The tutor now calls a real LLM (Claude or OpenAI, set by `AI_PROVIDER`) instead of
returning a canned reply. See **AI_TUTOR_INTEGRATION.md** for removing the fake
frontend stub and wiring the chat UI.

**Endpoints** (all require auth, under `/api`):
- `POST /ai/chat` — non-streaming, returns the full answer `{ conversationId, message }`
- `POST /ai/chat/stream` — SSE stream (`meta` → `delta`… → `done`) for the typing effect
- `GET /ai/conversations`, `GET /ai/conversations/:id`, `DELETE /ai/conversations/:id`

Body for chat: `{ message, conversationId?, subject? }`. Pass the returned
`conversationId` back for multi-turn memory. Without an API key the tutor returns a
clear "not configured" error (never a fake answer). System prompt is genuinely
Socratic and curriculum-aware, with a RAG-context slot ready
(`AiTutorService.retrieveContext()`).
````

## apps/api/package.json

````json
{
  "name": "@learnix/api",
  "version": "0.1.0",
  "private": true,
  "description": "Learnix backend — NestJS + Fastify + Prisma",
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "node dist/main.js",
    "lint": "eslint \"src/**/*.ts\" --fix",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "test": "tsx test/moderation.spec.ts && tsx test/text.spec.ts && tsx test/llm.spec.ts"
  },
  "dependencies": {
    "@fastify/static": "^7.0.4",
    "@nestjs/common": "^10.4.4",
    "@nestjs/config": "^3.2.3",
    "@nestjs/core": "^10.4.4",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-fastify": "^10.4.4",
    "@nestjs/platform-socket.io": "^10.4.4",
    "@nestjs/swagger": "^7.4.2",
    "@nestjs/websockets": "^10.4.4",
    "@prisma/client": "^5.20.0",
    "bcryptjs": "^2.4.3",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "socket.io": "^4.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.7.4",
    "@types/passport-jwt": "^4.0.1",
    "prisma": "^5.20.0",
    "tsx": "^4.19.1",
    "typescript": "^5.6.2"
  }
}
````

## apps/api/tsconfig.json

````json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "moduleResolution": "node",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
````

## apps/api/nest-cli.json

````json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
````

## apps/api/.env.example

````bash
# --- Core ---
NODE_ENV=development
PORT=4000

# --- Database (matches infra/docker Postgres 16 + pgvector) ---
DATABASE_URL="postgresql://learnix:learnix@localhost:5432/learnix?schema=public"

# --- Auth ---
# Generate strong secrets, e.g.  openssl rand -hex 48
JWT_ACCESS_SECRET="change-me-access-secret"
JWT_REFRESH_SECRET="change-me-refresh-secret"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="7d"

# --- AI tutor + moderation ---
# AI_PROVIDER selects which model powers the tutor: "anthropic" (Claude) or "openai" (ChatGPT).
# Set the matching API key. Without a key the tutor returns a clear "not configured"
# error instead of a fake answer.
AI_PROVIDER="anthropic"
ANTHROPIC_API_KEY=""
ANTHROPIC_MODEL="claude-sonnet-4-6"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o"
VOYAGE_API_KEY=""
MODERATION_MODEL="claude-haiku-4-5-20251001"
````

## infra/docker/docker-compose.yml

````yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: learnix-postgres
    environment:
      POSTGRES_USER: learnix
      POSTGRES_PASSWORD: learnix
      POSTGRES_DB: learnix
    ports:
      - '5432:5432'
    volumes:
      - learnix_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U learnix']
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: learnix-redis
    ports:
      - '6379:6379'

  meilisearch:
    image: getmeili/meilisearch:v1.10
    container_name: learnix-meilisearch
    environment:
      MEILI_MASTER_KEY: learnix-dev-key
    ports:
      - '7700:7700'
    volumes:
      - learnix_meili:/meili_data

  mailhog:
    image: mailhog/mailhog
    container_name: learnix-mailhog
    ports:
      - '1025:1025'
      - '8025:8025'

volumes:
  learnix_pgdata:
  learnix_meili:
````

## apps/api/prisma/schema.prisma

````prisma
// Learnix — Prisma schema
// Instagram-style social core + learning hooks (XP/streaks/curriculum)
// Postgres 16 + pgvector. Run: pnpm db:generate && pnpm db:migrate

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

enum Role {
  LEARNER
  CREATOR
  TEACHER
  ADMIN
}

enum PostType {
  IMAGE
  CAROUSEL
  VIDEO
  REEL
}

enum Visibility {
  PUBLIC
  FOLLOWERS
  PRIVATE
}

enum MediaType {
  IMAGE
  VIDEO
}

enum FollowStatus {
  ACCEPTED
  PENDING // used when the target account is private
}

enum NotificationType {
  LIKE
  COMMENT
  REPLY
  FOLLOW
  FOLLOW_REQUEST
  MENTION
  MODERATION // system warning, e.g. a post was removed
}

// ---------------------------------------------------------------------------
// Users & identity
// ---------------------------------------------------------------------------

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  username     String   @unique
  passwordHash String
  displayName  String?
  bio          String?  @db.Text
  avatarUrl    String?
  role         Role     @default(LEARNER)
  isPrivate    Boolean  @default(false)
  isVerified   Boolean  @default(false)

  // Learning / gamification hooks (Duolingo-style loop lives on top of these)
  xp             Int       @default(0)
  streakCount    Int       @default(0)
  lastActiveDate DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  posts         Post[]
  comments      Comment[]
  likes         Like[]
  commentLikes  CommentLike[]
  bookmarks     Bookmark[]
  collections   Collection[]
  refreshTokens RefreshToken[]

  following Follow[] @relation("Follower")
  followers Follow[] @relation("Following")

  notifications     Notification[] @relation("Recipient")
  actedNotifications Notification[] @relation("Actor")

  // Messaging & calls
  conversations  ConversationParticipant[]
  sentMessages   Message[]
  initiatedCalls CallLog[]

  // Stories, safety
  stories     Story[]
  storyViews  StoryView[]
  blocking    Block[]  @relation("Blocker")
  blockedBy   Block[]  @relation("Blocked")
  reportsMade Report[] @relation("Reporter")
  mentionedIn PostMention[]
  aiConversations AiConversation[]

  @@index([username])
  @@index([email])
}

model RefreshToken {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String // hash of the refresh token (never store the raw token)
  userAgent String?
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  @@index([userId])
}

// ---------------------------------------------------------------------------
// Social graph
// ---------------------------------------------------------------------------

model Follow {
  followerId  String
  followingId String
  follower    User         @relation("Follower", fields: [followerId], references: [id], onDelete: Cascade)
  following   User         @relation("Following", fields: [followingId], references: [id], onDelete: Cascade)
  status      FollowStatus @default(ACCEPTED)
  createdAt   DateTime     @default(now())

  @@id([followerId, followingId])
  @@index([followingId, status])
  @@index([followerId, status])
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

model Post {
  id         String     @id @default(cuid())
  authorId   String
  author     User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  type       PostType   @default(IMAGE)
  caption    String?    @db.Text
  visibility Visibility @default(PUBLIC)

  // Optional curriculum tie-in — Learnix's differentiator over a plain IG clone
  subjectId String?
  subject   Subject? @relation(fields: [subjectId], references: [id], onDelete: SetNull)

  // Denormalised counters (kept in sync in service layer for cheap reads)
  likeCount    Int @default(0)
  commentCount Int @default(0)
  saveCount    Int @default(0)
  viewCount    Int @default(0)

  // AI moderation — every post is screened for educational value on create.
  // Non-educational posts are REMOVED (hidden from feeds) and the author warned.
  moderationStatus ModerationStatus @default(PENDING)
  moderationReason String?          @db.Text
  moderatedAt      DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  media          MediaAsset[]
  likes          Like[]
  comments       Comment[]
  bookmarks      Bookmark[]
  hashtags       PostHashtag[]
  moderationLogs ModerationLog[]
  mentions       PostMention[]

  @@index([authorId, createdAt])
  @@index([visibility, createdAt])
  @@index([moderationStatus, createdAt])
  @@index([subjectId])
}

model MediaAsset {
  id           String    @id @default(cuid())
  postId       String
  post         Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  type         MediaType
  url          String
  thumbnailUrl String?
  blurhash     String? // for instant low-res placeholders (good on slow connections)
  width        Int?
  height       Int?
  durationSec  Float? // for VIDEO/REEL
  position     Int       @default(0) // ordering within a carousel

  @@index([postId, position])
}

model Like {
  userId    String
  postId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@id([userId, postId])
  @@index([postId])
}

model Comment {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  body      String   @db.Text
  parentId  String? // self-relation for threaded replies
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("CommentReplies")
  likeCount Int      @default(0)
  createdAt DateTime @default(now())

  commentLikes CommentLike[]

  @@index([postId, createdAt])
  @@index([parentId])
}

model CommentLike {
  userId    String
  commentId String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  comment   Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@id([userId, commentId])
}

model Collection {
  id        String     @id @default(cuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  createdAt DateTime   @default(now())
  bookmarks Bookmark[]

  @@unique([userId, name])
}

model Bookmark {
  userId       String
  postId       String
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  post         Post        @relation(fields: [postId], references: [id], onDelete: Cascade)
  collectionId String?
  collection   Collection? @relation(fields: [collectionId], references: [id], onDelete: SetNull)
  createdAt    DateTime    @default(now())

  @@id([userId, postId])
  @@index([userId, createdAt])
}

model Hashtag {
  id        String        @id @default(cuid())
  tag       String        @unique
  createdAt DateTime      @default(now())
  posts     PostHashtag[]
}

model PostHashtag {
  postId    String
  hashtagId String
  post      Post    @relation(fields: [postId], references: [id], onDelete: Cascade)
  hashtag   Hashtag @relation(fields: [hashtagId], references: [id], onDelete: Cascade)

  @@id([postId, hashtagId])
  @@index([hashtagId])
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

model Notification {
  id        String           @id @default(cuid())
  userId    String // recipient
  user      User             @relation("Recipient", fields: [userId], references: [id], onDelete: Cascade)
  actorId   String? // who triggered it (null for system/moderation notices)
  actor     User?            @relation("Actor", fields: [actorId], references: [id], onDelete: Cascade)
  type      NotificationType
  postId    String?
  commentId String?
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  @@index([userId, isRead, createdAt])
}

// ---------------------------------------------------------------------------
// Curriculum (Learnix-specific; lightweight here, expand later)
// ---------------------------------------------------------------------------

model Subject {
  id        String   @id @default(cuid())
  name      String   @unique // e.g. "Biology", "Mathematics"
  level     String? // e.g. "KCSE", "CBC", "University"
  createdAt DateTime @default(now())
  posts     Post[]
}

// ---------------------------------------------------------------------------
// AI moderation
// ---------------------------------------------------------------------------

enum ModerationStatus {
  PENDING // awaiting AI screen (or screen failed / no API key in dev)
  APPROVED // educational — visible in feeds
  FLAGGED // borderline — hidden pending human review
  REMOVED // non-educational — hidden, author warned
}

model ModerationLog {
  id            String           @id @default(cuid())
  postId        String
  post          Post             @relation(fields: [postId], references: [id], onDelete: Cascade)
  isEducational Boolean
  confidence    Float // 0..1 from the classifier
  category      String? // e.g. "spam", "off-topic", "educational:biology"
  reason        String           @db.Text
  action        ModerationStatus // what the system decided
  model         String // which model produced the verdict
  createdAt     DateTime         @default(now())

  @@index([postId])
}

// ---------------------------------------------------------------------------
// Messaging & calls
// ---------------------------------------------------------------------------

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  POST_SHARE
}

enum CallType {
  AUDIO
  VIDEO
}

enum CallStatus {
  RINGING
  ONGOING
  ENDED
  MISSED
  DECLINED
}

model Conversation {
  id        String   @id @default(cuid())
  isGroup   Boolean  @default(false)
  title     String? // group name (null for 1:1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  participants ConversationParticipant[]
  messages     Message[]
  calls        CallLog[]
}

model ConversationParticipant {
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  lastReadAt     DateTime?
  joinedAt       DateTime     @default(now())

  @@id([conversationId, userId])
  @@index([userId])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  sender         User         @relation(fields: [senderId], references: [id], onDelete: Cascade)
  type           MessageType  @default(TEXT)
  body           String?      @db.Text
  mediaUrl       String?
  postId         String? // when sharing a post into a chat
  createdAt      DateTime     @default(now())

  @@index([conversationId, createdAt])
}

model CallLog {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  initiatorId    String
  initiator      User         @relation(fields: [initiatorId], references: [id], onDelete: Cascade)
  type           CallType
  status         CallStatus   @default(RINGING)
  startedAt      DateTime     @default(now())
  endedAt        DateTime?

  @@index([conversationId])
}

// ---------------------------------------------------------------------------
// Stories (ephemeral 24h content)
// ---------------------------------------------------------------------------

model Story {
  id           String      @id @default(cuid())
  authorId     String
  author       User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  type         MediaType   @default(IMAGE)
  mediaUrl     String
  thumbnailUrl String?
  blurhash     String?
  durationSec  Float?
  caption      String?
  createdAt    DateTime    @default(now())
  expiresAt    DateTime // typically createdAt + 24h
  views        StoryView[]

  @@index([authorId, expiresAt])
  @@index([expiresAt])
}

model StoryView {
  storyId  String
  story    Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  viewerId String
  viewer   User     @relation(fields: [viewerId], references: [id], onDelete: Cascade)
  viewedAt DateTime @default(now())

  @@id([storyId, viewerId])
  @@index([viewerId])
}

// ---------------------------------------------------------------------------
// Safety: blocks & reports
// ---------------------------------------------------------------------------

model Block {
  blockerId String
  blockedId String
  blocker   User     @relation("Blocker", fields: [blockerId], references: [id], onDelete: Cascade)
  blocked   User     @relation("Blocked", fields: [blockedId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@id([blockerId, blockedId])
  @@index([blockedId])
}

enum ReportTargetType {
  POST
  USER
  COMMENT
}

enum ReportStatus {
  OPEN
  REVIEWED
  ACTIONED
  DISMISSED
}

model Report {
  id             String           @id @default(cuid())
  reporterId     String
  reporter       User             @relation("Reporter", fields: [reporterId], references: [id], onDelete: Cascade)
  targetType     ReportTargetType
  postId         String?
  reportedUserId String?
  commentId      String?
  reason         String
  details        String?          @db.Text
  status         ReportStatus     @default(OPEN)
  createdAt      DateTime         @default(now())

  @@index([status, createdAt])
}

model PostMention {
  postId          String
  post            Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  mentionedUserId String
  mentionedUser   User     @relation(fields: [mentionedUserId], references: [id], onDelete: Cascade)
  createdAt       DateTime @default(now())

  @@id([postId, mentionedUserId])
  @@index([mentionedUserId])
}

// ---------------------------------------------------------------------------
// AI Tutor (real LLM-backed chat with persisted history)
// ---------------------------------------------------------------------------

enum AiRole {
  USER
  ASSISTANT
}

model AiConversation {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String? // auto-derived from the first user message
  subject   String? // optional subject context, e.g. "Biology"
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  messages  AiMessage[]

  @@index([userId, updatedAt])
}

model AiMessage {
  id             String         @id @default(cuid())
  conversationId String
  conversation   AiConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           AiRole
  content        String         @db.Text
  createdAt      DateTime       @default(now())

  @@index([conversationId, createdAt])
}
````

## apps/api/prisma/seed.ts

````typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Learnix...');

  const passwordHash = await bcrypt.hash('Password123', 12);

  const subjects = await Promise.all(
    ['Biology', 'Mathematics', 'Chemistry', 'History'].map((name) =>
      prisma.subject.upsert({
        where: { name },
        create: { name, level: 'KCSE' },
        update: {},
      }),
    ),
  );

  const usersData = [
    { username: 'amina', displayName: 'Amina W.', role: 'CREATOR' as const },
    { username: 'brian', displayName: 'Brian K.', role: 'TEACHER' as const },
    { username: 'cynthia', displayName: 'Cynthia A.', role: 'LEARNER' as const },
  ];

  const users = [];
  for (const u of usersData) {
    users.push(
      await prisma.user.upsert({
        where: { username: u.username },
        create: {
          email: `${u.username}@learnix.test`,
          username: u.username,
          displayName: u.displayName,
          role: u.role,
          passwordHash,
          bio: `Hi, I'm ${u.displayName} 👋`,
        },
        update: {},
      }),
    );
  }

  // everyone follows amina
  for (const u of users) {
    if (u.username !== 'amina') {
      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: u.id,
            followingId: users[0].id,
          },
        },
        create: { followerId: u.id, followingId: users[0].id },
        update: {},
      });
    }
  }

  // a couple of posts from amina
  const post = await prisma.post.create({
    data: {
      authorId: users[0].id,
      type: 'IMAGE',
      caption: 'Mitochondria — the powerhouse of the cell ⚡ #biology #revision',
      subjectId: subjects[0].id,
      media: {
        create: [
          {
            type: 'IMAGE',
            url: 'https://picsum.photos/seed/cell/1080/1080',
            width: 1080,
            height: 1080,
            position: 0,
          },
        ],
      },
      hashtags: {
        create: [
          { hashtag: { connectOrCreate: { where: { tag: 'biology' }, create: { tag: 'biology' } } } },
          { hashtag: { connectOrCreate: { where: { tag: 'revision' }, create: { tag: 'revision' } } } },
        ],
      },
    },
  });

  // a like + a comment from cynthia
  await prisma.like.create({ data: { postId: post.id, userId: users[2].id } });
  await prisma.post.update({
    where: { id: post.id },
    data: { likeCount: 1 },
  });
  await prisma.comment.create({
    data: {
      postId: post.id,
      authorId: users[2].id,
      body: 'This finally makes sense, thank you! 🙏',
    },
  });
  await prisma.post.update({
    where: { id: post.id },
    data: { commentCount: 1 },
  });

  console.log('✅ Seed complete. Login with any user + password "Password123".');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
````

## apps/api/src/main.ts

````typescript
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown props
      forbidNonWhitelisted: true, // 400 on unknown props
      transform: true, // auto-cast to DTO types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Learnix API')
    .setDescription('Social learning platform — Instagram-style core')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('port') ?? 4000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`🚀 Learnix API on http://localhost:${port}  (docs: /docs)`);
}

void bootstrap();
````

## apps/api/src/app.module.ts

````typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { FeedModule } from './feed/feed.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ModerationModule } from './moderation/moderation.module';
import { MessagingModule } from './messaging/messaging.module';
import { StoriesModule } from './stories/stories.module';
import { SafetyModule } from './safety/safety.module';
import { SavedModule } from './saved/saved.module';
import { SearchModule } from './search/search.module';
import { AiTutorModule } from './ai-tutor/ai-tutor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    FeedModule,
    CommentsModule,
    NotificationsModule,
    ModerationModule,
    MessagingModule,
    StoriesModule,
    SafetyModule,
    SavedModule,
    SearchModule,
    AiTutorModule,
  ],
})
export class AppModule {}
````

## AI_TUTOR_INTEGRATION.md

````markdown
# AI Tutor — remove the fake one, connect the real one

Your screenshots show the tutor returning the **same hardcoded reply** to every
message ("Great question! Let me break this down… Key Concept: This is one of the
most commonly tested topics in KCSE…"). That text is a placeholder stub in your
frontend — it never calls a model. Here's how to replace it.

## 1. Find and delete the fake AI

In your web app, search the codebase for the canned string:

```
Great question! Let me break this down
```

You'll find a function (something like `getAiResponse`, `mockTutor`,
`fakeReply`, or a hardcoded array of responses) that returns this text. **Delete
that function** and remove the place that calls it. That's the fake AI.

## 2. Point the chat at the real backend

The backend now exposes a real, model-backed tutor (Claude or OpenAI, selected by
`AI_PROVIDER` in `.env`). Two endpoints:

- `POST /api/ai/chat` — non-streaming, returns the full answer (simplest)
- `POST /api/ai/chat/stream` — Server-Sent Events, streams tokens (the nice typing effect)

Both take `{ message, conversationId?, subject? }` and require the user's bearer
token. Pass back the `conversationId` you receive so the conversation has memory.

### Option A — simplest (non-streaming)

```ts
async function askTutor(token: string, message: string, conversationId?: string, subject?: string) {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ message, conversationId, subject }),
  });
  if (!res.ok) throw new Error((await res.json()).message ?? 'Tutor error');
  return res.json(); // { conversationId, message: { id, role, content, createdAt } }
}
```

### Option B — streaming (recommended for the chat feel)

A small SSE reader, plus a React hook your chat component can use:

```tsx
import { useRef, useState } from 'react';

// reads the SSE body and yields {type:'meta'|'delta'|'done'|'error', ...}
async function* readSSE(res: Response) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let i;
    while ((i = buffer.indexOf('\n\n')) >= 0) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 2);
      if (line.startsWith('data:')) {
        try { yield JSON.parse(line.slice(5).trim()); } catch {}
      }
    }
  }
}

type Msg = { role: 'USER' | 'ASSISTANT'; content: string };

export function useAiTutor(token: string) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const conversationId = useRef<string | null>(null);

  async function send(text: string, subject?: string) {
    // optimistic: add the user message + an empty assistant message to fill in
    setMessages((m) => [...m, { role: 'USER', content: text }, { role: 'ASSISTANT', content: '' }]);
    setStreaming(true);
    try {
      const res = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, conversationId: conversationId.current, subject }),
      });
      for await (const evt of readSSE(res)) {
        if (evt.type === 'meta') conversationId.current = evt.conversationId;
        else if (evt.type === 'delta') {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: 'ASSISTANT', content: copy[copy.length - 1].content + evt.text };
            return copy;
          });
        } else if (evt.type === 'error') {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: 'ASSISTANT', content: `⚠️ ${evt.message}` };
            return copy;
          });
        }
      }
    } finally {
      setStreaming(false);
    }
  }

  function reset() {
    conversationId.current = null;
    setMessages([]);
  }

  return { messages, streaming, send, reset };
}
```

Wire your existing chat input's submit handler to `send(inputValue, currentSubject)`
and render `messages`. Delete the old mock call.

## 3. Turn the model on

In `apps/api/.env`:

```
AI_PROVIDER="anthropic"            # or "openai"
ANTHROPIC_API_KEY="sk-ant-..."     # if using Claude
# or
# AI_PROVIDER="openai"
# OPENAI_API_KEY="sk-..."
```

Restart the API. Now "Explain photosynthesis", "hy", and "ihi" all get **different,
real** answers, because the actual message is sent to the model.

## 4. (Later) Source grounding / RAG

The source chips in your UI ("Biology Form 4 Textbook", "KCSE 2023 Paper 1") are
where retrieved materials go. The system prompt already has a context slot, and
`AiTutorService.retrieveContext()` is the single stub to implement: embed the
question (Voyage), vector-search a `pgvector` table of approved chunks filtered by
subject, and return the top passages. Until then the tutor answers from the model's
own knowledge.
````

## apps/api/src/ai-tutor/ai-tutor.controller.ts

````typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { FastifyReply } from 'fastify';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiTutorService } from './ai-tutor.service';

class AskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  subject?: string;
}

@ApiTags('ai-tutor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiTutorController {
  constructor(private readonly tutor: AiTutorService) {}

  @Get('conversations')
  conversations(@CurrentUser() user: AuthUser) {
    return this.tutor.listConversations(user.id);
  }

  @Get('conversations/:id')
  messages(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tutor.getMessages(id, user.id);
  }

  @Delete('conversations/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tutor.deleteConversation(id, user.id);
  }

  /** Non-streaming: returns the full answer in one response. */
  @Post('chat')
  @HttpCode(200)
  ask(@CurrentUser() user: AuthUser, @Body() dto: AskDto) {
    return this.tutor.ask(user.id, dto);
  }

  /** Streaming: Server-Sent Events with meta + token deltas + done. */
  @Post('chat/stream')
  async stream(
    @CurrentUser() user: AuthUser,
    @Body() dto: AskDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
    try {
      for await (const evt of this.tutor.streamTurn(user.id, dto)) {
        reply.raw.write(`data: ${JSON.stringify(evt)}\n\n`);
      }
    } catch (err) {
      reply.raw.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: (err as Error).message,
        })}\n\n`,
      );
    } finally {
      reply.raw.end();
    }
  }
}
````

## apps/api/src/ai-tutor/ai-tutor.module.ts

````typescript
import { Module } from '@nestjs/common';
import { AiTutorController } from './ai-tutor.controller';
import { AiTutorService } from './ai-tutor.service';
import { LlmService } from './llm.service';

@Module({
  controllers: [AiTutorController],
  providers: [AiTutorService, LlmService],
  exports: [AiTutorService, LlmService],
})
export class AiTutorModule {}
````

## apps/api/src/ai-tutor/ai-tutor.service.ts

````typescript
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AiRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChatMessage, LlmService } from './llm.service';
import { buildTutorSystemPrompt } from './prompts';

const MAX_HISTORY = 20; // last N messages sent as context

export interface AskInput {
  message: string;
  conversationId?: string;
  subject?: string;
}

@Injectable()
export class AiTutorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  async listConversations(userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        subject: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
  }

  async getMessages(conversationId: string, userId: string) {
    await this.assertOwner(conversationId, userId);
    return this.prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, createdAt: true },
    });
  }

  async deleteConversation(conversationId: string, userId: string) {
    await this.assertOwner(conversationId, userId);
    await this.prisma.aiConversation.delete({ where: { id: conversationId } });
    return { deleted: true };
  }

  /** Non-streaming: returns the full answer. Definitively replaces the stub. */
  async ask(userId: string, input: AskInput) {
    const { conversationId, system, history } = await this.startTurn(
      userId,
      input,
    );
    const answer = await this.llm.complete(system, history);
    const message = await this.finishTurn(conversationId, answer);
    return { conversationId, message };
  }

  /** Streaming: yields meta + token deltas + done; persists at start and end. */
  async *streamTurn(
    userId: string,
    input: AskInput,
  ): AsyncGenerator<
    { type: 'meta'; conversationId: string } | { type: 'delta'; text: string } | { type: 'done' }
  > {
    const { conversationId, system, history } = await this.startTurn(
      userId,
      input,
    );
    yield { type: 'meta', conversationId };

    let acc = '';
    try {
      for await (const delta of this.llm.stream(system, history)) {
        acc += delta;
        yield { type: 'delta', text: delta };
      }
    } finally {
      if (acc.trim()) await this.finishTurn(conversationId, acc);
    }
    yield { type: 'done' };
  }

  // ---- internals ----

  private async startTurn(userId: string, input: AskInput) {
    if (!this.llm.isConfigured()) {
      throw new ServiceUnavailableException(
        `AI tutor is not configured. Set an API key for the '${this.llm.provider}' provider in .env.`,
      );
    }
    let conversationId = input.conversationId;

    if (conversationId) {
      await this.assertOwner(conversationId, userId);
    } else {
      const conv = await this.prisma.aiConversation.create({
        data: {
          userId,
          subject: input.subject,
          title: deriveTitle(input.message),
        },
        select: { id: true },
      });
      conversationId = conv.id;
    }

    // persist the user's message, then load recent history (it's the latest)
    await this.prisma.aiMessage.create({
      data: { conversationId, role: AiRole.USER, content: input.message },
    });
    await this.prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const recent = await this.prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: MAX_HISTORY,
      select: { role: true, content: true },
    });
    const history: ChatMessage[] = recent
      .reverse()
      .map((m) => ({
        role: m.role === AiRole.USER ? 'user' : 'assistant',
        content: m.content,
      }));

    const context = await this.retrieveContext(input.message, input.subject);
    const system = buildTutorSystemPrompt({ subject: input.subject, context });

    return { conversationId, system, history };
  }

  private async finishTurn(conversationId: string, content: string) {
    const message = await this.prisma.aiMessage.create({
      data: { conversationId, role: AiRole.ASSISTANT, content },
      select: { id: true, role: true, content: true, createdAt: true },
    });
    await this.prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return message;
  }

  /**
   * RAG hook. Returns approved-material context to ground the answer, or null.
   *
   * TODO: implement retrieval — embed `query` (Voyage), vector-search an
   * `embeddings` table (pgvector) filtered by subject/curriculum, rerank, and
   * format the top chunks here. The system prompt already has a slot for it.
   */
  private async retrieveContext(
    _query: string,
    _subject?: string,
  ): Promise<string | null> {
    return null;
  }

  private async assertOwner(conversationId: string, userId: string) {
    const conv = await this.prisma.aiConversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.userId !== userId) {
      throw new ForbiddenException('Not your conversation');
    }
  }
}

function deriveTitle(firstMessage: string): string {
  const t = firstMessage.trim().replace(/\s+/g, ' ');
  return t.length > 60 ? `${t.slice(0, 57)}…` : t || 'New chat';
}
````

## apps/api/src/ai-tutor/llm.service.ts

````typescript
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly config: ConfigService) {}

  get provider(): string {
    return this.config.get<string>('ai.provider') ?? 'anthropic';
  }

  /** Is a usable API key configured for the selected provider? */
  isConfigured(): boolean {
    return this.provider === 'openai'
      ? !!this.config.get<string>('ai.openaiApiKey')
      : !!this.config.get<string>('ai.anthropicApiKey');
  }

  /** Non-streaming completion — returns the full answer text. */
  async complete(system: string, messages: ChatMessage[]): Promise<string> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        `AI tutor is not configured. Set ${
          this.provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'
        }.`,
      );
    }
    return this.provider === 'openai'
      ? this.openaiComplete(system, messages)
      : this.anthropicComplete(system, messages);
  }

  /** Streaming completion — yields text deltas as they arrive. */
  async *stream(
    system: string,
    messages: ChatMessage[],
  ): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        `AI tutor is not configured. Set ${
          this.provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'
        }.`,
      );
    }
    yield* this.provider === 'openai'
      ? this.openaiStream(system, messages)
      : this.anthropicStream(system, messages);
  }

  // ---------------------------------------------------------------- Anthropic

  private async anthropicComplete(
    system: string,
    messages: ChatMessage[],
  ): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: this.anthropicHeaders(),
      body: JSON.stringify({
        model: this.config.get<string>('ai.anthropicModel'),
        max_tokens: 1024,
        system,
        messages,
      }),
    });
    if (!res.ok) throw await this.httpError('Anthropic', res);
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    return (
      data.content
        ?.filter((b) => b.type === 'text')
        .map((b) => b.text ?? '')
        .join('') ?? ''
    );
  }

  private async *anthropicStream(
    system: string,
    messages: ChatMessage[],
  ): AsyncGenerator<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: this.anthropicHeaders(),
      body: JSON.stringify({
        model: this.config.get<string>('ai.anthropicModel'),
        max_tokens: 1024,
        system,
        messages,
        stream: true,
      }),
    });
    if (!res.ok) throw await this.httpError('Anthropic', res);
    for await (const line of sseLines(res)) {
      const delta = parseAnthropicDelta(line);
      if (delta) yield delta;
    }
  }

  private anthropicHeaders(): Record<string, string> {
    return {
      'content-type': 'application/json',
      'x-api-key': this.config.get<string>('ai.anthropicApiKey') as string,
      'anthropic-version': '2023-06-01',
    };
  }

  // ------------------------------------------------------------------- OpenAI

  private async openaiComplete(
    system: string,
    messages: ChatMessage[],
  ): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: this.openaiHeaders(),
      body: JSON.stringify({
        model: this.config.get<string>('ai.openaiModel'),
        max_tokens: 1024,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    });
    if (!res.ok) throw await this.httpError('OpenAI', res);
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? '';
  }

  private async *openaiStream(
    system: string,
    messages: ChatMessage[],
  ): AsyncGenerator<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: this.openaiHeaders(),
      body: JSON.stringify({
        model: this.config.get<string>('ai.openaiModel'),
        max_tokens: 1024,
        stream: true,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    });
    if (!res.ok) throw await this.httpError('OpenAI', res);
    for await (const line of sseLines(res)) {
      const delta = parseOpenAiDelta(line);
      if (delta) yield delta;
    }
  }

  private openaiHeaders(): Record<string, string> {
    return {
      'content-type': 'application/json',
      authorization: `Bearer ${this.config.get<string>('ai.openaiApiKey')}`,
    };
  }

  // ------------------------------------------------------------------ helpers

  private async httpError(provider: string, res: Response): Promise<Error> {
    const body = await res.text().catch(() => '');
    this.logger.error(`${provider} API ${res.status}: ${body}`);
    return new ServiceUnavailableException(
      `${provider} request failed (${res.status}).`,
    );
  }
}

// ---------------------------------------------------------------------------
// Pure stream helpers (unit-tested in test/llm.spec.ts)
// ---------------------------------------------------------------------------

/** Read an SSE Response body and yield it line by line. */
export async function* sseLines(res: Response): AsyncGenerator<string> {
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (line) yield line;
    }
  }
  const tail = buffer.trim();
  if (tail) yield tail;
}

/** Extract the text delta from one Anthropic SSE line, or '' if none. */
export function parseAnthropicDelta(line: string): string {
  if (!line.startsWith('data:')) return '';
  const payload = line.slice(5).trim();
  if (!payload || payload === '[DONE]') return '';
  try {
    const evt = JSON.parse(payload) as {
      type?: string;
      delta?: { type?: string; text?: string };
    };
    if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
      return evt.delta.text ?? '';
    }
  } catch {
    /* ignore non-JSON keepalive lines */
  }
  return '';
}

/** Extract the text delta from one OpenAI SSE line, or '' if none. */
export function parseOpenAiDelta(line: string): string {
  if (!line.startsWith('data:')) return '';
  const payload = line.slice(5).trim();
  if (!payload || payload === '[DONE]') return '';
  try {
    const evt = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    return evt.choices?.[0]?.delta?.content ?? '';
  } catch {
    return '';
  }
}
````

## apps/api/src/ai-tutor/prompts.ts

````typescript
/**
 * Builds the AI tutor's system prompt. Genuinely Socratic and curriculum-aware,
 * with an optional retrieved-context block for RAG grounding.
 */
export function buildTutorSystemPrompt(opts: {
  subject?: string | null;
  context?: string | null;
  studentLevel?: string | null;
}): string {
  const { subject, context, studentLevel } = opts;

  const base = `You are Learnix Tutor, a friendly, encouraging AI study companion for learners in Kenya (KCSE / CBC curriculum) and beyond.

Your teaching style:
- Be genuinely Socratic: guide the learner to the answer with hints and questions rather than dumping the full solution. But if they're stuck or explicitly ask for a direct explanation, give a clear one.
- ALWAYS respond to the learner's actual message. Never give a generic templated reply.
- Keep explanations concise, concrete, and at the learner's level. Use simple language and relatable Kenyan examples where helpful.
- Break complex ideas into small steps. Check understanding before moving on.
- For maths/science, show working step by step.
- Encourage understanding, not memorisation or answer-copying. If asked to do their exam or assignment for them, help them learn instead.
- Be warm and motivating. Celebrate progress.
- If you are unsure or lack information, say so honestly rather than inventing facts.`;

  const subjectLine = subject
    ? `\n\nThe current subject focus is: ${subject}.`
    : '';

  const levelLine = studentLevel
    ? `\nThe learner's level is: ${studentLevel}. Pitch your explanation accordingly.`
    : '';

  const contextBlock =
    context && context.trim()
      ? `\n\nUse the following approved Learnix materials as your primary source. Ground your answer in them and cite which source you used. If they don't cover the question, say so and answer from general knowledge, clearly noting it.\n\n<materials>\n${context.trim()}\n</materials>`
      : '';

  return base + subjectLine + levelLine + contextBlock;
}
````

## apps/api/src/auth/auth.controller.ts

````typescript
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        isPrivate: true,
        isVerified: true,
        xp: true,
        streakCount: true,
        createdAt: true,
      },
    });
  }
}
````

## apps/api/src/auth/auth.module.ts

````typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
````

## apps/api/src/auth/auth.service.ts

````typescript
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: PublicUser } & Tokens> {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
      select: { email: true, username: true },
    });
    if (existing) {
      const field = existing.email === dto.email ? 'email' : 'username';
      throw new ConflictException(`That ${field} is already taken`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        displayName: dto.displayName,
        passwordHash,
      },
    });

    const tokens = await this.issueTokens(user.id, user.username, user.role);
    return { user: toPublicUser(user), ...tokens };
  }

  async login(dto: LoginDto): Promise<{ user: PublicUser } & Tokens> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { username: dto.identifier }],
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user.id, user.username, user.role);
    return { user: toPublicUser(user), ...tokens };
  }

  async refresh(rawToken: string): Promise<Tokens> {
    // Verify signature/expiry first
    let payload: { sub: string; jti: string };
    try {
      payload = await this.jwt.verifyAsync(rawToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Then check it hasn't been revoked / rotated
    const stored = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }
    const matches = await bcrypt.compare(rawToken, stored.tokenHash);
    if (!matches) throw new UnauthorizedException('Invalid refresh token');

    // Rotate: revoke the old, issue a fresh pair
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true },
    });
    return this.issueTokens(user.id, user.username, user.role);
  }

  async logout(rawToken: string): Promise<void> {
    try {
      const payload = await this.jwt.verifyAsync<{ jti: string }>(rawToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
      await this.prisma.refreshToken.updateMany({
        where: { id: payload.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // swallow — logout should be idempotent
    }
  }

  // ---- helpers ----

  private async issueTokens(
    userId: string,
    username: string,
    role: string,
  ): Promise<Tokens> {
    const jti = randomBytes(16).toString('hex');

    const accessToken = await this.jwt.signAsync(
      { sub: userId, username, role },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessTtl'),
      },
    );

    const refreshTtl = this.config.get<string>('jwt.refreshTtl') ?? '7d';
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: refreshTtl,
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        userId,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(Date.now() + ttlToMs(refreshTtl)),
      },
    });

    return { accessToken, refreshToken };
  }
}

// ---------------------------------------------------------------------------
// View-model helpers
// ---------------------------------------------------------------------------

export interface PublicUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  xp: number;
  streakCount: number;
}

function toPublicUser(u: {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  xp: number;
  streakCount: number;
}): PublicUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    role: u.role,
    xp: u.xp,
    streakCount: u.streakCount,
  };
}

/** very small TTL parser: 15m, 7d, 24h, 30s */
function ttlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit]!;
  return value * mult;
}
````

## apps/api/src/auth/dto/auth.dto.ts

````typescript
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9._]+$/, {
    message: 'username may only contain letters, numbers, dots and underscores',
  })
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt hard limit
  password!: string;

  @IsString()
  @IsNotEmpty()
  displayName!: string;
}

export class LoginDto {
  // accepts either email or username
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
````

## apps/api/src/auth/guards/jwt-auth.guard.ts

````typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Rejects the request when no valid bearer token is present. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/**
 * Lets the request through whether or not a token is present.
 * request.user is populated when a valid token exists, otherwise undefined.
 * Useful for public feeds that personalise when the viewer is logged in.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser>(_err: unknown, user: TUser): TUser {
    return user; // never throw — just attach user if available
  }
}
````

## apps/api/src/auth/strategies/jwt.strategy.ts

````typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../../common/decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret') as string,
    });
  }

  // whatever this returns becomes request.user
  validate(payload: JwtPayload): AuthUser {
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}
````

## apps/api/src/comments/comments.controller.ts

````typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get('posts/:postId/comments')
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Param('postId') postId: string,
    @Query() q: CursorPaginationDto,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.comments.list(postId, viewer?.id, q);
  }

  @Post('posts/:postId/comments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.comments.create(postId, user.id, dto);
  }

  @Get('comments/:commentId/replies')
  @UseGuards(OptionalJwtAuthGuard)
  replies(
    @Param('commentId') commentId: string,
    @Query() q: CursorPaginationDto,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.comments.listReplies(commentId, viewer?.id, q);
  }

  @Delete('comments/:commentId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('commentId') commentId: string, @CurrentUser() user: AuthUser) {
    return this.comments.remove(commentId, user.id);
  }

  @Post('comments/:commentId/like')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  like(@Param('commentId') commentId: string, @CurrentUser() user: AuthUser) {
    return this.comments.like(commentId, user.id);
  }

  @Delete('comments/:commentId/like')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  unlike(@Param('commentId') commentId: string, @CurrentUser() user: AuthUser) {
    return this.comments.unlike(commentId, user.id);
  }
}
````

## apps/api/src/comments/comments.module.ts

````typescript
import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
````

## apps/api/src/comments/comments.service.ts

````typescript
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { extractMentions } from '../common/text.util';
import { CursorPaginationDto, Page } from '../common/dto/pagination.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(postId: string, authorId: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    let replyToAuthorId: string | null = null;
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { postId: true, authorId: true },
      });
      if (!parent || parent.postId !== postId) {
        throw new BadRequestException('Invalid parent comment');
      }
      replyToAuthorId = parent.authorId;
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          postId,
          authorId,
          body: dto.body,
          parentId: dto.parentId,
        },
        include: { author: this.authorSelect() },
      });
      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });
      return created;
    });

    // notify the post author (for comments) or parent author (for replies)
    const notifyUserId = dto.parentId ? replyToAuthorId : post.authorId;
    if (notifyUserId && notifyUserId !== authorId) {
      await this.prisma.notification.create({
        data: {
          userId: notifyUserId,
          actorId: authorId,
          type: dto.parentId
            ? NotificationType.REPLY
            : NotificationType.COMMENT,
          postId,
          commentId: comment.id,
        },
      });
    }

    // notify @mentioned users in the comment body
    const mentioned = extractMentions(dto.body);
    if (mentioned.length) {
      const users = await this.prisma.user.findMany({
        where: { username: { in: mentioned }, NOT: { id: authorId } },
        select: { id: true },
      });
      await Promise.all(
        users.map((u) =>
          this.prisma.notification.create({
            data: {
              userId: u.id,
              actorId: authorId,
              type: NotificationType.MENTION,
              postId,
              commentId: comment.id,
            },
          }),
        ),
      );
    }

    return { ...comment, replyCount: 0, viewer: { liked: false } };
  }

  /** Top-level comments for a post, newest first, with reply counts. */
  async list(
    postId: string,
    viewerId: string | undefined,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const rows = await this.prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        author: this.authorSelect(),
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    return this.paginate(rows, q.limit, viewerId);
  }

  /** Replies under a single comment. */
  async listReplies(
    commentId: string,
    viewerId: string | undefined,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const rows = await this.prisma.comment.findMany({
      where: { parentId: commentId },
      include: {
        author: this.authorSelect(),
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    return this.paginate(rows, q.limit, viewerId);
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, postId: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.prisma.$transaction([
      this.prisma.comment.delete({ where: { id: commentId } }),
      this.prisma.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      }),
    ]);
    return { deleted: true };
  }

  async like(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const existing = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.commentLike.create({ data: { userId, commentId } }),
        this.prisma.comment.update({
          where: { id: commentId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
    }
    return this.likeState(commentId, userId);
  }

  async unlike(commentId: string, userId: string) {
    const deleted = await this.prisma.commentLike.deleteMany({
      where: { userId, commentId },
    });
    if (deleted.count > 0) {
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } },
      });
    }
    return this.likeState(commentId, userId);
  }

  // ---- helpers ----

  private async paginate<T extends { id: string }>(
    rows: T[],
    limit: number,
    viewerId?: string,
  ): Promise<Page<unknown>> {
    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;

    let likedSet = new Set<string>();
    if (viewerId && slice.length) {
      const likes = await this.prisma.commentLike.findMany({
        where: { userId: viewerId, commentId: { in: slice.map((c) => c.id) } },
        select: { commentId: true },
      });
      likedSet = new Set(likes.map((l) => l.commentId));
    }

    const items = slice.map((c) => {
      const withCount = c as T & { _count?: { replies: number } };
      return {
        ...c,
        replyCount: withCount._count?.replies ?? 0,
        viewer: { liked: likedSet.has(c.id) },
      };
    });

    return { items, nextCursor: hasMore ? slice[slice.length - 1].id : null };
  }

  private async likeState(commentId: string, userId: string) {
    const [comment, liked] = await Promise.all([
      this.prisma.comment.findUnique({
        where: { id: commentId },
        select: { likeCount: true },
      }),
      this.prisma.commentLike.findUnique({
        where: { userId_commentId: { userId, commentId } },
        select: { commentId: true },
      }),
    ]);
    return { liked: !!liked, likeCount: comment?.likeCount ?? 0 };
  }

  private authorSelect() {
    return {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
      },
    };
  }
}
````

## apps/api/src/comments/dto/create-comment.dto.ts

````typescript
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  body!: string;

  /** present when replying to another comment */
  @IsOptional()
  @IsString()
  parentId?: string;
}
````

## apps/api/src/common/decorators/current-user.decorator.ts

````typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return data ? user?.[data] : user;
  },
);
````

## apps/api/src/common/dto/pagination.dto.ts

````typescript
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CursorPaginationDto {
  /** id of the last item from the previous page */
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 15;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
````

## apps/api/src/common/text.util.ts

````typescript
/** Pull @usernames out of text, normalised (lowercase), deduped, no leading @. */
export function extractMentions(text: string): string[] {
  // the @ must not be preceded by a username char, so emails like
  // "john@example.com" don't get parsed as a mention of "example".
  const matches = text.match(/(?<![A-Za-z0-9._])@([a-zA-Z0-9._]+)/g) ?? [];
  return [
    ...new Set(
      matches
        .map((m) => m.replace(/^@/, '').toLowerCase().replace(/[._]+$/, ''))
        .filter((u) => u.length >= 3),
    ),
  ];
}
````

## apps/api/src/config/configuration.ts

````typescript
export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  ai: {
    // which LLM powers the tutor: 'anthropic' (Claude) or 'openai' (ChatGPT)
    provider: process.env.AI_PROVIDER ?? 'anthropic',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o',
    voyageApiKey: process.env.VOYAGE_API_KEY,
    moderationModel:
      process.env.MODERATION_MODEL ?? 'claude-haiku-4-5-20251001',
  },
});
````

## apps/api/src/feed/feed.controller.ts

````typescript
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { FeedService } from './feed.service';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get('home')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  home(@CurrentUser() user: AuthUser, @Query() q: CursorPaginationDto) {
    return this.feed.home(user.id, q);
  }

  @Get('explore')
  @UseGuards(OptionalJwtAuthGuard)
  explore(@CurrentUser() viewer?: AuthUser) {
    return this.feed.explore(viewer?.id);
  }

  @Get('reels')
  @UseGuards(OptionalJwtAuthGuard)
  reels(@Query() q: CursorPaginationDto, @CurrentUser() viewer?: AuthUser) {
    return this.feed.reels(viewer?.id, q);
  }

  @Get('user/:username')
  @UseGuards(OptionalJwtAuthGuard)
  byUser(
    @Param('username') username: string,
    @Query() q: CursorPaginationDto,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.feed.byUser(username, viewer?.id, q);
  }

  @Get('user/:username/tagged')
  @UseGuards(OptionalJwtAuthGuard)
  tagged(
    @Param('username') username: string,
    @Query() q: CursorPaginationDto,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.feed.taggedPosts(username, viewer?.id, q);
  }

  @Get('hashtag/:tag')
  @UseGuards(OptionalJwtAuthGuard)
  byHashtag(
    @Param('tag') tag: string,
    @Query() q: CursorPaginationDto,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.feed.byHashtag(tag, viewer?.id, q);
  }
}
````

## apps/api/src/feed/feed.module.ts

````typescript
import { Module } from '@nestjs/common';
import { PostsModule } from '../posts/posts.module';
import { SafetyModule } from '../safety/safety.module';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [PostsModule, SafetyModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
````

## apps/api/src/feed/feed.service.ts

````typescript
import { Injectable } from '@nestjs/common';
import {
  FollowStatus,
  ModerationStatus,
  PostType,
  Visibility,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PostsService } from '../posts/posts.service';
import { SafetyService } from '../safety/safety.service';
import { CursorPaginationDto, Page } from '../common/dto/pagination.dto';

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posts: PostsService,
    private readonly safety: SafetyService,
  ) {}

  /**
   * Home feed: posts from accounts the viewer follows (+ their own),
   * newest first, keyset/cursor paginated for stable infinite scroll.
   */
  async home(viewerId: string, q: CursorPaginationDto): Promise<Page<unknown>> {
    const following = await this.prisma.follow.findMany({
      where: { followerId: viewerId, status: FollowStatus.ACCEPTED },
      select: { followingId: true },
    });
    const blocked = await this.safety.blockedAndBlockerIds(viewerId);
    const authorIds = [...following.map((f) => f.followingId), viewerId].filter(
      (id) => !blocked.includes(id),
    );

    const rows = await this.prisma.post.findMany({
      where: {
        authorId: { in: authorIds },
        moderationStatus: ModerationStatus.APPROVED,
      },
      include: this.posts.postInclude(),
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1, // fetch one extra to detect the next page
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });

    return this.paginate(rows, q.limit, viewerId);
  }

  /**
   * Explore: public posts the viewer does NOT already follow, ranked by a
   * time-decayed engagement score (a lightweight, transparent ranker).
   */
  async explore(viewerId: string | undefined, limit = 30) {
    const following = viewerId
      ? await this.prisma.follow.findMany({
          where: { followerId: viewerId },
          select: { followingId: true },
        })
      : [];
    const excludeIds = [...following.map((f) => f.followingId)];
    if (viewerId) {
      excludeIds.push(viewerId);
      excludeIds.push(...(await this.safety.blockedAndBlockerIds(viewerId)));
    }

    const since = new Date(Date.now() - 14 * 86_400_000); // last 14 days
    const candidates = await this.prisma.post.findMany({
      where: {
        visibility: Visibility.PUBLIC,
        moderationStatus: ModerationStatus.APPROVED,
        createdAt: { gte: since },
        ...(excludeIds.length ? { authorId: { notIn: excludeIds } } : {}),
      },
      include: this.posts.postInclude(),
      orderBy: { createdAt: 'desc' },
      take: 300, // candidate pool, then rank in memory
    });

    const ranked = candidates
      .map((p) => ({ post: p, score: rankScore(p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.post);

    const items = await Promise.all(
      ranked.map((p) => this.posts.decorate(p, viewerId)),
    );
    return { items };
  }

  /** A user's own grid of posts (profile screen), cursor paginated. */
  async byUser(
    username: string,
    viewerId: string | undefined,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) return { items: [], nextCursor: null };

    const rows = await this.prisma.post.findMany({
      where: {
        authorId: user.id,
        moderationStatus: ModerationStatus.APPROVED,
      },
      include: this.posts.postInclude(),
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    return this.paginate(rows, q.limit, viewerId);
  }

  /** Posts a user has been @mentioned/tagged in. */
  async taggedPosts(
    username: string,
    viewerId: string | undefined,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) return { items: [], nextCursor: null };
    const blocked = viewerId
      ? await this.safety.blockedAndBlockerIds(viewerId)
      : [];
    const rows = await this.prisma.post.findMany({
      where: {
        moderationStatus: ModerationStatus.APPROVED,
        visibility: Visibility.PUBLIC,
        mentions: { some: { mentionedUserId: user.id } },
        ...(blocked.length ? { authorId: { notIn: blocked } } : {}),
      },
      include: this.posts.postInclude(),
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    return this.paginate(rows, q.limit, viewerId);
  }

  /** All public posts under a hashtag. */
  async byHashtag(
    tag: string,
    viewerId: string | undefined,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const rows = await this.prisma.post.findMany({
      where: {
        visibility: Visibility.PUBLIC,
        moderationStatus: ModerationStatus.APPROVED,
        hashtags: { some: { hashtag: { tag: tag.toLowerCase() } } },
      },
      include: this.posts.postInclude(),
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    return this.paginate(rows, q.limit, viewerId);
  }

  /** Reels: a vertical feed of short videos (REEL/VIDEO posts), block-aware. */
  async reels(
    viewerId: string | undefined,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const blocked = viewerId
      ? await this.safety.blockedAndBlockerIds(viewerId)
      : [];
    const rows = await this.prisma.post.findMany({
      where: {
        visibility: Visibility.PUBLIC,
        moderationStatus: ModerationStatus.APPROVED,
        type: { in: [PostType.REEL, PostType.VIDEO] },
        ...(blocked.length ? { authorId: { notIn: blocked } } : {}),
      },
      include: this.posts.postInclude(),
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    return this.paginate(rows, q.limit, viewerId);
  }

  // ---- helpers ----

  private async paginate<T extends { id: string }>(
    rows: T[],
    limit: number,
    viewerId?: string,
  ): Promise<Page<unknown>> {
    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    const items = await Promise.all(
      slice.map((p) => this.posts.decorate(p, viewerId)),
    );
    return {
      items,
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }
}

/**
 * Transparent ranking: engagement weighted, then decayed by age.
 * score = (likes + 2*comments + 1.5*saves + log views) / (hours + 2)^1.5
 */
function rankScore(p: {
  likeCount: number;
  commentCount: number;
  saveCount: number;
  viewCount: number;
  createdAt: Date;
}): number {
  const engagement =
    p.likeCount +
    2 * p.commentCount +
    1.5 * p.saveCount +
    Math.log10(p.viewCount + 1);
  const ageHours = (Date.now() - p.createdAt.getTime()) / 3_600_000;
  return engagement / Math.pow(ageHours + 2, 1.5);
}
````

## apps/api/src/messaging/chat.gateway.ts

````typescript
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { CallStatus, CallType, MessageType } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingService } from './messaging.service';

interface AuthedSocket extends Socket {
  data: { userId: string };
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);
  // userId -> set of socket ids (a user may have several devices/tabs)
  private readonly online = new Map<string, Set<string>>();

  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly messaging: MessagingService,
    private readonly prisma: PrismaService,
  ) {}

  // ---- connection lifecycle ----

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string);
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      const userId = payload.sub;
      (client as AuthedSocket).data.userId = userId;

      await client.join(this.userRoom(userId));
      const set = this.online.get(userId) ?? new Set<string>();
      const wasOffline = set.size === 0;
      set.add(client.id);
      this.online.set(userId, set);

      if (wasOffline) this.server.emit('presence:update', { userId, online: true });
      this.logger.log(`connected ${userId} (${client.id})`);
    } catch {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = (client as AuthedSocket).data?.userId;
    if (!userId) return;
    const set = this.online.get(userId);
    if (set) {
      set.delete(client.id);
      if (set.size === 0) {
        this.online.delete(userId);
        this.server.emit('presence:update', { userId, online: false });
      }
    }
  }

  // ---- chat rooms ----

  @SubscribeMessage('conversation:join')
  async onJoin(client: AuthedSocket, payload: { conversationId: string }) {
    if (!(await this.messaging.isMember(payload.conversationId, client.data.userId))) {
      return { ok: false, error: 'forbidden' };
    }
    await client.join(this.convRoom(payload.conversationId));
    return { ok: true };
  }

  @SubscribeMessage('conversation:leave')
  async onLeave(client: AuthedSocket, payload: { conversationId: string }) {
    await client.leave(this.convRoom(payload.conversationId));
    return { ok: true };
  }

  @SubscribeMessage('message:send')
  async onMessage(
    client: AuthedSocket,
    payload: {
      conversationId: string;
      body?: string;
      type?: MessageType;
      mediaUrl?: string;
      postId?: string;
    },
  ) {
    const message = await this.messaging.sendMessage(
      payload.conversationId,
      client.data.userId,
      {
        body: payload.body,
        type: payload.type,
        mediaUrl: payload.mediaUrl,
        postId: payload.postId,
      },
    );
    this.server.to(this.convRoom(payload.conversationId)).emit('message:new', message);
    return { ok: true, message };
  }

  @SubscribeMessage('typing')
  onTyping(
    client: AuthedSocket,
    payload: { conversationId: string; isTyping: boolean },
  ) {
    client.to(this.convRoom(payload.conversationId)).emit('typing', {
      conversationId: payload.conversationId,
      userId: client.data.userId,
      isTyping: payload.isTyping,
    });
  }

  @SubscribeMessage('read')
  async onRead(client: AuthedSocket, payload: { conversationId: string }) {
    await this.messaging.markRead(payload.conversationId, client.data.userId);
    this.server.to(this.convRoom(payload.conversationId)).emit('read', {
      conversationId: payload.conversationId,
      userId: client.data.userId,
      readAt: new Date(),
    });
    return { ok: true };
  }

  // ---- WebRTC call signaling ----
  // The gateway is the signaling channel; the actual audio/video stream is a
  // peer-to-peer WebRTC connection negotiated by relaying SDP + ICE candidates.

  @SubscribeMessage('call:invite')
  async onCallInvite(
    client: AuthedSocket,
    payload: { conversationId: string; callType: CallType },
  ) {
    if (!(await this.messaging.isMember(payload.conversationId, client.data.userId))) {
      return { ok: false, error: 'forbidden' };
    }
    const call = await this.prisma.callLog.create({
      data: {
        conversationId: payload.conversationId,
        initiatorId: client.data.userId,
        type: payload.callType ?? CallType.VIDEO,
        status: CallStatus.RINGING,
      },
    });
    const others = (
      await this.messaging.participantIds(payload.conversationId)
    ).filter((id) => id !== client.data.userId);
    for (const uid of others) {
      this.server.to(this.userRoom(uid)).emit('call:incoming', {
        callId: call.id,
        conversationId: payload.conversationId,
        from: client.data.userId,
        callType: call.type,
      });
    }
    return { ok: true, callId: call.id };
  }

  @SubscribeMessage('call:accept')
  async onCallAccept(client: AuthedSocket, payload: { callId: string }) {
    const call = await this.prisma.callLog.update({
      where: { id: payload.callId },
      data: { status: CallStatus.ONGOING },
    });
    this.server
      .to(this.convRoom(call.conversationId))
      .emit('call:accepted', { callId: call.id, by: client.data.userId });
    return { ok: true };
  }

  @SubscribeMessage('call:decline')
  async onCallDecline(client: AuthedSocket, payload: { callId: string }) {
    const call = await this.prisma.callLog.update({
      where: { id: payload.callId },
      data: { status: CallStatus.DECLINED, endedAt: new Date() },
    });
    this.server
      .to(this.convRoom(call.conversationId))
      .emit('call:declined', { callId: call.id, by: client.data.userId });
    return { ok: true };
  }

  @SubscribeMessage('call:end')
  async onCallEnd(client: AuthedSocket, payload: { callId: string }) {
    const call = await this.prisma.callLog.update({
      where: { id: payload.callId },
      data: { status: CallStatus.ENDED, endedAt: new Date() },
    });
    this.server
      .to(this.convRoom(call.conversationId))
      .emit('call:ended', { callId: call.id, by: client.data.userId });
    return { ok: true };
  }

  /** Relay an SDP offer/answer or ICE candidate to a specific peer. */
  @SubscribeMessage('call:signal')
  onCallSignal(
    client: AuthedSocket,
    payload: { to: string; data: unknown },
  ) {
    this.server.to(this.userRoom(payload.to)).emit('call:signal', {
      from: client.data.userId,
      data: payload.data,
    });
  }

  // ---- room helpers ----
  private userRoom(userId: string): string {
    return `user:${userId}`;
  }
  private convRoom(conversationId: string): string {
    return `conv:${conversationId}`;
  }
}
````

## apps/api/src/messaging/messaging.controller.ts

````typescript
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { MessagingService } from './messaging.service';

class StartChatDto {
  @IsString()
  @IsNotEmpty()
  username!: string;
}

class SharePostDto {
  @IsString()
  @IsNotEmpty()
  postId!: string;
}

@ApiTags('messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.messaging.listConversations(user.id);
  }

  /** Start (or fetch existing) a 1:1 chat with another user. */
  @Post('direct')
  startDirect(@CurrentUser() user: AuthUser, @Body() dto: StartChatDto) {
    return this.messaging.getOrCreateDirect(user.id, dto.username);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.messaging.getConversation(id, user.id);
  }

  @Get(':id/messages')
  messages(
    @Param('id') id: string,
    @Query() q: CursorPaginationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messaging.getMessages(id, user.id, q);
  }

  @Post(':id/read')
  read(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.messaging.markRead(id, user.id);
  }

  @Post(':id/share')
  share(
    @Param('id') id: string,
    @Body() dto: SharePostDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messaging.sharePost(id, user.id, dto.postId);
  }
}
````

## apps/api/src/messaging/messaging.module.ts

````typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SafetyModule } from '../safety/safety.module';
import { ChatGateway } from './chat.gateway';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';

@Module({
  imports: [JwtModule.register({}), SafetyModule],
  controllers: [MessagingController],
  providers: [MessagingService, ChatGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
````

## apps/api/src/messaging/messaging.service.ts

````typescript
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SafetyService } from '../safety/safety.service';
import { CursorPaginationDto, Page } from '../common/dto/pagination.dto';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safety: SafetyService,
  ) {}

  /** Find an existing 1:1 conversation between two users, or create one. */
  async getOrCreateDirect(userId: string, otherUsername: string) {
    const other = await this.prisma.user.findUnique({
      where: { username: otherUsername },
      select: { id: true },
    });
    if (!other) throw new NotFoundException('User not found');
    if (other.id === userId) {
      throw new ForbiddenException('Cannot start a chat with yourself');
    }
    if (await this.safety.isBlockedBetween(userId, other.id)) {
      throw new ForbiddenException('Unavailable');
    }

    // existing direct conversation containing exactly these two participants
    const existing = await this.prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: other.id } } },
        ],
      },
      select: { id: true },
    });
    if (existing) return this.getConversation(existing.id, userId);

    const created = await this.prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId }, { userId: other.id }],
        },
      },
      select: { id: true },
    });
    return this.getConversation(created.id, userId);
  }

  async listConversations(userId: string) {
    const parts = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: { include: { user: this.userCard() } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    return Promise.all(
      parts.map(async (p) => {
        const unread = await this.prisma.message.count({
          where: {
            conversationId: p.conversationId,
            senderId: { not: userId },
            createdAt: { gt: p.lastReadAt ?? new Date(0) },
          },
        });
        return {
          ...this.shapeConversation(p.conversation, userId),
          lastMessage: p.conversation.messages[0] ?? null,
          unreadCount: unread,
        };
      }),
    );
  }

  async getConversation(conversationId: string, userId: string) {
    await this.assertMember(conversationId, userId);
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { include: { user: this.userCard() } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return this.shapeConversation(conv, userId);
  }

  async getMessages(
    conversationId: string,
    userId: string,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    await this.assertMember(conversationId, userId);
    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: this.userCard() },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;

    // attach shared-post previews for POST_SHARE messages
    const postIds = slice
      .map((m) => m.postId)
      .filter((id): id is string => !!id);
    const sharedPosts = postIds.length
      ? await this.prisma.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            caption: true,
            author: { select: { id: true, username: true, avatarUrl: true } },
            media: {
              take: 1,
              orderBy: { position: 'asc' },
              select: { thumbnailUrl: true, url: true },
            },
          },
        })
      : [];
    const postMap = new Map(sharedPosts.map((p) => [p.id, p]));

    const items = slice.map((m) => ({
      ...m,
      sharedPost: m.postId ? (postMap.get(m.postId) ?? null) : null,
    }));
    return { items, nextCursor: hasMore ? slice[slice.length - 1].id : null };
  }

  /** Share a post into a conversation (Instagram-style "send in DM"). */
  async sharePost(conversationId: string, senderId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    return this.sendMessage(conversationId, senderId, {
      type: MessageType.POST_SHARE,
      postId,
    });
  }

  /** Persist a message and bump the conversation's updatedAt. Returns the row. */
  async sendMessage(
    conversationId: string,
    senderId: string,
    input: { body?: string; type?: MessageType; mediaUrl?: string; postId?: string },
  ) {
    await this.assertMember(conversationId, senderId);
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          type: input.type ?? MessageType.TEXT,
          body: input.body,
          mediaUrl: input.mediaUrl,
          postId: input.postId,
        },
        include: { sender: this.userCard() },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return message;
  }

  async markRead(conversationId: string, userId: string) {
    await this.assertMember(conversationId, userId);
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
    return { ok: true };
  }

  /** Ids of the other participants — used to target call/room events. */
  async participantIds(conversationId: string): Promise<string[]> {
    const parts = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    return parts.map((p) => p.userId);
  }

  async isMember(conversationId: string, userId: string): Promise<boolean> {
    const part = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { userId: true },
    });
    return !!part;
  }

  // ---- helpers ----

  private async assertMember(conversationId: string, userId: string) {
    if (!(await this.isMember(conversationId, userId))) {
      throw new ForbiddenException('Not a participant of this conversation');
    }
  }

  private shapeConversation(
    conv: {
      id: string;
      isGroup: boolean;
      title: string | null;
      updatedAt: Date;
      participants: Array<{
        userId: string;
        user: {
          id: string;
          username: string;
          displayName: string | null;
          avatarUrl: string | null;
        };
      }>;
    },
    userId: string,
  ) {
    const others = conv.participants
      .filter((p) => p.userId !== userId)
      .map((p) => p.user);
    return {
      id: conv.id,
      isGroup: conv.isGroup,
      title: conv.isGroup
        ? conv.title
        : (others[0]?.displayName ?? others[0]?.username ?? 'Chat'),
      updatedAt: conv.updatedAt,
      participants: conv.participants.map((p) => p.user),
      otherParticipants: others,
    };
  }

  private userCard() {
    return {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
      },
    };
  }
}
````

## apps/api/src/moderation/moderation.controller.ts

````typescript
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ModerationStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModerationService } from './moderation.service';

class SetStatusDto {
  @IsEnum(ModerationStatus)
  status!: ModerationStatus;
}

@ApiTags('moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  /** Author requests human review of a removed/flagged post. */
  @Post('posts/:id/appeal')
  appeal(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.moderation.appeal(id, user.id);
  }

  /** Moderator/admin queue of flagged + removed posts. */
  @Get('queue')
  queue(@CurrentUser() user: AuthUser) {
    return this.moderation.queue(user.role);
  }

  /** Admin override after review. */
  @Post('posts/:id/status')
  setStatus(
    @Param('id') id: string,
    @Body() dto: SetStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.moderation.setStatus(id, dto.status, user.role);
  }
}
````

## apps/api/src/moderation/moderation.module.ts

````typescript
import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

@Module({
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
````

## apps/api/src/moderation/moderation.service.ts

````typescript
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModerationStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface ModerationVerdict {
  isEducational: boolean;
  confidence: number; // 0..1
  category: string;
  reason: string;
}

// Decision thresholds (tunable). Deliberately conservative so we don't
// auto-remove on a shaky signal — borderline cases go to human review.
const APPROVE_MIN_CONFIDENCE = 0.5;
const REMOVE_MIN_CONFIDENCE = 0.75;

const SYSTEM_PROMPT = `You are the content classifier for Learnix, an educational social platform.
Decide whether a user's post has genuine educational value.

EDUCATIONAL = teaches or explains an academic subject (maths, sciences, languages,
history, geography, business, computing, etc.), study notes, revision material,
exam/past-paper content, tutorials, how-to/skill explainers, or factual learning content.

NOT EDUCATIONAL = pure entertainment with no learning value, memes without teaching,
advertising or self-promotion, spam, off-topic personal updates, dating/solicitation,
sexual or violent content, harassment, or misinformation presented as fact.

If it is borderline or you are unsure, lower your confidence rather than guessing.

Respond with ONLY a JSON object, no prose, no markdown fences:
{"isEducational": boolean, "confidence": number between 0 and 1, "category": short string, "reason": string under 30 words}`;

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Screen a freshly-created post. Updates moderationStatus, logs the verdict,
   * and warns the author if the post is removed. Never throws to the caller —
   * a moderation failure must not break posting (post stays PENDING for review).
   */
  async screenPost(postId: string): Promise<ModerationStatus> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        caption: true,
        media: { select: { type: true } },
        subject: { select: { name: true } },
      },
    });
    if (!post) return ModerationStatus.PENDING;

    const apiKey = this.config.get<string>('ai.anthropicApiKey');
    if (!apiKey) {
      // Dev / no key: don't block the app. Approve and log that it was skipped.
      this.logger.warn(
        `No ANTHROPIC_API_KEY set — skipping AI moderation for post ${postId} (auto-approved).`,
      );
      await this.apply(post.id, ModerationStatus.APPROVED, null, {
        isEducational: true,
        confidence: 0,
        category: 'unscreened',
        reason: 'Moderation skipped (no API key configured).',
      });
      return ModerationStatus.APPROVED;
    }

    let verdict: ModerationVerdict;
    try {
      verdict = await this.classify(post.caption ?? '', {
        mediaTypes: post.media.map((m) => m.type),
        subject: post.subject?.name ?? null,
      });
    } catch (err) {
      this.logger.error(
        `Moderation call failed for post ${postId}: ${(err as Error).message}`,
      );
      // Fail safe to human review rather than silently publishing.
      await this.apply(post.id, ModerationStatus.FLAGGED, null, {
        isEducational: false,
        confidence: 0,
        category: 'error',
        reason: 'Automated screening failed; queued for review.',
      });
      return ModerationStatus.FLAGGED;
    }

    const action = decideAction(verdict);
    const reason = action === ModerationStatus.REMOVED ? verdict.reason : null;
    await this.apply(post.id, action, reason, verdict);

    if (action === ModerationStatus.REMOVED) {
      await this.warnAuthor(post.authorId, post.id, verdict.reason);
    }
    return action;
  }

  /** Author asks for a human to re-check a removed/flagged post. */
  async appeal(postId: string, userId: string): Promise<{ status: string }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, moderationStatus: true },
    });
    if (!post) throw new ForbiddenException('Post not found');
    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only appeal your own posts');
    }
    await this.prisma.post.update({
      where: { id: postId },
      data: { moderationStatus: ModerationStatus.FLAGGED },
    });
    return { status: ModerationStatus.FLAGGED };
  }

  /** Admin/moderator review queue. */
  async queue(role: string) {
    if (role !== 'ADMIN' && role !== 'TEACHER') {
      throw new ForbiddenException('Moderator access required');
    }
    return this.prisma.post.findMany({
      where: {
        moderationStatus: {
          in: [ModerationStatus.FLAGGED, ModerationStatus.REMOVED],
        },
      },
      orderBy: { moderatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        caption: true,
        moderationStatus: true,
        moderationReason: true,
        moderatedAt: true,
        author: { select: { id: true, username: true } },
        moderationLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  /** Admin override after review. */
  async setStatus(
    postId: string,
    status: ModerationStatus,
    role: string,
  ): Promise<{ status: ModerationStatus }> {
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    await this.prisma.post.update({
      where: { id: postId },
      data: { moderationStatus: status, moderatedAt: new Date() },
    });
    return { status };
  }

  // ---- internals ----

  private async classify(
    caption: string,
    ctx: { mediaTypes: string[]; subject: string | null },
  ): Promise<ModerationVerdict> {
    const model =
      this.config.get<string>('ai.moderationModel') ??
      'claude-haiku-4-5-20251001';

    const userContent = [
      `Caption: ${caption || '(no caption)'}`,
      `Media: ${ctx.mediaTypes.length ? ctx.mediaTypes.join(', ') : 'none'}`,
      ctx.subject ? `Tagged subject: ${ctx.subject}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.config.get<string>('ai.anthropicApiKey') as string,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 256,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text =
      data.content
        ?.filter((b) => b.type === 'text')
        .map((b) => b.text ?? '')
        .join('') ?? '';

    return parseVerdict(text);
  }

  private async apply(
    postId: string,
    status: ModerationStatus,
    reason: string | null,
    verdict: ModerationVerdict,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.post.update({
        where: { id: postId },
        data: {
          moderationStatus: status,
          moderationReason: reason,
          moderatedAt: new Date(),
        },
      }),
      this.prisma.moderationLog.create({
        data: {
          postId,
          isEducational: verdict.isEducational,
          confidence: verdict.confidence,
          category: verdict.category,
          reason: verdict.reason,
          action: status,
          model:
            this.config.get<string>('ai.moderationModel') ??
            'claude-haiku-4-5-20251001',
        },
      }),
    ]);
  }

  private async warnAuthor(
    authorId: string,
    postId: string,
    reason: string,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: authorId,
        actorId: null, // system notice
        type: NotificationType.MODERATION,
        postId,
      },
    });
    this.logger.log(`Warned ${authorId} — post ${postId} removed: ${reason}`);
  }
}

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested in test/moderation.spec.ts)
// ---------------------------------------------------------------------------

/** Map a verdict to a moderation action using confidence thresholds. */
export function decideAction(v: ModerationVerdict): ModerationStatus {
  const c = clamp01(v.confidence);
  if (v.isEducational && c >= APPROVE_MIN_CONFIDENCE) {
    return ModerationStatus.APPROVED;
  }
  if (!v.isEducational && c >= REMOVE_MIN_CONFIDENCE) {
    return ModerationStatus.REMOVED;
  }
  return ModerationStatus.FLAGGED; // borderline → human review
}

/**
 * Robustly parse the classifier's reply into a verdict. Tolerates code fences
 * and surrounding prose by extracting the first JSON object. Falsy/garbage
 * input yields a safe "flag for review" verdict.
 */
export function parseVerdict(text: string): ModerationVerdict {
  const fallback: ModerationVerdict = {
    isEducational: false,
    confidence: 0,
    category: 'unparseable',
    reason: 'Could not parse classifier output; needs review.',
  };
  if (!text) return fallback;

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return fallback;

  try {
    const raw = JSON.parse(text.slice(start, end + 1)) as Record<
      string,
      unknown
    >;
    return {
      isEducational: Boolean(raw.isEducational),
      confidence: clamp01(Number(raw.confidence)),
      category:
        typeof raw.category === 'string' && raw.category
          ? raw.category
          : 'uncategorised',
      reason:
        typeof raw.reason === 'string' && raw.reason
          ? raw.reason
          : 'No reason provided.',
    };
  } catch {
    return fallback;
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
````

## apps/api/src/notifications/dto/mark-read.dto.ts

````typescript
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class MarkReadDto {
  @IsOptional()
  @IsBoolean()
  all?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}
````

## apps/api/src/notifications/notifications.controller.ts

````typescript
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: CursorPaginationDto) {
    return this.notifications.list(user.id, q);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Post('read')
  @HttpCode(200)
  markRead(@CurrentUser() user: AuthUser, @Body() dto: MarkReadDto) {
    return this.notifications.markRead(user.id, dto);
  }
}
````

## apps/api/src/notifications/notifications.module.ts

````typescript
import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
````

## apps/api/src/notifications/notifications.service.ts

````typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CursorPaginationDto, Page } from '../common/dto/pagination.dto';
import { MarkReadDto } from './dto/mark-read.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });

    // attach a tiny post thumbnail when the notification references a post
    const postIds = rows
      .map((n) => n.postId)
      .filter((id): id is string => !!id);
    const previews = postIds.length
      ? await this.prisma.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            media: {
              take: 1,
              orderBy: { position: 'asc' },
              select: { thumbnailUrl: true, url: true },
            },
          },
        })
      : [];
    const previewMap = new Map(previews.map((p) => [p.id, p.media[0] ?? null]));

    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;
    const items = slice.map((n) => ({
      ...n,
      postPreview: n.postId ? (previewMap.get(n.postId) ?? null) : null,
    }));

    return {
      items,
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(userId: string, dto: MarkReadDto): Promise<{ updated: number }> {
    const where = dto.all
      ? { userId, isRead: false }
      : { userId, id: { in: dto.ids ?? [] } };
    const res = await this.prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });
    return { updated: res.count };
  }
}
````

## apps/api/src/posts/dto/create-post.dto.ts

````typescript
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MediaType, PostType, Visibility } from '@prisma/client';

export class MediaItemDto {
  @IsEnum(MediaType)
  type!: MediaType;

  @IsUrl({ require_tld: false })
  url!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  blurhash?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSec?: number;
}

export class CreatePostDto {
  @IsEnum(PostType)
  type!: PostType;

  @IsOptional()
  @IsString()
  @MaxLength(2200)
  caption?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10) // Instagram-style carousel cap
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  media!: MediaItemDto[];
}
````

## apps/api/src/posts/posts.controller.ts

````typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

class EditCaptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2200)
  caption!: string;
}

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.posts.create(user.id, dto);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() viewer?: AuthUser) {
    return this.posts.findOne(id, viewer?.id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.posts.remove(id, user.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  editCaption(
    @Param('id') id: string,
    @Body() dto: EditCaptionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.posts.editCaption(id, user.id, dto.caption);
  }

  @Get(':id/likes')
  @UseGuards(OptionalJwtAuthGuard)
  likers(@Param('id') id: string, @Query() q: CursorPaginationDto) {
    return this.posts.likers(id, q);
  }

  @Post(':id/view')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  view(@Param('id') id: string) {
    return this.posts.registerView(id);
  }

  @Post(':id/like')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  like(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.posts.like(id, user.id);
  }

  @Delete(':id/like')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  unlike(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.posts.unlike(id, user.id);
  }

  @Post(':id/save')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  save(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.posts.save(id, user.id);
  }

  @Delete(':id/save')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  unsave(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.posts.unsave(id, user.id);
  }
}
````

## apps/api/src/posts/posts.module.ts

````typescript
import { Module } from '@nestjs/common';
import { ModerationModule } from '../moderation/moderation.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [ModerationModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
````

## apps/api/src/posts/posts.service.ts

````typescript
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModerationStatus, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { extractMentions } from '../common/text.util';
import { CreatePostDto } from './dto/create-post.dto';

const XP_PER_POST = 10;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ModerationService,
  ) {}

  async create(authorId: string, dto: CreatePostDto) {
    const tags = extractHashtags(dto.caption ?? '');

    const post = await this.prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          authorId,
          type: dto.type,
          caption: dto.caption,
          visibility: dto.visibility ?? 'PUBLIC',
          subjectId: dto.subjectId,
          media: {
            create: dto.media.map((m, i) => ({
              type: m.type,
              url: m.url,
              thumbnailUrl: m.thumbnailUrl,
              blurhash: m.blurhash,
              width: m.width,
              height: m.height,
              durationSec: m.durationSec,
              position: i,
            })),
          },
        },
      });

      // upsert hashtags and link them
      for (const tag of tags) {
        const hashtag = await tx.hashtag.upsert({
          where: { tag },
          create: { tag },
          update: {},
        });
        await tx.postHashtag.create({
          data: { postId: created.id, hashtagId: hashtag.id },
        });
      }

      // reward content creation (Duolingo-style XP loop)
      await tx.user.update({
        where: { id: authorId },
        data: { xp: { increment: XP_PER_POST } },
      });

      return created;
    });

    // AI screen for educational value: approves, flags for review, or removes
    // (and warns the author). Runs inline so the response reflects the verdict.
    const status = await this.moderation.screenPost(post.id);
    if (status !== ModerationStatus.REMOVED) {
      await this.processMentions(post.id, authorId, dto.caption ?? '');
    }

    return this.findOne(post.id, authorId);
  }

  /** Resolve @mentions in a caption → tag rows + notifications. */
  private async processMentions(
    postId: string,
    authorId: string,
    caption: string,
  ): Promise<void> {
    const usernames = extractMentions(caption);
    if (!usernames.length) return;
    const users = await this.prisma.user.findMany({
      where: { username: { in: usernames }, NOT: { id: authorId } },
      select: { id: true },
    });
    if (!users.length) return;
    await this.prisma.$transaction([
      ...users.map((u) =>
        this.prisma.postMention.upsert({
          where: {
            postId_mentionedUserId: { postId, mentionedUserId: u.id },
          },
          create: { postId, mentionedUserId: u.id },
          update: {},
        }),
      ),
      ...users.map((u) =>
        this.prisma.notification.create({
          data: {
            userId: u.id,
            actorId: authorId,
            type: NotificationType.MENTION,
            postId,
          },
        }),
      ),
    ]);
  }

  async findOne(postId: string, viewerId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: this.postInclude(),
    });
    if (!post) throw new NotFoundException('Post not found');
    return this.decorate(post, viewerId);
  }

  async remove(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.prisma.post.delete({ where: { id: postId } });
    return { deleted: true };
  }

  /** Users who liked a post (Instagram shows this list). */
  async likers(postId: string, q: { cursor?: string; limit: number }) {
    const rows = await this.prisma.like.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor
        ? { cursor: { userId_postId: { userId: q.cursor, postId } }, skip: 1 }
        : {}),
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });
    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;
    return {
      items: slice.map((r) => r.user),
      nextCursor: hasMore ? slice[slice.length - 1].userId : null,
    };
  }

  /** Edit a post's caption — re-syncs hashtags, re-screens, re-processes mentions. */
  async editCaption(postId: string, userId: string, caption: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const tags = extractHashtags(caption);
    await this.prisma.$transaction(async (tx) => {
      await tx.post.update({ where: { id: postId }, data: { caption } });
      await tx.postHashtag.deleteMany({ where: { postId } });
      for (const tag of tags) {
        const hashtag = await tx.hashtag.upsert({
          where: { tag },
          create: { tag },
          update: {},
        });
        await tx.postHashtag.create({
          data: { postId, hashtagId: hashtag.id },
        });
      }
    });

    const status = await this.moderation.screenPost(postId);
    if (status !== ModerationStatus.REMOVED) {
      await this.processMentions(postId, userId, caption);
    }
    return this.findOne(postId, userId);
  }

  /** Count a view (used by feed/reels/post open). */
  async registerView(postId: string) {
    await this.prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });
    return { ok: true };
  }

  async like(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    try {
      await this.prisma.$transaction([
        this.prisma.like.create({ data: { postId, userId } }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
      if (post.authorId !== userId) {
        await this.prisma.notification.create({
          data: {
            userId: post.authorId,
            actorId: userId,
            type: NotificationType.LIKE,
            postId,
          },
        });
      }
    } catch (e) {
      // unique violation => already liked, make it idempotent
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return this.likeState(postId, userId);
      }
      throw e;
    }
    return this.likeState(postId, userId);
  }

  async unlike(postId: string, userId: string) {
    const deleted = await this.prisma.like.deleteMany({
      where: { postId, userId },
    });
    if (deleted.count > 0) {
      await this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      });
    }
    return this.likeState(postId, userId);
  }

  async save(postId: string, userId: string, collectionId?: string) {
    await this.prisma.bookmark.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId, collectionId },
      update: { collectionId },
    });
    await this.syncSaveCount(postId);
    return { saved: true };
  }

  async unsave(postId: string, userId: string) {
    await this.prisma.bookmark.deleteMany({ where: { userId, postId } });
    await this.syncSaveCount(postId);
    return { saved: false };
  }

  // ---- shared shaping (also reused by the feed module) ----

  postInclude(): Prisma.PostInclude {
    return {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isVerified: true,
        },
      },
      media: { orderBy: { position: 'asc' } },
      subject: { select: { id: true, name: true, level: true } },
    };
  }

  async decorate<T extends { id: string }>(post: T, viewerId?: string) {
    if (!viewerId) return { ...post, viewer: { liked: false, saved: false } };
    const [liked, saved] = await Promise.all([
      this.prisma.like.findUnique({
        where: { userId_postId: { userId: viewerId, postId: post.id } },
        select: { postId: true },
      }),
      this.prisma.bookmark.findUnique({
        where: { userId_postId: { userId: viewerId, postId: post.id } },
        select: { postId: true },
      }),
    ]);
    return { ...post, viewer: { liked: !!liked, saved: !!saved } };
  }

  private async likeState(postId: string, userId: string) {
    const [post, liked] = await Promise.all([
      this.prisma.post.findUnique({
        where: { id: postId },
        select: { likeCount: true },
      }),
      this.prisma.like.findUnique({
        where: { userId_postId: { userId, postId } },
        select: { postId: true },
      }),
    ]);
    return { liked: !!liked, likeCount: post?.likeCount ?? 0 };
  }

  private async syncSaveCount(postId: string) {
    const count = await this.prisma.bookmark.count({ where: { postId } });
    await this.prisma.post.update({
      where: { id: postId },
      data: { saveCount: count },
    });
  }
}

/** Pull #hashtags out of caption text, normalised to lowercase, deduped. */
function extractHashtags(text: string): string[] {
  const matches = text.match(/#([\p{L}\p{N}_]+)/gu) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}
````

## apps/api/src/prisma/prisma.module.ts

````typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
````

## apps/api/src/prisma/prisma.service.ts

````typescript
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
````

## apps/api/src/safety/safety.controller.ts

````typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportTargetType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SafetyService } from './safety.service';

class CreateReportDto {
  @IsEnum(ReportTargetType)
  targetType!: ReportTargetType;

  @IsOptional()
  @IsString()
  postId?: string;

  @IsOptional()
  @IsString()
  reportedUsername?: string;

  @IsOptional()
  @IsString()
  commentId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}

@ApiTags('safety')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  @Post('users/:username/block')
  block(@Param('username') username: string, @CurrentUser() user: AuthUser) {
    return this.safety.block(user.id, username);
  }

  @Delete('users/:username/block')
  unblock(@Param('username') username: string, @CurrentUser() user: AuthUser) {
    return this.safety.unblock(user.id, username);
  }

  @Get('users/me/blocked')
  blocked(@CurrentUser() user: AuthUser) {
    return this.safety.listBlocked(user.id);
  }

  @Post('reports')
  report(@CurrentUser() user: AuthUser, @Body() dto: CreateReportDto) {
    return this.safety.report(user.id, dto);
  }

  @Get('reports/queue')
  queue(@CurrentUser() user: AuthUser) {
    return this.safety.reportQueue(user.role);
  }
}
````

## apps/api/src/safety/safety.module.ts

````typescript
import { Module } from '@nestjs/common';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';

@Module({
  controllers: [SafetyController],
  providers: [SafetyService],
  exports: [SafetyService],
})
export class SafetyModule {}
````

## apps/api/src/safety/safety.service.ts

````typescript
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReportStatus, ReportTargetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateReportInput {
  targetType: ReportTargetType;
  postId?: string;
  reportedUsername?: string;
  commentId?: string;
  reason: string;
  details?: string;
}

@Injectable()
export class SafetyService {
  constructor(private readonly prisma: PrismaService) {}

  async block(userId: string, username: string) {
    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === userId) {
      throw new BadRequestException('You cannot block yourself');
    }

    await this.prisma.$transaction([
      this.prisma.block.upsert({
        where: {
          blockerId_blockedId: { blockerId: userId, blockedId: target.id },
        },
        create: { blockerId: userId, blockedId: target.id },
        update: {},
      }),
      // blocking severs the follow relationship in both directions (like IG)
      this.prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: userId, followingId: target.id },
            { followerId: target.id, followingId: userId },
          ],
        },
      }),
    ]);
    return { blocked: true };
  }

  async unblock(userId: string, username: string) {
    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');
    await this.prisma.block.deleteMany({
      where: { blockerId: userId, blockedId: target.id },
    });
    return { blocked: false };
  }

  async listBlocked(userId: string) {
    const rows = await this.prisma.block.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        blocked: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    return rows.map((r) => r.blocked);
  }

  async report(reporterId: string, input: CreateReportInput) {
    let reportedUserId: string | undefined;
    if (input.targetType === ReportTargetType.USER) {
      if (!input.reportedUsername) {
        throw new BadRequestException('reportedUsername is required');
      }
      const u = await this.prisma.user.findUnique({
        where: { username: input.reportedUsername },
        select: { id: true },
      });
      if (!u) throw new NotFoundException('Reported user not found');
      reportedUserId = u.id;
    }
    if (input.targetType === ReportTargetType.POST && !input.postId) {
      throw new BadRequestException('postId is required');
    }
    if (input.targetType === ReportTargetType.COMMENT && !input.commentId) {
      throw new BadRequestException('commentId is required');
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetType: input.targetType,
        postId: input.postId,
        reportedUserId,
        commentId: input.commentId,
        reason: input.reason,
        details: input.details,
        status: ReportStatus.OPEN,
      },
    });
    return { id: report.id, status: report.status };
  }

  /** Admin/moderator report queue. */
  async reportQueue(role: string) {
    if (role !== 'ADMIN' && role !== 'TEACHER') {
      throw new ForbiddenException('Moderator access required');
    }
    return this.prisma.report.findMany({
      where: { status: ReportStatus.OPEN },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        reporter: { select: { id: true, username: true } },
      },
    });
  }

  /**
   * Union of users the given user has blocked and users who have blocked them.
   * Used to filter feeds, stories, search, and messaging in both directions.
   */
  async blockedAndBlockerIds(userId: string): Promise<string[]> {
    const [iBlocked, blockedMe] = await Promise.all([
      this.prisma.block.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
      }),
      this.prisma.block.findMany({
        where: { blockedId: userId },
        select: { blockerId: true },
      }),
    ]);
    return [
      ...new Set([
        ...iBlocked.map((b) => b.blockedId),
        ...blockedMe.map((b) => b.blockerId),
      ]),
    ];
  }

  async isBlockedBetween(a: string, b: string): Promise<boolean> {
    const found = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
      select: { blockerId: true },
    });
    return !!found;
  }
}
````

## apps/api/src/saved/saved.controller.ts

````typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { SavedService } from './saved.service';

class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;
}

class AssignCollectionDto {
  @IsOptional()
  @IsString()
  collectionId?: string | null;
}

@ApiTags('saved')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SavedController {
  constructor(private readonly saved: SavedService) {}

  @Get('saved')
  listSaved(@CurrentUser() user: AuthUser, @Query() q: CursorPaginationDto) {
    return this.saved.listSaved(user.id, q);
  }

  @Get('collections')
  listCollections(@CurrentUser() user: AuthUser) {
    return this.saved.listCollections(user.id);
  }

  @Post('collections')
  createCollection(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCollectionDto,
  ) {
    return this.saved.createCollection(user.id, dto.name);
  }

  @Delete('collections/:id')
  deleteCollection(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.saved.deleteCollection(user.id, id);
  }

  @Get('collections/:id/posts')
  collectionPosts(
    @Param('id') id: string,
    @Query() q: CursorPaginationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.saved.collectionPosts(user.id, id, q);
  }

  @Put('saved/:postId/collection')
  assign(
    @Param('postId') postId: string,
    @Body() dto: AssignCollectionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.saved.assign(user.id, postId, dto.collectionId ?? null);
  }
}
````

## apps/api/src/saved/saved.module.ts

````typescript
import { Module } from '@nestjs/common';
import { SavedController } from './saved.controller';
import { SavedService } from './saved.service';

@Module({
  controllers: [SavedController],
  providers: [SavedService],
})
export class SavedModule {}
````

## apps/api/src/saved/saved.service.ts

````typescript
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CursorPaginationDto, Page } from '../common/dto/pagination.dto';

@Injectable()
export class SavedService {
  constructor(private readonly prisma: PrismaService) {}

  async listSaved(
    userId: string,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const rows = await this.prisma.bookmark.findMany({
      where: { userId },
      include: { post: { include: this.postInclude() } },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor
        ? { cursor: { userId_postId: { userId, postId: q.cursor } }, skip: 1 }
        : {}),
    });
    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;
    return {
      items: slice.map((b) => b.post),
      nextCursor: hasMore ? slice[slice.length - 1].postId : null,
    };
  }

  async listCollections(userId: string) {
    const cols = await this.prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { bookmarks: true } } },
    });
    return cols.map((c) => ({
      id: c.id,
      name: c.name,
      count: c._count.bookmarks,
      createdAt: c.createdAt,
    }));
  }

  async createCollection(userId: string, name: string) {
    try {
      return await this.prisma.collection.create({ data: { userId, name } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ForbiddenException('You already have a collection with that name');
      }
      throw e;
    }
  }

  async deleteCollection(userId: string, collectionId: string) {
    const col = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      select: { userId: true },
    });
    if (!col) throw new NotFoundException('Collection not found');
    if (col.userId !== userId) throw new ForbiddenException('Not your collection');
    await this.prisma.collection.delete({ where: { id: collectionId } });
    return { deleted: true };
  }

  async collectionPosts(
    userId: string,
    collectionId: string,
    q: CursorPaginationDto,
  ): Promise<Page<unknown>> {
    const col = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      select: { userId: true },
    });
    if (!col) throw new NotFoundException('Collection not found');
    if (col.userId !== userId) throw new ForbiddenException('Not your collection');

    const rows = await this.prisma.bookmark.findMany({
      where: { userId, collectionId },
      include: { post: { include: this.postInclude() } },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor
        ? { cursor: { userId_postId: { userId, postId: q.cursor } }, skip: 1 }
        : {}),
    });
    const hasMore = rows.length > q.limit;
    const slice = hasMore ? rows.slice(0, q.limit) : rows;
    return {
      items: slice.map((b) => b.post),
      nextCursor: hasMore ? slice[slice.length - 1].postId : null,
    };
  }

  /** Move a saved post into (or out of) a collection. */
  async assign(userId: string, postId: string, collectionId: string | null) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
      select: { userId: true },
    });
    if (!bookmark) throw new NotFoundException('You have not saved that post');

    if (collectionId) {
      const col = await this.prisma.collection.findUnique({
        where: { id: collectionId },
        select: { userId: true },
      });
      if (!col || col.userId !== userId) {
        throw new ForbiddenException('Not your collection');
      }
    }
    await this.prisma.bookmark.update({
      where: { userId_postId: { userId, postId } },
      data: { collectionId },
    });
    return { ok: true };
  }

  private postInclude(): Prisma.PostInclude {
    return {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isVerified: true,
        },
      },
      media: { orderBy: { position: 'asc' } },
    };
  }
}
````

## apps/api/src/search/search.controller.ts

````typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  run(
    @Query('q') q: string,
    @Query('type') type: 'all' | 'users' | 'hashtags' | 'posts' = 'all',
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.search.search(viewer?.id, q ?? '', type);
  }
}
````

## apps/api/src/search/search.module.ts

````typescript
import { Module } from '@nestjs/common';
import { SafetyModule } from '../safety/safety.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [SafetyModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
````

## apps/api/src/search/search.service.ts

````typescript
import { Injectable } from '@nestjs/common';
import { ModerationStatus, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SafetyService } from '../safety/safety.service';

type SearchType = 'all' | 'users' | 'hashtags' | 'posts';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safety: SafetyService,
  ) {}

  async search(viewerId: string | undefined, raw: string, type: SearchType = 'all') {
    const q = raw.trim();
    if (q.length < 1) return { users: [], hashtags: [], posts: [] };

    const blocked = viewerId
      ? await this.safety.blockedAndBlockerIds(viewerId)
      : [];

    const [users, hashtags, posts] = await Promise.all([
      type === 'all' || type === 'users' ? this.users(q, blocked) : [],
      type === 'all' || type === 'hashtags' ? this.hashtags(q) : [],
      type === 'all' || type === 'posts' ? this.posts(q, blocked) : [],
    ]);

    return { users, hashtags, posts };
  }

  private users(q: string, blocked: string[]) {
    // strip a leading @ so "@amina" and "amina" both work
    const term = q.replace(/^@/, '');
    return this.prisma.user.findMany({
      where: {
        id: blocked.length ? { notIn: blocked } : undefined,
        OR: [
          { username: { contains: term, mode: 'insensitive' } },
          { displayName: { contains: term, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ isVerified: 'desc' }, { username: 'asc' }],
      take: 12,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
        _count: { select: { followers: true } },
      },
    });
  }

  private async hashtags(q: string) {
    const term = q.replace(/^#/, '').toLowerCase();
    const rows = await this.prisma.hashtag.findMany({
      where: { tag: { contains: term } },
      take: 12,
      include: { _count: { select: { posts: true } } },
    });
    return rows
      .map((h) => ({ id: h.id, tag: h.tag, postCount: h._count.posts }))
      .sort((a, b) => b.postCount - a.postCount);
  }

  private posts(q: string, blocked: string[]) {
    return this.prisma.post.findMany({
      where: {
        visibility: Visibility.PUBLIC,
        moderationStatus: ModerationStatus.APPROVED,
        caption: { contains: q, mode: 'insensitive' },
        ...(blocked.length ? { authorId: { notIn: blocked } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 18,
      select: {
        id: true,
        caption: true,
        likeCount: true,
        commentCount: true,
        author: { select: { id: true, username: true, avatarUrl: true } },
        media: {
          take: 1,
          orderBy: { position: 'asc' },
          select: { thumbnailUrl: true, url: true },
        },
      },
    });
  }
}
````

## apps/api/src/stories/stories.controller.ts

````typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoriesService } from './stories.service';

class CreateStoryDto {
  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @IsUrl({ require_tld: false })
  mediaUrl!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  blurhash?: string;

  @IsOptional()
  @IsNumber()
  durationSec?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}

@ApiTags('stories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stories')
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  /** Story tray for the home screen. */
  @Get('tray')
  tray(@CurrentUser() user: AuthUser) {
    return this.stories.tray(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStoryDto) {
    return this.stories.create(user.id, dto);
  }

  @Get('user/:username')
  forUser(@Param('username') username: string, @CurrentUser() user: AuthUser) {
    return this.stories.forUser(username, user.id);
  }

  @Post(':id/view')
  @HttpCode(200)
  view(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.stories.view(id, user.id);
  }

  @Get(':id/viewers')
  viewers(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.stories.viewers(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.stories.remove(id, user.id);
  }
}
````

## apps/api/src/stories/stories.module.ts

````typescript
import { Module } from '@nestjs/common';
import { SafetyModule } from '../safety/safety.module';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [SafetyModule],
  controllers: [StoriesController],
  providers: [StoriesService],
})
export class StoriesModule {}
````

## apps/api/src/stories/stories.service.ts

````typescript
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FollowStatus, MediaType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SafetyService } from '../safety/safety.service';

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

export interface CreateStoryInput {
  type?: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  blurhash?: string;
  durationSec?: number;
  caption?: string;
}

@Injectable()
export class StoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safety: SafetyService,
  ) {}

  async create(authorId: string, input: CreateStoryInput) {
    return this.prisma.story.create({
      data: {
        authorId,
        type: input.type ?? MediaType.IMAGE,
        mediaUrl: input.mediaUrl,
        thumbnailUrl: input.thumbnailUrl,
        blurhash: input.blurhash,
        durationSec: input.durationSec,
        caption: input.caption,
        expiresAt: new Date(Date.now() + STORY_TTL_MS),
      },
    });
  }

  /** Story tray: active stories from people you follow (+ your own), grouped by author. */
  async tray(viewerId: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: viewerId, status: FollowStatus.ACCEPTED },
      select: { followingId: true },
    });
    const blocked = await this.safety.blockedAndBlockerIds(viewerId);
    const authorIds = [...following.map((f) => f.followingId), viewerId].filter(
      (id) => !blocked.includes(id),
    );

    const stories = await this.prisma.story.findMany({
      where: { authorId: { in: authorIds }, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    // which of these has the viewer already seen?
    const seen = await this.prisma.storyView.findMany({
      where: { viewerId, storyId: { in: stories.map((s) => s.id) } },
      select: { storyId: true },
    });
    const seenSet = new Set(seen.map((s) => s.storyId));

    // group by author
    const groups = new Map<string, { author: unknown; stories: typeof stories; hasUnseen: boolean }>();
    for (const s of stories) {
      const g = groups.get(s.authorId) ?? {
        author: s.author,
        stories: [] as typeof stories,
        hasUnseen: false,
      };
      g.stories.push(s);
      if (!seenSet.has(s.id)) g.hasUnseen = true;
      groups.set(s.authorId, g);
    }

    // unseen rings first (like Instagram), your own ring pinned to front
    return [...groups.values()].sort((a, b) => {
      const aOwn = (a.author as { id: string }).id === viewerId ? 1 : 0;
      const bOwn = (b.author as { id: string }).id === viewerId ? 1 : 0;
      if (aOwn !== bOwn) return bOwn - aOwn;
      return Number(b.hasUnseen) - Number(a.hasUnseen);
    });
  }

  /** Active stories for one user (if the viewer is allowed to see them). */
  async forUser(username: string, viewerId: string) {
    const author = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, isPrivate: true },
    });
    if (!author) throw new NotFoundException('User not found');
    await this.assertCanView(author.id, author.isPrivate, viewerId);

    const stories = await this.prisma.story.findMany({
      where: { authorId: author.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
    });
    const seen = await this.prisma.storyView.findMany({
      where: { viewerId, storyId: { in: stories.map((s) => s.id) } },
      select: { storyId: true },
    });
    const seenSet = new Set(seen.map((s) => s.storyId));
    return stories.map((s) => ({ ...s, viewed: seenSet.has(s.id) }));
  }

  async view(storyId: string, viewerId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { authorId: true, expiresAt: true },
    });
    if (!story || story.expiresAt < new Date()) {
      throw new NotFoundException('Story not found or expired');
    }
    const author = await this.prisma.user.findUnique({
      where: { id: story.authorId },
      select: { isPrivate: true },
    });
    await this.assertCanView(story.authorId, author?.isPrivate ?? false, viewerId);

    await this.prisma.storyView.upsert({
      where: { storyId_viewerId: { storyId, viewerId } },
      create: { storyId, viewerId },
      update: {},
    });
    return { viewed: true };
  }

  /** Author-only list of who viewed a story. */
  async viewers(storyId: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { authorId: true },
    });
    if (!story) throw new NotFoundException('Story not found');
    if (story.authorId !== userId) {
      throw new ForbiddenException('Only the author can see viewers');
    }
    const views = await this.prisma.storyView.findMany({
      where: { storyId },
      orderBy: { viewedAt: 'desc' },
      select: {
        viewedAt: true,
        viewer: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    return views.map((v) => ({ ...v.viewer, viewedAt: v.viewedAt }));
  }

  async remove(storyId: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { authorId: true },
    });
    if (!story) throw new NotFoundException('Story not found');
    if (story.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own stories');
    }
    await this.prisma.story.delete({ where: { id: storyId } });
    return { deleted: true };
  }

  // ---- helpers ----

  private async assertCanView(
    authorId: string,
    isPrivate: boolean,
    viewerId: string,
  ) {
    if (authorId === viewerId) return;
    if (await this.safety.isBlockedBetween(authorId, viewerId)) {
      throw new ForbiddenException('Unavailable');
    }
    if (!isPrivate) return;
    const edge = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: viewerId, followingId: authorId },
      },
      select: { status: true },
    });
    if (edge?.status !== FollowStatus.ACCEPTED) {
      throw new ForbiddenException('This account is private');
    }
  }
}
````

## apps/api/src/users/dto/update-profile.dto.ts

````typescript
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  bio?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class ChangeUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9._]+$/, {
    message: 'username may only contain letters, numbers, dots and underscores',
  })
  username!: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}
````

## apps/api/src/users/users.controller.ts

````typescript
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import {
  ChangePasswordDto,
  ChangeUsernameDto,
  UpdateProfileDto,
} from './dto/update-profile.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Patch('me/username')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  changeUsername(@CurrentUser() user: AuthUser, @Body() dto: ChangeUsernameDto) {
    return this.users.changeUsername(user.id, dto);
  }

  @Patch('me/password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(user.id, dto);
  }

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  getProfile(
    @Param('username') username: string,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.users.getProfile(username, viewer?.id);
  }

  @Get(':username/followers')
  @UseGuards(OptionalJwtAuthGuard)
  followers(
    @Param('username') username: string,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.users.listFollowers(username, viewer?.id);
  }

  @Get(':username/following')
  @UseGuards(OptionalJwtAuthGuard)
  following(
    @Param('username') username: string,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.users.listFollowing(username, viewer?.id);
  }

  @Post(':username/follow')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  follow(@Param('username') username: string, @CurrentUser() user: AuthUser) {
    return this.users.follow(user.id, username);
  }

  @Delete(':username/follow')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  unfollow(@Param('username') username: string, @CurrentUser() user: AuthUser) {
    return this.users.unfollow(user.id, username);
  }

  @Post(':username/accept')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  accept(@Param('username') username: string, @CurrentUser() user: AuthUser) {
    return this.users.acceptRequest(user.id, username);
  }
}
````

## apps/api/src/users/users.module.ts

````typescript
import { Module } from '@nestjs/common';
import { SafetyModule } from '../safety/safety.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SafetyModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
````

## apps/api/src/users/users.service.ts

````typescript
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { FollowStatus, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SafetyService } from '../safety/safety.service';
import {
  ChangePasswordDto,
  ChangeUsernameDto,
  UpdateProfileDto,
} from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safety: SafetyService,
  ) {}

  /** Update editable profile fields. */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        isPrivate: dto.isPrivate,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        isPrivate: true,
        isVerified: true,
      },
    });
    return user;
  }

  async changeUsername(userId: string, dto: ChangeUsernameDto) {
    const taken = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: { id: true },
    });
    if (taken && taken.id !== userId) {
      throw new ConflictException('That username is already taken');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { username: dto.username },
    });
    return { username: dto.username };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 12) },
    });
    // invalidate existing sessions after a password change
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  /** Public profile + counts + whether the viewer follows them. */
  async getProfile(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        isPrivate: true,
        isVerified: true,
        xp: true,
        streakCount: true,
        createdAt: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    let followState: FollowStatus | 'NONE' = 'NONE';
    if (viewerId && viewerId !== user.id) {
      const edge = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId: viewerId, followingId: user.id },
        },
        select: { status: true },
      });
      followState = edge?.status ?? 'NONE';
    }

    const isOwner = viewerId === user.id;
    const canViewPosts =
      isOwner || !user.isPrivate || followState === FollowStatus.ACCEPTED;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isPrivate: user.isPrivate,
      isVerified: user.isVerified,
      xp: user.xp,
      streakCount: user.streakCount,
      createdAt: user.createdAt,
      counts: {
        posts: user._count.posts,
        followers: user._count.followers,
        following: user._count.following,
      },
      viewer: { isOwner, followState, canViewPosts },
    };
  }

  /** Follow a user. Private accounts get a PENDING request instead. */
  async follow(followerId: string, username: string) {
    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, isPrivate: true },
    });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === followerId) {
      throw new BadRequestException('You cannot follow yourself');
    }
    if (await this.safety.isBlockedBetween(followerId, target.id)) {
      throw new ForbiddenException('Unavailable');
    }

    const status = target.isPrivate
      ? FollowStatus.PENDING
      : FollowStatus.ACCEPTED;

    const edge = await this.prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId: target.id },
      },
      create: { followerId, followingId: target.id, status },
      update: {}, // already following / requested — no-op
      select: { status: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: target.id,
        actorId: followerId,
        type:
          status === FollowStatus.PENDING
            ? NotificationType.FOLLOW_REQUEST
            : NotificationType.FOLLOW,
      },
    });

    return { status: edge.status };
  }

  async unfollow(followerId: string, username: string) {
    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');

    await this.prisma.follow.deleteMany({
      where: { followerId, followingId: target.id },
    });
    return { status: 'NONE' };
  }

  /** Target user accepts a pending follow request. */
  async acceptRequest(ownerId: string, requesterUsername: string) {
    const requester = await this.prisma.user.findUnique({
      where: { username: requesterUsername },
      select: { id: true },
    });
    if (!requester) throw new NotFoundException('User not found');

    const edge = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: requester.id,
          followingId: ownerId,
        },
      },
    });
    if (!edge || edge.status !== FollowStatus.PENDING) {
      throw new BadRequestException('No pending request from that user');
    }

    await this.prisma.follow.update({
      where: {
        followerId_followingId: {
          followerId: requester.id,
          followingId: ownerId,
        },
      },
      data: { status: FollowStatus.ACCEPTED },
    });
    return { status: FollowStatus.ACCEPTED };
  }

  async listFollowers(username: string, viewerId?: string) {
    const user = await this.assertVisible(username, viewerId);
    return this.prisma.follow.findMany({
      where: { followingId: user.id, status: FollowStatus.ACCEPTED },
      orderBy: { createdAt: 'desc' },
      select: { follower: this.cardSelect() },
    });
  }

  async listFollowing(username: string, viewerId?: string) {
    const user = await this.assertVisible(username, viewerId);
    return this.prisma.follow.findMany({
      where: { followerId: user.id, status: FollowStatus.ACCEPTED },
      orderBy: { createdAt: 'desc' },
      select: { following: this.cardSelect() },
    });
  }

  // ---- helpers ----

  private async assertVisible(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, isPrivate: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.isPrivate || user.id === viewerId) return user;

    const edge = viewerId
      ? await this.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerId,
              followingId: user.id,
            },
          },
          select: { status: true },
        })
      : null;
    if (edge?.status !== FollowStatus.ACCEPTED) {
      throw new ForbiddenException('This account is private');
    }
    return user;
  }

  private cardSelect() {
    return {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
      },
    };
  }
}
````

## apps/api/test/llm.spec.ts

````typescript
import 'reflect-metadata';
import assert from 'node:assert';
import { parseAnthropicDelta, parseOpenAiDelta } from '../src/ai-tutor/llm.service';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('parseAnthropicDelta');

test('extracts text from a content_block_delta', () => {
  const line =
    'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Photo"}}';
  assert.strictEqual(parseAnthropicDelta(line), 'Photo');
});

test('ignores non-text events (message_start, ping)', () => {
  assert.strictEqual(
    parseAnthropicDelta('data: {"type":"message_start","message":{}}'),
    '',
  );
  assert.strictEqual(parseAnthropicDelta('event: ping'), '');
});

test('ignores [DONE] and non-data lines', () => {
  assert.strictEqual(parseAnthropicDelta('data: [DONE]'), '');
  assert.strictEqual(parseAnthropicDelta(''), '');
});

console.log('parseOpenAiDelta');

test('extracts content from a choices delta', () => {
  const line =
    'data: {"choices":[{"delta":{"content":"synth"},"index":0}]}';
  assert.strictEqual(parseOpenAiDelta(line), 'synth');
});

test('handles role-only first chunk (no content)', () => {
  assert.strictEqual(
    parseOpenAiDelta('data: {"choices":[{"delta":{"role":"assistant"}}]}'),
    '',
  );
});

test('ignores [DONE] and malformed lines', () => {
  assert.strictEqual(parseOpenAiDelta('data: [DONE]'), '');
  assert.strictEqual(parseOpenAiDelta('data: not-json'), '');
});

console.log(`\nAll ${passed} LLM parser tests passed ✓`);
````

## apps/api/test/moderation.spec.ts

````typescript
import 'reflect-metadata';
import assert from 'node:assert';
import { ModerationStatus } from '@prisma/client';
import { decideAction, parseVerdict } from '../src/moderation/moderation.service';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('parseVerdict');

test('parses a clean JSON object', () => {
  const v = parseVerdict(
    '{"isEducational": true, "confidence": 0.9, "category": "biology", "reason": "Explains osmosis"}',
  );
  assert.strictEqual(v.isEducational, true);
  assert.strictEqual(v.confidence, 0.9);
  assert.strictEqual(v.category, 'biology');
});

test('strips markdown code fences and surrounding prose', () => {
  const v = parseVerdict(
    'Here is the verdict:\n```json\n{"isEducational": false, "confidence": 0.8, "category": "spam", "reason": "Advertisement"}\n```\nDone.',
  );
  assert.strictEqual(v.isEducational, false);
  assert.strictEqual(v.confidence, 0.8);
  assert.strictEqual(v.category, 'spam');
});

test('clamps out-of-range confidence to [0,1]', () => {
  assert.strictEqual(parseVerdict('{"isEducational":true,"confidence":5}').confidence, 1);
  assert.strictEqual(parseVerdict('{"isEducational":true,"confidence":-2}').confidence, 0);
});

test('falls back safely on garbage input', () => {
  const v = parseVerdict('not json at all');
  assert.strictEqual(v.isEducational, false);
  assert.strictEqual(v.confidence, 0);
  assert.strictEqual(v.category, 'unparseable');
});

test('falls back safely on empty input', () => {
  const v = parseVerdict('');
  assert.strictEqual(v.isEducational, false);
});

console.log('decideAction');

test('educational + high confidence => APPROVED', () => {
  assert.strictEqual(
    decideAction({ isEducational: true, confidence: 0.9, category: 'x', reason: 'y' }),
    ModerationStatus.APPROVED,
  );
});

test('non-educational + high confidence => REMOVED', () => {
  assert.strictEqual(
    decideAction({ isEducational: false, confidence: 0.85, category: 'x', reason: 'y' }),
    ModerationStatus.REMOVED,
  );
});

test('non-educational but low confidence => FLAGGED (human review)', () => {
  assert.strictEqual(
    decideAction({ isEducational: false, confidence: 0.6, category: 'x', reason: 'y' }),
    ModerationStatus.FLAGGED,
  );
});

test('educational but low confidence => FLAGGED', () => {
  assert.strictEqual(
    decideAction({ isEducational: true, confidence: 0.3, category: 'x', reason: 'y' }),
    ModerationStatus.FLAGGED,
  );
});

console.log(`\nAll ${passed} moderation tests passed ✓`);
````

## apps/api/test/text.spec.ts

````typescript
import assert from 'node:assert';
import { extractMentions } from '../src/common/text.util';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('extractMentions');

test('pulls multiple mentions, deduped and lowercased', () => {
  const r = extractMentions('thanks @Amina and @brian and @amina again');
  assert.deepStrictEqual(r.sort(), ['amina', 'brian']);
});

test('ignores emails (@ must be at a word boundary) but keeps real mentions', () => {
  const r = extractMentions('mail john@example.com but tag @amina');
  assert.deepStrictEqual(r, ['amina']);
});

test('handles dots and underscores in usernames', () => {
  const r = extractMentions('shoutout @john.doe_99');
  assert.deepStrictEqual(r, ['john.doe_99']);
});

test('drops mentions shorter than 3 chars', () => {
  assert.deepStrictEqual(extractMentions('@ab hi'), []);
});

test('returns empty for no mentions', () => {
  assert.deepStrictEqual(extractMentions('no mentions here'), []);
});

console.log(`\nAll ${passed} mention tests passed ✓`);
````
