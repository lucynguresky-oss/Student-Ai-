import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(
    @Body() body: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      mode: string;
    },
  ) {
    const result = await this.aiService.chat(body.messages, body.mode || 'explain');
    return { data: result };
  }

  // Authenticated route — tracks usage, logs to DB
  @UseGuards(JwtAuthGuard)
  @Post('chat/authenticated')
  async chatAuthenticated(
    @CurrentUser() user: any,
    @Body() body: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      mode: string;
    },
  ) {
    const result = await this.aiService.chat(body.messages, body.mode || 'explain');
    // TODO: Log conversation to AiConversation table, check daily limits
    return { data: result };
  }
}
