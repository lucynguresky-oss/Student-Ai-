# AI Tutor — remove the fake one, connect the real one

Your screenshots show the tutor returning the **same hardcoded reply** to every
message ("Great question! Let me break this down… Key Concept: This is one of the
most commonly tested topics in KCSE…"). That text is a placeholder stub in your
frontend — it never calls a model. Here's how to replace it.

## 1. Find and delete the fake AI

In your web app, search the codebase for the canned string:

```
Great question! Let me break this down
```

You'll find a function (something like `getAiResponse`, `mockTutor`,
`fakeReply`, or a hardcoded array of responses) that returns this text. **Delete
that function** and remove the place that calls it. That's the fake AI.

## 2. Point the chat at the real backend

The backend now exposes a real, model-backed tutor (Claude or OpenAI, selected by
`AI_PROVIDER` in `.env`). Two endpoints:

- `POST /api/ai/chat` — non-streaming, returns the full answer (simplest)
- `POST /api/ai/chat/stream` — Server-Sent Events, streams tokens (the nice typing effect)

Both take `{ message, conversationId?, subject? }` and require the user's bearer
token. Pass back the `conversationId` you receive so the conversation has memory.

### Option A — simplest (non-streaming)

```ts
async function askTutor(token: string, message: string, conversationId?: string, subject?: string) {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ message, conversationId, subject }),
  });
  if (!res.ok) throw new Error((await res.json()).message ?? 'Tutor error');
  return res.json(); // { conversationId, message: { id, role, content, createdAt } }
}
```

### Option B — streaming (recommended for the chat feel)

A small SSE reader, plus a React hook your chat component can use:

```tsx
import { useRef, useState } from 'react';

// reads the SSE body and yields {type:'meta'|'delta'|'done'|'error', ...}
async function* readSSE(res: Response) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let i;
    while ((i = buffer.indexOf('\n\n')) >= 0) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 2);
      if (line.startsWith('data:')) {
        try { yield JSON.parse(line.slice(5).trim()); } catch {}
      }
    }
  }
}

type Msg = { role: 'USER' | 'ASSISTANT'; content: string };

export function useAiTutor(token: string) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const conversationId = useRef<string | null>(null);

  async function send(text: string, subject?: string) {
    // optimistic: add the user message + an empty assistant message to fill in
    setMessages((m) => [...m, { role: 'USER', content: text }, { role: 'ASSISTANT', content: '' }]);
    setStreaming(true);
    try {
      const res = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, conversationId: conversationId.current, subject }),
      });
      for await (const evt of readSSE(res)) {
        if (evt.type === 'meta') conversationId.current = evt.conversationId;
        else if (evt.type === 'delta') {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: 'ASSISTANT', content: copy[copy.length - 1].content + evt.text };
            return copy;
          });
        } else if (evt.type === 'error') {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: 'ASSISTANT', content: `⚠️ ${evt.message}` };
            return copy;
          });
        }
      }
    } finally {
      setStreaming(false);
    }
  }

  function reset() {
    conversationId.current = null;
    setMessages([]);
  }

  return { messages, streaming, send, reset };
}
```

Wire your existing chat input's submit handler to `send(inputValue, currentSubject)`
and render `messages`. Delete the old mock call.

## 3. Turn the model on

In `apps/api/.env`:

```
AI_PROVIDER="anthropic"            # or "openai"
ANTHROPIC_API_KEY="sk-ant-..."     # if using Claude
# or
# AI_PROVIDER="openai"
# OPENAI_API_KEY="sk-..."
```

Restart the API. Now "Explain photosynthesis", "hy", and "ihi" all get **different,
real** answers, because the actual message is sent to the model.

## 4. (Later) Source grounding / RAG

The source chips in your UI ("Biology Form 4 Textbook", "KCSE 2023 Paper 1") are
where retrieved materials go. The system prompt already has a context slot, and
`AiTutorService.retrieveContext()` is the single stub to implement: embed the
question (Voyage), vector-search a `pgvector` table of approved chunks filtered by
subject, and return the top passages. Until then the tutor answers from the model's
own knowledge.
