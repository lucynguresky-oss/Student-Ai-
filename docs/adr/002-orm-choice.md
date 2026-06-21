# ADR-002: ORM Choice — Prisma

## Status
Accepted

## Context
Need a database access layer that provides type safety, migrations, and good DX for PostgreSQL with extensions (pgvector, pg_trgm).

## Decision
Use **Prisma 5** as the primary ORM, with raw SQL for performance-critical hot paths.

### Rationale
- Type-safe generated client from schema
- Declarative schema with migration support (up/down)
- Growing pgvector support
- Excellent developer experience with Prisma Studio
- Alternatives: Drizzle (less mature migration story), TypeORM (historically buggy), Knex (no type generation)

## Consequences
- All DB access goes through Prisma client unless benchmarks show performance issues
- Raw SQL used only for: vector similarity searches, complex aggregations, bulk operations
- Schema changes managed via `prisma migrate`
