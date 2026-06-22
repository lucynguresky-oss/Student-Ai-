import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('leaderboard')
  getLeaderboard(@Query('limit') limit?: string) {
    return this.gamificationService.getLeaderboard(limit ? parseInt(limit, 10) : 10);
  }

  @UseGuards(JwtAuthGuard)
  @Post('xp')
  addXp(
    @CurrentUser('userId') userId: string,
    @Body() data: { amount: number; reason: string }
  ) {
    return this.gamificationService.addXp(userId, data.amount, data.reason);
  }
}
