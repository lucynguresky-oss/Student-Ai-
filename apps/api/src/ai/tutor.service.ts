import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { LlmProvider, LlmImage, LlmMessage } from './llm.provider';
import { RagService } from './rag.service';
import { QuotaService } from './quota.service';
import { buildTutorSystemPrompt, LearnerContext, RetrievedChunk } from './tutor.system-prompt';
import type { Response } from 'express';

/** SSE frame types sent to the client */
type SseEvent =
  | { type: 'meta'; conversationId: string; citations: Array<{ sourceLabel: string; sourceId: string }>; quota: { used: number; limit: number } }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; code: string; message: string };

@Injectable()
export class TutorService {
  private readonly log = new Logger(TutorService.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly llm:     LlmProvider,
    private readonly rag:     RagService,
    private readonly quota:   QuotaService,
  ) {}

  /** Primary streaming endpoint. Writes SSE frames directly to the Express Response. */
  async streamAnswer(
    userId: string,
    input: {
      message:         string;
      conversationId?: string;
      subject?:        string;
      liveAssessment?: boolean;
      images?:         LlmImage[];
    },
    res: Response,
  ): Promise<void> {
    // ── SSE headers ────────────────────────────────────────────
    res.setHeader('Content-Type',      'text/event-stream');
    res.setHeader('Cache-Control',     'no-cache');
    res.setHeader('Connection',        'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering

    const send = (evt: SseEvent) => {
      res.write(`data: ${JSON.stringify(evt)}\n\n`);
    };

    try {
      // ── 1. Quota check ─────────────────────────────────────
      const quotaResult = await this.quota.check(userId);
      if (!quotaResult.allowed) {
        send({
          type:    'error',
          code:    'QUOTA_EXCEEDED',
          message: 'You have used all your daily asks. Upgrade or come back tomorrow.',
        });
        res.end();
        return;
      }

      // ── 2. Load or create conversation ─────────────────────
      let conversation: {
        id: string;
        chatMsgs: Array<{ role: string; content: string; createdAt: Date }>;
      };

      if (input.conversationId) {
        const found = await this.prisma.aiConversation.findFirst({
          where:   { id: input.conversationId, userId },
          include: { chatMsgs: { orderBy: { createdAt: 'asc' } } },
        });
        if (!found) throw new NotFoundException('Conversation not found');
        conversation = found as any;
      } else {
        const created = await this.prisma.aiConversation.create({
          data: {
            userId,
            subject: input.subject ?? null,
            mode:    'Tutor',
          },
          include: { chatMsgs: true },
        });
        conversation = created as any;
      }

      // ── 3. Load learner context ─────────────────────────────
      const learnerProfile = await this.prisma.learnerProfile.findUnique({
        where: { userId },
      });
      const user = await this.prisma.user.findUnique({
        where:  { id: userId },
        select: { locale: true },
      });

      // Build learner context — safe defaults while we have no resolved strings yet
      // TODO: resolve countryName/curriculumName/levelName from IDs via TaxonomyService
      const learnerCtx: LearnerContext = {
        countryName:    'your country',
        curriculumName: 'your curriculum',
        levelName:      'your level',
        subjectNames:   learnerProfile?.subjectIds ?? [],
        locale:         user?.locale ?? 'en',
      };

      // ── 4. RAG retrieval ───────────────────────────────────
      const chunks: RetrievedChunk[] = await this.rag.retrieve({
        query:        input.message,
        curriculumId: learnerProfile?.curriculumId ?? undefined,
        levelId:      learnerProfile?.levelId      ?? undefined,
      });

      // ── 5. Build conversation history ──────────────────────
      const history: LlmMessage[] = (conversation.chatMsgs ?? []).map((m) => ({
        role:    m.role as 'user' | 'assistant',
        content: m.content,
      }));
      history.push({ role: 'user', content: input.message });

      // ── 6. System prompt ───────────────────────────────────
      const system = buildTutorSystemPrompt(learnerCtx, {
        subject:        input.subject,
        liveAssessment: input.liveAssessment,
        context:        chunks,
      });

      // ── 7. Record user message ─────────────────────────────
      await this.prisma.aiConversationMessage.create({
        data: {
          conversationId: conversation.id,
          role:           'user',
          content:        input.message,
        },
      });

      // ── 8. Consume quota ───────────────────────────────────
      await this.quota.consume(userId);

      // ── 9. Meta frame ──────────────────────────────────────
      send({
        type:           'meta',
        conversationId: conversation.id,
        citations:      chunks.map((c) => ({ sourceLabel: c.sourceLabel, sourceId: c.sourceId })),
        quota: { used: quotaResult.used + 1, limit: quotaResult.limit },
      });

      // ── 10. Stream assistant reply ─────────────────────────
      let assistantText = '';
      for await (const delta of this.llm.streamChat({
        system,
        messages: history,
        images:   input.images,
      })) {
        assistantText += delta;
        send({ type: 'delta', text: delta });
      }

      // ── 11. Persist assistant message ──────────────────────
      await this.prisma.aiConversationMessage.create({
        data: {
          conversationId: conversation.id,
          role:           'assistant',
          content:        assistantText,
        },
      });

      send({ type: 'done' });
    } catch (err: any) {
      this.log.error(`TutorService error for user ${userId}: ${String(err?.message ?? err)}`);
      send({
        type:    'error',
        code:    'TUTOR_ERROR',
        message: 'Something went wrong. Please try again.',
      });
    } finally {
      res.end();
    }
  }

  async getQuota(userId: string) {
    return this.quota.check(userId);
  }

  async getConversations(userId: string) {
    return this.prisma.aiConversation.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      select:  { id: true, subject: true, createdAt: true },
    });
  }

  async getConversation(userId: string, conversationId: string) {
    const conv = await this.prisma.aiConversation.findFirst({
      where:   { id: conversationId, userId },
      include: { chatMsgs: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conv = await this.prisma.aiConversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    await this.prisma.aiConversation.delete({ where: { id: conversationId } });
    return { ok: true };
  }
}
