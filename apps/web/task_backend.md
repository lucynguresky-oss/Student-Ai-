# Backend Integration Tasks (NestJS & Prisma)

## Phase 1 — Database & Infrastructure Setup
- [x] Verify Prisma schema configurations
- [x] Initialize PostgreSQL database (via Docker or local instance)
- [x] Run Prisma migrations (`npx prisma migrate dev`)
- [x] Seed database with initial mock users and conversations

## Phase 2 — Real-Time Chat & Communication
- [x] Scaffold NestJS Messages Module
- [x] Create Prisma service for fetching `Conversation` and `Message` models
- [x] Build REST endpoints for conversation history (`GET /api/messages/:conversationId`)
- [x] Build WebSocket Gateway (`@nestjs/websockets`) for real-time messaging
- [x] Implement socket events: `sendMessage`, `newMessage`, `markRead`
- [x] Update frontend `useStore.tsx` to connect to Socket.io and fetch from API

## Phase 3 — User Profile Engine
- [x] Scaffold NestJS Users/Profile Module
- [x] Create endpoints to fetch user profile (`GET /api/profiles/:username`)
- [x] Create endpoint to update profile (`PATCH /api/profiles/me`)
- [x] Implement Follow/Unfollow toggle endpoint (`POST /api/profiles/:id/follow`)
- [x] Update frontend to fetch profile data and trigger follow API

## Phase 4 — Feed & Clips Interactivity
- [x] Scaffold NestJS Posts/Clips Module
- [x] Create endpoints for fetching feed (`GET /api/posts`)
- [x] Implement Like toggle endpoint (`POST /api/posts/:id/like`)
- [x] Implement Save toggle endpoint (`POST /api/posts/:id/save`)
- [x] Implement Comment creation endpoint (`POST /api/posts/:id/comments`)
- [x] Update frontend clips/feed to push interactions to backend

## Phase 5 — Search Engine
- [x] Scaffold NestJS Search Module
- [x] Implement debounced multi-model search endpoint (`GET /api/search?q=...`) using Prisma
- [x] Update frontend search page to fetch live results

## Phase 6 — UI Polish & Dead State Elimination
- [x] Fix messages page senderId comparison (use DB UUID)
- [x] Fix feed page bookmark visual state (📌 vs 🔖)
- [x] Fix feed page unused Image import
- [x] Add functional feed tabs (For You / Following / Subjects)
- [x] Add notifications dropdown on feed page
- [x] Fix BottomNav profile link routing mismatch
- [x] Rebuild Profile page: Edit saves, dynamic avatar, Message button, Suspense wrapper
- [x] Add inline BottomNav to Profile page (outside main layout)
- [x] Profile tabs show different content (Posts/Reels/Tagged)
- [x] Create catch-all settings sub-pages to prevent 404s
- [x] Settings page: Archive overlay, hover effects, dynamic avatar
- [x] Create custom Socket.io adapter for Fastify compatibility
- [x] Update main.ts with WebSocket adapter
- [x] Seed 3 conversations + 15 messages + 6 follow relationships
- [x] Frontend store fetches real conversations from API on mount
- [x] Fix search API response format to match frontend expectations
