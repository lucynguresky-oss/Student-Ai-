import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  async getConversations(@Query('userId') userId: string) {
    // Note: Use the actual authenticated user ID from JwtAuthGuard when auth is wired up
    return this.messagesService.getConversations(userId);
  }

  @Get(':conversationId')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.messagesService.getMessages(conversationId, limit ? Number(limit) : 50, cursor);
  }

  @Post('dm')
  async startDm(@Body() body: { currentUserId: string; targetUserId: string }) {
    return this.messagesService.getOrCreateDirectConversation(body.currentUserId, body.targetUserId);
  }
}
