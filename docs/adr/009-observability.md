# ADR-009: Observability Stack

## Status
Accepted

## Context
Need comprehensive observability from day one: error tracking, distributed tracing, metrics, and logging.

## Decision
- **Sentry** — Error tracking (all apps)
- **OpenTelemetry → Grafana Cloud** — Distributed tracing and metrics
- **Logtail/Better Stack** — Centralized logging
- **PostHog** — Product analytics + learning analytics

### Rationale
- Sentry: Industry standard for error tracking, good SDK coverage
- OTel: Vendor-neutral tracing standard
- Grafana Cloud: Managed, good free tier for MVP
- PostHog: Self-hostable, combines product analytics with feature flags
- Separate learning analytics events in custom table for north-star metrics (DLM/AL)

## Consequences
- Every new flow must add a metric/log/trace (enforced in PR review)
- Request-ID propagation across all services
- Structured logging (Pino) with correlation IDs
