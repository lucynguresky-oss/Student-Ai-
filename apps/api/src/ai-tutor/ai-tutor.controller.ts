import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { FastifyReply } from 'fastify';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiTutorService } from './ai-tutor.service';

class AskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  subject?: string;
}

@ApiTags('ai-tutor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiTutorController {
  constructor(private readonly tutor: AiTutorService) {}

  @Get('conversations')
  conversations(@CurrentUser() user: AuthUser) {
    return this.tutor.listConversations(user.id);
  }

  @Get('conversations/:id')
  messages(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tutor.getMessages(id, user.id);
  }

  @Delete('conversations/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tutor.deleteConversation(id, user.id);
  }

  /** Non-streaming: returns the full answer in one response. */
  @Post('chat')
  @HttpCode(200)
  ask(@CurrentUser() user: AuthUser, @Body() dto: AskDto) {
    return this.tutor.ask(user.id, dto);
  }

  /** Streaming: Server-Sent Events with meta + token deltas + done. */
  @Post('chat/stream')
  async stream(
    @CurrentUser() user: AuthUser,
    @Body() dto: AskDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
    try {
      for await (const evt of this.tutor.streamTurn(user.id, dto)) {
        reply.raw.write(`data: ${JSON.stringify(evt)}\n\n`);
      }
    } catch (err) {
      reply.raw.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: (err as Error).message,
        })}\n\n`,
      );
    } finally {
      reply.raw.end();
    }
  }
}
