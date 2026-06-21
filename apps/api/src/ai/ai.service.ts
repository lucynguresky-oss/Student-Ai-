import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

// Learnix AI — Tutor system prompt
const SYSTEM_PROMPT = `You are Learnix AI, an expert academic tutor for African students preparing for KCSE (Kenya Certificate of Secondary Education) and similar curricula across East and West Africa.

Your role is to:
1. Explain concepts clearly and step-by-step using the Socratic method
2. Relate all explanations to the KCSE/CBC syllabus and past paper patterns
3. Cite relevant textbook chapters and past paper questions when applicable
4. Be encouraging, patient, and culturally aware of the East African context
5. Use **bold** for key terms. Use numbered lists for steps. Keep responses concise but complete.
6. When you reference a source, format it EXACTLY at the end: [SOURCE: Book Title, Chapter X] or [PAPER: KCSE Year Paper Number]

Subjects: Biology, Chemistry, Physics, Mathematics, English, History, Geography, CRE/IRE, Computer Studies.

Always end with a follow-up question to check the student's understanding.`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: OpenAI;
  private model: string = 'gpt-4o-mini';
  private provider: string = 'fallback';

  constructor(private readonly config: ConfigService) {
    // Priority: Groq (free) > OpenAI (paid) > fallback
    const groqKey = this.config.get<string>('GROQ_API_KEY');
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');

    if (groqKey && groqKey !== 'your-groq-api-key-here') {
      this.client = new OpenAI({
        apiKey: groqKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      this.model = 'llama3-70b-8192'; // Free, GPT-4 quality
      this.provider = 'Groq (Llama 3 70B)';
      this.logger.log('✅ AI powered by Groq — Llama 3 70B (Free tier)');
    } else if (openaiKey && !openaiKey.startsWith('sk-your')) {
      this.client = new OpenAI({ apiKey: openaiKey });
      this.model = 'gpt-4o-mini';
      this.provider = 'OpenAI (GPT-4o-mini)';
      this.logger.log('✅ AI powered by OpenAI GPT-4o-mini');
    } else {
      this.client = null as any;
      this.provider = 'fallback';
      this.logger.warn('⚠️  No AI API key found — using fallback responses. Add GROQ_API_KEY or OPENAI_API_KEY to .env.local');
    }
  }

  async chat(messages: Array<{ role: 'user' | 'assistant'; content: string }>, mode: string) {
    if (!this.client) {
      return this.buildFallback(mode);
    }

    const systemContent = this.buildSystemPrompt(mode);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemContent },
          ...messages,
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const raw = response.choices[0]?.message?.content ?? '';
      const sources = this.extractSources(raw);
      const content = this.cleanContent(raw);

      return { content, sources, model: this.provider };
    } catch (error: any) {
      this.logger.error(`AI API error [${this.provider}]: ${error?.message}`);
      return this.buildFallback(mode);
    }
  }

  private buildSystemPrompt(mode: string): string {
    const extras: Record<string, string> = {
      explain: 'Focus on clear step-by-step explanations. Break complex topics into digestible parts. Use simple analogies relevant to everyday Kenyan life.',
      quiz: 'Generate an MCQ quiz question with options A–D about the topic the student mentions. Give the correct answer and explain WHY after the student responds.',
      paper: 'Help the student work through past paper questions. GUIDE them through the method — do NOT just give the answer. Ask them what approach they would take first.',
      planner: 'Create a structured KCSE revision schedule. First ask their exam date and which subjects they feel weakest in.',
    };
    return `${SYSTEM_PROMPT}\n\nCurrent mode: ${mode.toUpperCase()}\n${extras[mode] || ''}`;
  }

  private extractSources(content: string): Array<{ label: string; type: 'book' | 'paper' }> {
    const sources: Array<{ label: string; type: 'book' | 'paper' }> = [];
    for (const m of content.matchAll(/\[SOURCE:\s*([^\]]+)\]/g)) {
      sources.push({ label: m[1]!.trim(), type: 'book' });
    }
    for (const m of content.matchAll(/\[PAPER:\s*([^\]]+)\]/g)) {
      sources.push({ label: m[1]!.trim(), type: 'paper' });
    }
    return sources;
  }

  private cleanContent(content: string): string {
    return content.replace(/\[SOURCE:[^\]]+\]/g, '').replace(/\[PAPER:[^\]]+\]/g, '').trim();
  }

  private buildFallback(mode: string) {
    const responses: Record<string, string> = {
      explain: `Great question! Let me break this down for you step by step.\n\n**Key Concept:**\nThis is one of the most commonly tested topics in KCSE. Let me explain it using the Socratic method — I'll guide you through the reasoning.\n\n**Step 1:** Start with what you already know...\n\nCan you tell me what you already understand about this topic? This will help me tailor my explanation to your level. 🎓`,
      quiz: `🎯 Let's test your knowledge!\n\n**Question:** Which of the following best describes **mitosis**?\n\nA) Division producing 4 genetically unique cells\nB) Division producing 2 genetically identical cells\nC) Division only in sex cells\nD) Division that halves the chromosome number\n\nWhich option do you think is correct and why?`,
      paper: `📄 Past Paper Practice Mode\n\nI'll help you work through KCSE questions step by step.\n\n**KCSE 2023 Biology Q3b:** "Explain the significance of the cell membrane in maintaining cell homeostasis." [6 marks]\n\nBefore I guide you — what do you already know about the cell membrane's functions?`,
      planner: `📅 Let's build your revision plan!\n\nTo create the perfect KCSE study schedule for you, I need to know:\n\n1. **When is your exam?** (month/year)\n2. **Which subjects feel hardest?**\n3. **How many hours can you study per day?**\n\nAnswer these and I'll build a full week-by-week plan! 💪`,
    };
    return {
      content: responses[mode] || responses.explain,
      sources: [
        { label: 'Biology Form 4 Textbook (Ch. 3)', type: 'book' as const },
        { label: 'KCSE 2023 Paper 1', type: 'paper' as const },
      ],
      model: 'Learnix AI (Add GROQ_API_KEY to enable real AI)',
    };
  }
}
