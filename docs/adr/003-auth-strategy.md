# ADR-003: Auth Strategy — Custom JWT

## Status
Accepted

## Context
Need authentication that supports email/phone OTP, social OAuth, and works across web, mobile, and admin apps.

## Decision
**Custom NestJS-managed JWT** with access tokens (15min) and refresh tokens (30d, rotated, family-tracked).

### Details
- Access token: JWT signed with Ed25519, 15-minute expiry, contains userId, roles, and ageBand
- Refresh token: opaque, hashed in DB, 30-day expiry, family-tracked for reuse detection
- OAuth: Google OAuth + Apple Sign-In (mobile)
- OTP: Email + Phone verification
- Password: Argon2id (19 MiB, 2 iterations, 1 thread)
- Optional 2FA via TOTP
- Account lockout after 5 failed attempts (exponential backoff)

### Rationale
- Full control over token lifecycle (no vendor lock-in from Auth0/Clerk)
- Family-based rotation detects token theft
- Ed25519 is fast and secure
- Alternatives: Auth0 (expensive at scale), Clerk (dependency risk), Supabase Auth (couples to Supabase)

## Consequences
- Must implement token rotation, revocation, and device management ourselves
- Must handle security updates promptly
- Full audit trail capability
