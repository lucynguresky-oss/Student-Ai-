# ADR-005: AI Providers

## Status
Accepted

## Context
Need LLM and embedding providers for the AI tutor (RAG pipeline).

## Decision
- **LLM**: Anthropic Claude (claude-sonnet-4-20250514 default; claude-haiku-4-5 for cheap tasks), OpenAI gpt-4.1-mini as fallback
- **Embeddings**: Voyage AI voyage-3-large (primary), voyage-3-lite for bulk re-indexing
- **Reranking**: Voyage voyage-rerank-2

### Rationale
- Claude: Best quality for educational reasoning, Socratic tutoring
- Haiku: Cost-effective for classification, simple Q&A, routing decisions
- Voyage: Best quality/cost ratio for retrieval embeddings
- Model router pattern: classifier (Haiku) determines complexity → routes to appropriate model

## Consequences
- Multi-provider dependency
- Must implement fallback routing
- Cost monitoring dashboard from day one
- Daily AI cost alerts
