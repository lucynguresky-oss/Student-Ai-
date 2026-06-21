import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get(':id')
  async getQuiz(@Param('id') id: string) {
    const quiz = await this.quizzesService.getQuiz(id);
    return { data: quiz };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/answer')
  async submitAnswer(
    @CurrentUser() user: any,
    @Param('id') quizId: string,
    @Body() body: { questionId: string; answerOptionId: string },
  ) {
    const result = await this.quizzesService.submitAnswer(
      quizId,
      body.questionId,
      body.answerOptionId,
      user.userId,
    );
    return { data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/attempts')
  async createAttempt(
    @CurrentUser() user: any,
    @Param('id') quizId: string,
  ) {
    const attempt = await this.quizzesService.createAttempt(user.userId, quizId);
    return { data: attempt };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/attempts/:attemptId/complete')
  async completeAttempt(
    @Param('attemptId') attemptId: string,
    @Body('score') score: number,
  ) {
    const attempt = await this.quizzesService.completeAttempt(attemptId, score);
    return { data: attempt };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/history')
  async getQuizHistory(@CurrentUser() user: any) {
    const history = await this.quizzesService.getQuizHistory(user.userId);
    return { data: history };
  }
}
