import { Module } from '@nestjs/common';
import { AiTutorController } from './ai-tutor.controller';
import { AiTutorService } from './ai-tutor.service';
import { LlmService } from './llm.service';

@Module({
  controllers: [AiTutorController],
  providers: [AiTutorService, LlmService],
  exports: [AiTutorService, LlmService],
})
export class AiTutorModule {}
