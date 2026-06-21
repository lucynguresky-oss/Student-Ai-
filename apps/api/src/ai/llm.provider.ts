/**
 * Vendor-agnostic LLM contract.
 * TutorService depends ONLY on this interface — swap OpenAI for any other
 * provider by writing another class that extends LlmProvider and rebinding
 * it in ai.module.ts. Nothing else changes.
 */

export interface LlmMessage {
  role:    'user' | 'assistant';
  content: string;
}

export interface LlmImage {
  base64: string; // raw base64, no data: prefix
  mime:   string; // e.g. 'image/jpeg'
}

export interface StreamChatInput {
  system:      string;
  messages:    LlmMessage[];
  images?:     LlmImage[];    // attached to the LAST user message (photo-of-a-question)
  temperature?: number;
}

export interface EmbedInput {
  text: string;
}

export abstract class LlmProvider {
  /** Streams the assistant reply as token deltas. */
  abstract streamChat(input: StreamChatInput): AsyncIterable<string>;
  /** Returns an embedding vector for RAG retrieval (must match ingestion model). */
  abstract embed(input: EmbedInput): Promise<number[]>;
}
