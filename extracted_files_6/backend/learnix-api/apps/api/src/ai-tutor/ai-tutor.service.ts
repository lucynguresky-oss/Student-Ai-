import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AiRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChatMessage, LlmService } from './llm.service';
import { buildTutorSystemPrompt } from './prompts';

const MAX_HISTORY = 20; // last N messages sent as context

export interface AskInput {
  message: string;
  conversationId?: string;
  subject?: string;
}

@Injectable()
export class AiTutorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  async listConversations(userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        subject: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
  }

  async getMessages(conversationId: string, userId: string) {
    await this.assertOwner(conversationId, userId);
    return this.prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, createdAt: true },
    });
  }

  async deleteConversation(conversationId: string, userId: string) {
    await this.assertOwner(conversationId, userId);
    await this.prisma.aiConversation.delete({ where: { id: conversationId } });
    return { deleted: true };
  }

  /** Non-streaming: returns the full answer. Definitively replaces the stub. */
  async ask(userId: string, input: AskInput) {
    const { conversationId, system, history } = await this.startTurn(
      userId,
      input,
    );
    const answer = await this.llm.complete(system, history);
    const message = await this.finishTurn(conversationId, answer);
    return { conversationId, message };
  }

  /** Streaming: yields meta + token deltas + done; persists at start and end. */
  async *streamTurn(
    userId: string,
    input: AskInput,
  ): AsyncGenerator<
    { type: 'meta'; conversationId: string } | { type: 'delta'; text: string } | { type: 'done' }
  > {
    const { conversationId, system, history } = await this.startTurn(
      userId,
      input,
    );
    yield { type: 'meta', conversationId };

    let acc = '';
    try {
      for await (const delta of this.llm.stream(system, history)) {
        acc += delta;
        yield { type: 'delta', text: delta };
      }
    } finally {
      if (acc.trim()) await this.finishTurn(conversationId, acc);
    }
    yield { type: 'done' };
  }

  // ---- internals ----

  private async startTurn(userId: string, input: AskInput) {
    if (!this.llm.isConfigured()) {
      throw new ServiceUnavailableException(
        `AI tutor is not configured. Set an API key for the '${this.llm.provider}' provider in .env.`,
      );
    }
    let conversationId = input.conversationId;

    if (conversationId) {
      await this.assertOwner(conversationId, userId);
    } else {
      const conv = await this.prisma.aiConversation.create({
        data: {
          userId,
          subject: input.subject,
          title: deriveTitle(input.message),
        },
        select: { id: true },
      });
      conversationId = conv.id;
    }

    // persist the user's message, then load recent history (it's the latest)
    await this.prisma.aiMessage.create({
      data: { conversationId, role: AiRole.USER, content: input.message },
    });
    await this.prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const recent = await this.prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: MAX_HISTORY,
      select: { role: true, content: true },
    });
    const history: ChatMessage[] = recent
      .reverse()
      .map((m) => ({
        role: m.role === AiRole.USER ? 'user' : 'assistant',
        content: m.content,
      }));

    const context = await this.retrieveContext(input.message, input.subject);
    const system = buildTutorSystemPrompt({ subject: input.subject, context });

    return { conversationId, system, history };
  }

  private async finishTurn(conversationId: string, content: string) {
    const message = await this.prisma.aiMessage.create({
      data: { conversationId, role: AiRole.ASSISTANT, content },
      select: { id: true, role: true, content: true, createdAt: true },
    });
    await this.prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return message;
  }

  /**
   * RAG hook. Returns approved-material context to ground the answer, or null.
   *
   * TODO: implement retrieval — embed `query` (Voyage), vector-search an
   * `embeddings` table (pgvector) filtered by subject/curriculum, rerank, and
   * format the top chunks here. The system prompt already has a slot for it.
   */
  private async retrieveContext(
    _query: string,
    _subject?: string,
  ): Promise<string | null> {
    return null;
  }

  private async assertOwner(conversationId: string, userId: string) {
    const conv = await this.prisma.aiConversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.userId !== userId) {
      throw new ForbiddenException('Not your conversation');
    }
  }
}

function deriveTitle(firstMessage: string): string {
  const t = firstMessage.trim().replace(/\s+/g, ' ');
  return t.length > 60 ? `${t.slice(0, 57)}…` : t || 'New chat';
}
