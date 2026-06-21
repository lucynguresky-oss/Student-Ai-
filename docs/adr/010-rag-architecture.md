# ADR-010: RAG Architecture

## Status
Accepted

## Context
The AI tutor must provide grounded, cited, curriculum-aware responses using Learnix content (books, papers, lessons, notes).

## Decision
Custom RAG pipeline in `packages/rag` with:
1. **Ingestion**: PDF/EPUB/DOCX → extract → clean → chunk (600 tokens, 100 overlap) → embed (Voyage) → store (pgvector)
2. **Retrieval**: Hybrid BM25 + vector → reciprocal rank fusion → rerank (Voyage rerank-2) → top-6 chunks
3. **Generation**: Claude with system prompt enforcing citations, Socratic method, and safety guardrails

### Key Design Decisions
- **Semantic chunking**: Heading/paragraph-aware splitter, never splits mid-equation or mid-code
- **License metadata per chunk**: Every chunk carries licensing info to prevent copyright violations
- **Model routing**: Haiku classifier determines complexity → routes to Haiku (simple) or Sonnet (complex)
- **Confidence threshold**: 0.6 minimum; below this, model says "I don't have that in Learnix's library"
- **Copyright shield**: Never reproduces ≥15 consecutive words from copyrighted sources

### Alternatives Considered
- LangChain (too abstracted, hard to optimize)
- LlamaIndex (Python-first, doesn't fit our TS stack)
- Custom from scratch (chosen: maximum control over quality and cost)

## Consequences
- Must maintain chunking quality as content library grows
- Weekly quality review of bottom-decile AI responses
- A/B testing of system prompts via PostHog
- Embedding cache to avoid redundant API calls
