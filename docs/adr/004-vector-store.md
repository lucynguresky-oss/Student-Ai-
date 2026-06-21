# ADR-004: Vector Store — pgvector

## Status
Accepted

## Context
Need vector storage for RAG embeddings (AI tutor). Options: pgvector in PostgreSQL, Qdrant, Pinecone, Weaviate.

## Decision
Use **pgvector** with HNSW indexes in PostgreSQL 16.

### Rationale
- Single database stack at MVP scale (no separate vector DB to manage)
- pgvector HNSW provides good recall and performance up to ~5M vectors
- Reduces operational complexity
- Migration path to Qdrant documented if recall drops below 95% or scale exceeds 10M vectors

## Consequences
- Embedding dimension locked at 1536 (Voyage AI voyage-3-large)
- HNSW index parameters: m=16, ef_construction=200
- Must monitor query latency as embedding count grows
- Planned migration trigger: p95 latency > 100ms or recall < 95%
