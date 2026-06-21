import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { LlmProvider } from './llm.provider';
import { RetrievedChunk } from './tutor.system-prompt';

/**
 * Retrieval-Augmented Generation over LICENSED/OWNED content only.
 *
 * Honesty rule:
 *   If nothing relevant is retrieved, returns []. The tutor then shows NO citation
 *   chips and explicitly states it is answering from general knowledge. We NEVER
 *   staple a fixed "KCSE 2023 Paper 1" onto answers.
 *
 * Licensing rule:
 *   Only ingest public-domain, OER/Creative-Commons, Learnix-owned, or explicitly
 *   licensed content. KCSE/KNEC past papers are copyrighted — do NOT ingest without
 *   a written licence. The filter `access = 'allowed'` enforces this at query time.
 *
 * Schema requirements (add to schema.prisma + run a raw SQL migration):
 *   CREATE EXTENSION IF NOT EXISTS vector;
 *   -- In your Embedding table:
 *   --   embedding vector(1536)   -- match to AI_EMBED_MODEL dimension
 *   --   access    text default 'allowed'
 *   --   curriculum_id uuid nullable
 *   --   level_id      uuid nullable
 *   --   source_label  text
 *   --   source_id     text
 *   --   text          text
 */
@Injectable()
export class RagService {
  private readonly log = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm:    LlmProvider,
  ) {}

  async retrieve(params: {
    query:        string;
    curriculumId?: string;
    levelId?:      string;
    subjectIds?:   string[];
    topK?:         number;
  }): Promise<RetrievedChunk[]> {
    const topK = params.topK ?? 5;

    // 1) Embed the query with the SAME model used during ingestion.
    const vector     = await this.llm.embed({ text: params.query });
    const vecLiteral = `[${vector.join(',')}]`;

    // 2) Cosine-distance search in pgvector, scoped to curriculum/level and licensed only.
    try {
      const rows = await this.prisma.$queryRawUnsafe<
        Array<{
          id:           string;
          text:         string;
          source_label: string;
          source_id:    string;
          distance:     number;
        }>
      >(
        `
        SELECT e.id,
               e.text,
               e.source_label,
               e.source_id,
               (e.embedding <=> $1::vector) AS distance
        FROM "Embedding" e
        WHERE e.access = 'allowed'
          AND ($2::text IS NULL OR e.curriculum_id = $2)
          AND ($3::text IS NULL OR e.level_id = $3)
        ORDER BY e.embedding <=> $1::vector
        LIMIT $4
        `,
        vecLiteral,
        params.curriculumId ?? null,
        params.levelId      ?? null,
        topK,
      );

      // 3) Relevance gate: drop weak matches so we don't cite irrelevant chunks.
      const MAX_DISTANCE = 0.45; // tune empirically; 0 = identical, 1 = orthogonal
      return rows
        .filter((r) => r.distance <= MAX_DISTANCE)
        .map((r) => ({
          text:        r.text,
          sourceLabel: r.source_label,
          sourceId:    r.source_id,
        }));
    } catch (err) {
      // pgvector not installed or Embedding table absent — degrade gracefully.
      this.log.warn(`RAG retrieval failed (pgvector absent?): ${String(err)}`);
      return [];
    }
  }
}
