import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly config: ConfigService) {}

  get provider(): string {
    return this.config.get<string>('ai.provider') ?? 'anthropic';
  }

  /** Is a usable API key configured for the selected provider? */
  isConfigured(): boolean {
    return this.provider === 'openai'
      ? !!this.config.get<string>('ai.openaiApiKey')
      : !!this.config.get<string>('ai.anthropicApiKey');
  }

  /** Non-streaming completion — returns the full answer text. */
  async complete(system: string, messages: ChatMessage[]): Promise<string> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        `AI tutor is not configured. Set ${
          this.provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'
        }.`,
      );
    }
    return this.provider === 'openai'
      ? this.openaiComplete(system, messages)
      : this.anthropicComplete(system, messages);
  }

  /** Streaming completion — yields text deltas as they arrive. */
  async *stream(
    system: string,
    messages: ChatMessage[],
  ): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        `AI tutor is not configured. Set ${
          this.provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'
        }.`,
      );
    }
    yield* this.provider === 'openai'
      ? this.openaiStream(system, messages)
      : this.anthropicStream(system, messages);
  }

  // ---------------------------------------------------------------- Anthropic

  private async anthropicComplete(
    system: string,
    messages: ChatMessage[],
  ): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: this.anthropicHeaders(),
      body: JSON.stringify({
        model: this.config.get<string>('ai.anthropicModel'),
        max_tokens: 1024,
        system,
        messages,
      }),
    });
    if (!res.ok) throw await this.httpError('Anthropic', res);
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    return (
      data.content
        ?.filter((b) => b.type === 'text')
        .map((b) => b.text ?? '')
        .join('') ?? ''
    );
  }

  private async *anthropicStream(
    system: string,
    messages: ChatMessage[],
  ): AsyncGenerator<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: this.anthropicHeaders(),
      body: JSON.stringify({
        model: this.config.get<string>('ai.anthropicModel'),
        max_tokens: 1024,
        system,
        messages,
        stream: true,
      }),
    });
    if (!res.ok) throw await this.httpError('Anthropic', res);
    for await (const line of sseLines(res)) {
      const delta = parseAnthropicDelta(line);
      if (delta) yield delta;
    }
  }

  private anthropicHeaders(): Record<string, string> {
    return {
      'content-type': 'application/json',
      'x-api-key': this.config.get<string>('ai.anthropicApiKey') as string,
      'anthropic-version': '2023-06-01',
    };
  }

  // ------------------------------------------------------------------- OpenAI

  private async openaiComplete(
    system: string,
    messages: ChatMessage[],
  ): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: this.openaiHeaders(),
      body: JSON.stringify({
        model: this.config.get<string>('ai.openaiModel'),
        max_tokens: 1024,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    });
    if (!res.ok) throw await this.httpError('OpenAI', res);
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? '';
  }

  private async *openaiStream(
    system: string,
    messages: ChatMessage[],
  ): AsyncGenerator<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: this.openaiHeaders(),
      body: JSON.stringify({
        model: this.config.get<string>('ai.openaiModel'),
        max_tokens: 1024,
        stream: true,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    });
    if (!res.ok) throw await this.httpError('OpenAI', res);
    for await (const line of sseLines(res)) {
      const delta = parseOpenAiDelta(line);
      if (delta) yield delta;
    }
  }

  private openaiHeaders(): Record<string, string> {
    return {
      'content-type': 'application/json',
      authorization: `Bearer ${this.config.get<string>('ai.openaiApiKey')}`,
    };
  }

  // ------------------------------------------------------------------ helpers

  private async httpError(provider: string, res: Response): Promise<Error> {
    const body = await res.text().catch(() => '');
    this.logger.error(`${provider} API ${res.status}: ${body}`);
    return new ServiceUnavailableException(
      `${provider} request failed (${res.status}).`,
    );
  }
}

// ---------------------------------------------------------------------------
// Pure stream helpers (unit-tested in test/llm.spec.ts)
// ---------------------------------------------------------------------------

/** Read an SSE Response body and yield it line by line. */
export async function* sseLines(res: Response): AsyncGenerator<string> {
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (line) yield line;
    }
  }
  const tail = buffer.trim();
  if (tail) yield tail;
}

/** Extract the text delta from one Anthropic SSE line, or '' if none. */
export function parseAnthropicDelta(line: string): string {
  if (!line.startsWith('data:')) return '';
  const payload = line.slice(5).trim();
  if (!payload || payload === '[DONE]') return '';
  try {
    const evt = JSON.parse(payload) as {
      type?: string;
      delta?: { type?: string; text?: string };
    };
    if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
      return evt.delta.text ?? '';
    }
  } catch {
    /* ignore non-JSON keepalive lines */
  }
  return '';
}

/** Extract the text delta from one OpenAI SSE line, or '' if none. */
export function parseOpenAiDelta(line: string): string {
  if (!line.startsWith('data:')) return '';
  const payload = line.slice(5).trim();
  if (!payload || payload === '[DONE]') return '';
  try {
    const evt = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    return evt.choices?.[0]?.delta?.content ?? '';
  } catch {
    return '';
  }
}
