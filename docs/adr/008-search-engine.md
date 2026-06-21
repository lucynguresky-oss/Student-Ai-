# ADR-008: Search Engine — Meilisearch

## Status
Accepted

## Context
Need fast, typo-tolerant search for posts, books, past papers, lessons, and users.

## Decision
Use **Meilisearch** for MVP. Plan migration path to OpenSearch if needed at scale.

### Rationale
- Cheap to run (single binary, low resource usage)
- Fast: sub-50ms search results
- Built-in typo tolerance (critical for African names and terms)
- Simple API, easy to operate
- Migration path: OpenSearch for >10M documents or complex aggregations

## Consequences
- Must sync data from Postgres to Meilisearch (via BullMQ workers)
- Separate search indexes per entity type
- Real-time index updates on content changes
