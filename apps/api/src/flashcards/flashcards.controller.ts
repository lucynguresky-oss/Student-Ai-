import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Get()
  getUserDecks(@CurrentUser('userId') userId: string) {
    return this.flashcardsService.getUserDecks(userId);
  }

  @Get(':id')
  getDeck(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.flashcardsService.getDeck(id, userId);
  }

  @Post('generate')
  generateDeck(
    @CurrentUser('userId') userId: string,
    @Body('topic') topic: string,
    @Body('subjectId') subjectId?: string,
  ) {
    return this.flashcardsService.generateDeck(userId, topic, subjectId);
  }
}
