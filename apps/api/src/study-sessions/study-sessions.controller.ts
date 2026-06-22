import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { StudySessionsService } from './study-sessions.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('analytics/study-time')
export class StudySessionsController {
  constructor(private readonly studySessionsService: StudySessionsService) {}

  @Get()
  getAnalytics(@CurrentUser('userId') userId: string) {
    return this.studySessionsService.getAnalytics(userId);
  }

  @Post()
  createSession(
    @CurrentUser('userId') userId: string,
    @Body() data: { durationSec: number, focusRating?: number, notes?: string, subjectId?: string }
  ) {
    return this.studySessionsService.createSession(userId, data);
  }
}
