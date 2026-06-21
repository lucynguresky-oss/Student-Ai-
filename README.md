# 🎓 Learnix

> A social learning operating system for African and global learners.

Learnix blends an Instagram-style feed, short educational videos, a Duolingo-style gamified learning loop (XP, streaks, badges, levels), a digital library, a past-papers repository, AI tutoring grounded in approved content (RAG), and creator/teacher tooling.

**Initial market:** Kenya secondary and tertiary education (KCSE/CBC + university).

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **Docker Desktop** (for PostgreSQL, Redis, Meilisearch)

### 1. Clone & Install

```bash
git clone https://github.com/learnix/learnix.git
cd learnix
pnpm install
```

### 2. Start Infrastructure

```bash
pnpm docker:up
```

This starts:
- **PostgreSQL 16** (pgvector) — port 5432
- **Redis 7** — port 6379
- **Meilisearch** — port 7700
- **Mailhog** — ports 1025/8025

### 3. Setup Database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 4. Start Development

```bash
pnpm dev
```

This boots all apps concurrently:
- **API** → http://localhost:4000
- **API Docs** → http://localhost:4000/docs
- **Web** → http://localhost:3000
- **Admin** → http://localhost:3001
- **Mobile** → Expo DevTools

---

## 📁 Repository Structure

```
learnix/
├─ apps/
│  ├─ api/         # NestJS backend (Fastify)
│  ├─ web/         # Next.js consumer web (PWA)
│  ├─ admin/       # Next.js admin dashboard
│  └─ mobile/      # React Native + Expo
├─ packages/
│  ├─ types/       # Shared TS types & Zod schemas
│  ├─ sdk/         # Auto-generated API client
│  ├─ analytics/   # PostHog wrapper
│  ├─ feature-flags/ # Feature flag wrapper
│  └─ rag/         # RAG pipeline
├─ services/       # Background workers (future)
├─ infra/
│  └─ docker/      # Docker Compose for local dev
├─ docs/
│  └─ adr/         # Architecture Decision Records
└─ scripts/        # Utilities & ops scripts
```

---

## 🎨 Design System

| Token | Value |
|---|---|
| Brand Gradient | `#18D6C8 → #3B82F6 → #7C3AED` |
| Primary Font | Plus Jakarta Sans |
| Body Font | Inter |
| Dark BG | `#0B1020` |
| Card Dark | `#111827` |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS 10 + Fastify + Prisma |
| Web | Next.js 15 + React 19 |
| Mobile | React Native + Expo |
| Database | PostgreSQL 16 + pgvector |
| Cache | Redis 7 |
| Search | Meilisearch |
| AI | Claude (Anthropic) + Voyage embeddings |

---

## 📜 License

Proprietary — All rights reserved.
