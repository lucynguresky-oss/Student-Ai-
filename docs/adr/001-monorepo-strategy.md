# ADR-001: Monorepo Strategy

## Status
Accepted

## Context
Learnix consists of multiple applications (API, web, admin, mobile) and shared packages. We need a strategy that enables code sharing, consistent tooling, and fast build times.

## Decision
Use **Turborepo + pnpm workspaces** as the monorepo tooling.

### Rationale
- **Turborepo**: Provides incremental builds, task caching, and parallel execution. Mature TypeScript support.
- **pnpm**: Fast package manager with strict dependency isolation via symlinks. Prevents phantom dependencies.
- Alternatives considered: Nx (heavier, more opinionated), Lerna (deprecated in favor of Nx/Turborepo), Yarn workspaces (less strict isolation).

## Consequences
- All apps and packages live in a single repository
- Shared TypeScript configs, ESLint, and Prettier
- CI pipelines benefit from Turborepo remote caching
- All developers work with the full codebase

## References
- Turborepo docs: https://turbo.build/repo/docs
- pnpm workspaces: https://pnpm.io/workspaces
