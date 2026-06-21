import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { LearnService } from './learn.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('learn')
export class LearnController {
  constructor(private readonly learnService: LearnService) {}

  @Get('subjects')
  async getSubjects() {
    const subjects = await this.learnService.getSubjects();
    return { data: subjects };
  }

  @Get('subjects/:key')
  async getSubject(@Param('key') key: string) {
    const subject = await this.learnService.getSubjectWithTopics(key);
    return { data: subject };
  }

  @Get('paths/:pathId/lessons')
  async getLessons(@Param('pathId') pathId: string) {
    const lessons = await this.learnService.getLessons(pathId);
    return { data: lessons };
  }

  @Get('lessons/:id')
  async getLesson(@Param('id') id: string) {
    const lesson = await this.learnService.getLessonById(id);
    return { data: lesson };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/progress')
  async getProgress(@CurrentUser() user: any) {
    const progress = await this.learnService.getUserProgress(user.userId);
    return { data: progress };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/quests')
  async getDailyQuests(@CurrentUser() user: any) {
    const quests = await this.learnService.getDailyQuests(user.userId);
    return { data: quests };
  }

  @UseGuards(JwtAuthGuard)
  @Post('xp')
  async awardXp(
    @CurrentUser() user: any,
    @Body() body: { kind: string; amount: number; metadata?: any },
  ) {
    const event = await this.learnService.awardXp(user.userId, body.kind, body.amount, body.metadata);
    return { data: event };
  }
}
