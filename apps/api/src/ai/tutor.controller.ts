import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { TutorService } from './tutor.service';
// import { AuthGuard } from '../auth/auth.guard';
// import { UseGuards } from '@nestjs/common';

/**
 * AI Tutor controller.
 *
 * POST /ai/chat                    — SSE stream: main tutor endpoint
 * GET  /ai/quota                   — remaining daily asks
 * GET  /ai/conversations           — list user's conversations
 * GET  /ai/conversations/:id       — full conversation with messages
 * DELETE /ai/conversations/:id     — delete a conversation
 *
 * Client SSE consumption sketch:
 *   const res = await fetch('/ai/chat', { method:'POST', body: JSON.stringify({message}) });
 *   const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
 *   for (;;) {
 *     const { done, value } = await reader.read(); if (done) break;
 *     buf += dec.decode(value, { stream: true });
 *     for (const line of buf.split('\n\n')) {
 *       if (!line.startsWith('data: ')) continue;
 *       const evt = JSON.parse(line.slice(6));
 *       if (evt.type === 'meta')  renderCitations(evt.citations), showQuota(evt.quota);
 *       if (evt.type === 'delta') appendToBubble(evt.text);
 *       if (evt.type === 'done')  markComplete();
 *       if (evt.type === 'error') showError(evt.message);
 *     }
 *     buf = '';
 *   }
 */
@Controller('ai')
export class TutorController {
  constructor(private readonly tutor: TutorService) {}

  /**
   * Main SSE chat endpoint. Returns a stream — do NOT wrap in a standard JSON response.
   * Each `data:` frame is one of the typed SseEvent objects documented in tutor.service.ts.
   */
  // @UseGuards(AuthGuard)
  @Post('chat')
  async chat(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: {
      message:          string;
      conversationId?:  string;
      subject?:         string;
      liveAssessment?:  boolean;
      images?:          Array<{ base64: string; mime: string }>;
    },
  ) {
    const userId = (req as any).user?.id ?? 'dev-user'; // remove fallback in production
    await this.tutor.streamAnswer(userId, body, res);
  }

  // @UseGuards(AuthGuard)
  @Get('quota')
  async quota(@Req() req: Request) {
    const userId = (req as any).user?.id ?? 'dev-user';
    const data   = await this.tutor.getQuota(userId);
    return { success: true, data };
  }

  // @UseGuards(AuthGuard)
  @Get('conversations')
  async conversations(@Req() req: Request) {
    const userId = (req as any).user?.id ?? 'dev-user';
    const data   = await this.tutor.getConversations(userId);
    return { success: true, data };
  }

  // @UseGuards(AuthGuard)
  @Get('conversations/:id')
  async conversation(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user?.id ?? 'dev-user';
    const data   = await this.tutor.getConversation(userId, id);
    return { success: true, data };
  }

  // @UseGuards(AuthGuard)
  @Delete('conversations/:id')
  async deleteConversation(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user?.id ?? 'dev-user';
    const data   = await this.tutor.deleteConversation(userId, id);
    return { success: true, data };
  }
}
