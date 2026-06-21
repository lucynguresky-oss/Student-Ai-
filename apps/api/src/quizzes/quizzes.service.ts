import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async getQuiz(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Strip correctAnswer from questions
    const sanitizedQuestions = quiz.questions.map((q) => {
      const { correctAnswer, ...rest } = q;
      return rest;
    });

    return {
      ...quiz,
      questions: sanitizedQuestions,
    };
  }

  async submitAnswer(
    quizId: string,
    questionId: string,
    answerOptionId: string,
    userId: string,
  ) {
    const question = await this.prisma.question.findFirst({
      where: {
        id: questionId,
        quizId: quizId,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // correctAnswer is stored as Json (e.g. "opt2" or "\"opt2\"")
    // Let's normalize it to string
    const normalizedCorrect = typeof question.correctAnswer === 'string'
      ? question.correctAnswer.replace(/^"|"$/g, '')
      : String(question.correctAnswer);

    const isCorrect = normalizedCorrect === answerOptionId;

    let xpAwarded = 0;
    if (isCorrect) {
      xpAwarded = question.marks || 10;
      
      // Award XP using prisma directly
      await this.prisma.xpEvent.create({
        data: {
          userId,
          kind: 'QUIZ_ANSWER_CORRECT',
          amount: xpAwarded,
          metadata: { quizId, questionId },
        },
      });

      // Update streak
      await this.updateStreak(userId);
    }

    return {
      isCorrect,
      correctOptionId: normalizedCorrect,
      explanation: question.explanation || '',
      xpAwarded,
    };
  }

  async createAttempt(userId: string, quizId: string) {
    return this.prisma.attempt.create({
      data: {
        userId,
        quizId,
        score: 0,
        startedAt: new Date(),
      },
    });
  }

  async completeAttempt(attemptId: string, score: number) {
    return this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        score,
        completedAt: new Date(),
      },
    });
  }

  async getQuizHistory(userId: string) {
    return this.prisma.attempt.findMany({
      where: {
        userId,
        quizId: { not: null },
      },
      include: {
        quiz: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  private async updateStreak(userId: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const streak = await this.prisma.streak.findUnique({ where: { userId } });

    if (!streak) {
      await this.prisma.streak.create({
        data: {
          userId,
          currentDays: 1,
          longestDays: 1,
          lastQualifiedAt: now,
          pauseTokens: 1,
        },
      });
      return;
    }

    const last = streak.lastQualifiedAt;
    if (!last) {
      await this.prisma.streak.update({
        where: { userId },
        data: { currentDays: 1, lastQualifiedAt: now },
      });
      return;
    }

    const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / 86400000);

    if (diffDays === 0) return; // Already counted today
    if (diffDays === 1) {
      const newCurrent = streak.currentDays + 1;
      await this.prisma.streak.update({
        where: { userId },
        data: {
          currentDays: newCurrent,
          longestDays: Math.max(newCurrent, streak.longestDays),
          lastQualifiedAt: now,
        },
      });
    } else {
      if (streak.pauseTokens > 0 && diffDays === 2) {
        await this.prisma.streak.update({
          where: { userId },
          data: { pauseTokens: streak.pauseTokens - 1, lastQualifiedAt: now },
        });
      } else {
        await this.prisma.streak.update({
          where: { userId },
          data: { currentDays: 1, lastQualifiedAt: now },
        });
      }
    }
  }
}
