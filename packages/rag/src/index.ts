/**
 * @learnix/rag — RAG Pipeline
 *
 * This package will contain the full RAG pipeline:
 * - Ingestion (PDF/EPUB → chunks → embeddings)
 * - Retrieval (hybrid BM25 + vector → rerank)
 * - Generation (Claude with grounded citations)
 *
 * Implementation in Epic I.
 */

export const RAG_CONFIG = {
  chunkSize: 600,
  chunkOverlap: 100,
  vectorTopK: 20,
  bm25TopK: 20,
  rerankTopK: 6,
  confidenceThreshold: 0.6,
  embeddingModel: 'voyage-3-large',
  rerankModel: 'voyage-rerank-2',
  llmDefault: 'claude-sonnet-4-20250514',
  llmCheap: 'claude-haiku-4-5-20250514',
};

export type AiMode =
  | 'explain'
  | 'quiz_me'
  | 'past_paper'
  | 'book_companion'
  | 'study_planner'
  | 'writing_helper'
  | 'exam_coach';

export interface RetrievedChunk {
  id: string;
  text: string;
  sourceType: string;
  sourceId: string;
  title: string;
  page?: number;
  score: number;
}
