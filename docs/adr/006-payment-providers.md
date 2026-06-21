# ADR-006: Payment Providers

## Status
Accepted

## Context
Kenya-first product needing mobile money (M-PESA), international cards, and broader Africa coverage.

## Decision
- **M-PESA Daraja** (STK Push) — Kenya primary
- **Stripe** — International cards
- **Flutterwave** — Multi-Africa fallback

### Rationale
- M-PESA is the dominant payment method in Kenya (97%+ mobile money penetration)
- Stripe for international cards and enterprise billing
- Flutterwave covers broader African markets (Nigeria, Ghana, etc.)

## Consequences
- Must handle three webhook formats
- Idempotent payment processing required
- Currency handling (KES primary, USD, EUR secondary)
- PCI scope minimized: never touch raw card data
