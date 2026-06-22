import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../ai-tutor/llm.service';

@Injectable()
export class FlashcardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  async getUserDecks(userId: string) {
    return this.prisma.flashcardDeck.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { flashcards: true } },
      },
    });
  }

  async getDeck(deckId: string, userId: string) {
    const deck = await this.prisma.flashcardDeck.findUnique({
      where: { id: deckId },
      include: { flashcards: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!deck || deck.userId !== userId) {
      throw new BadRequestException('Deck not found');
    }
    return deck;
  }

  async generateDeck(userId: string, topic: string, subjectId?: string) {
    const systemPrompt = `You are an expert AI tutor. Generate a deck of educational flashcards based on the provided topic.
    Return a raw JSON object with the following structure (no markdown code blocks, just raw JSON):
    {
      "title": "A short, descriptive title for the deck",
      "description": "A brief description of what these flashcards cover",
      "cards": [
        { "front": "Question or concept", "back": "Answer or definition" }
      ]
    }
    Ensure the questions are concise and the answers are clear. Generate between 5 and 10 cards.`;

    const resultStr = await this.llm.complete(systemPrompt, [
      { role: 'user', content: `Topic: ${topic}` }
    ]);

    let parsed: any;
    try {
      // Remove possible markdown wrappers if the AI misbehaves
      const cleanStr = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanStr);
    } catch (e) {
      throw new BadRequestException('Failed to generate flashcards. AI returned invalid format.');
    }

    if (!parsed.cards || !Array.isArray(parsed.cards)) {
      throw new BadRequestException('Invalid flashcard data returned from AI.');
    }

    // Create the deck
    const deck = await this.prisma.flashcardDeck.create({
      data: {
        userId,
        title: parsed.title || topic,
        description: parsed.description || `AI generated flashcards for ${topic}`,
        subjectId,
        flashcards: {
          create: parsed.cards.map((c: any, idx: number) => ({
            front: c.front || 'Unknown',
            back: c.back || 'Unknown',
            orderIndex: idx,
          }))
        }
      },
      include: {
        flashcards: true,
      }
    });

    return deck;
  }
}
