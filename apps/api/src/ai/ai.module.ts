import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { LlmProvider } from './llm.provider';
import { OpenAiProvider } from './openai.provider';
import { RagService } from './rag.service';
import { QuotaService } from './quota.service';
import { TutorService } from './tutor.service';
import { TutorController } from './tutor.controller';

/**
 * AI module: binds OpenAiProvider as the LlmProvider implementation.
 * To swap models/providers: change the `useClass` below to your new provider.
 * Everything else stays the same.
 *
 * Register in AppModule:
 *   @Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), AiModule, PaymentsModule] })
 */
@Module({
  imports:     [ConfigModule],
  controllers: [TutorController],
  providers: [
    PrismaService,
    {
      provide:  LlmProvider,
      useClass: OpenAiProvider, // swap here for Gemini / Claude / Mistral etc.
    },
    RagService,
    QuotaService,
    TutorService,
  ],
  exports: [TutorService, QuotaService],
})
export class AiModule {}
