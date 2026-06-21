import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { LlmProvider, StreamChatInput, EmbedInput } from './llm.provider';

/**
 * OpenAI (ChatGPT) implementation of LlmProvider.
 *
 * IMPORTANT: model names change over time. Do NOT hardcode them — they come
 * from env (AI_MODEL, AI_EMBED_MODEL). Confirm current model strings in the
 * OpenAI docs before deploying. A stale model name is a runtime error.
 *
 * To use a different provider later (Gemini, Claude, Mistral…):
 *   1. Write a new class that extends LlmProvider.
 *   2. Rebind it in ai.module.ts as { provide: LlmProvider, useClass: <new> }.
 *   3. Nothing in TutorService changes.
 *
 * Required env vars:
 *   OPENAI_API_KEY=sk-...
 *   AI_MODEL=gpt-4o              (or whatever is current)
 *   AI_EMBED_MODEL=text-embedding-3-small
 */
@Injectable()
export class OpenAiProvider extends LlmProvider {
  private readonly log = new Logger(OpenAiProvider.name);
  private readonly client:     OpenAI;
  private readonly chatModel:  string;
  private readonly embedModel: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.client = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
    this.chatModel  = this.config.getOrThrow<string>('AI_MODEL');
    this.embedModel = this.config.getOrThrow<string>('AI_EMBED_MODEL');
  }

  async *streamChat(input: StreamChatInput): AsyncIterable<string> {
    const last    = input.messages[input.messages.length - 1];
    const history = input.messages.slice(0, -1).map((m) => ({
      role:    m.role,
      content: m.content,
    }));

    // Multimodal: if images are provided, attach them to the last user turn.
    const lastUserContent =
      input.images && input.images.length
        ? [
            { type: 'text' as const, text: last?.content ?? '' },
            ...input.images.map((img) => ({
              type:      'image_url' as const,
              image_url: { url: `data:${img.mime};base64,${img.base64}` },
            })),
          ]
        : (last?.content ?? '');

    const stream = await this.client.chat.completions.create({
      model:       this.chatModel,
      stream:      true,
      temperature: input.temperature ?? 0.3,
      messages: [
        { role: 'system',  content: input.system },
        ...history,
        { role: 'user', content: lastUserContent as any },
      ],
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  async embed(input: EmbedInput): Promise<number[]> {
    const res = await this.client.embeddings.create({
      model: this.embedModel,
      input: input.text,
    });
    return (res.data[0]?.embedding ?? []) as number[];
  }
}
