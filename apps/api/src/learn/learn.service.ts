import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LearnService {
  constructor(private readonly prisma: PrismaService) {}

  async getSubjects() {
    const subjects = await this.prisma.subject.findMany({
      include: {
        _count: { select: { topics: true, learningPaths: true } },
      },
      orderBy: { nameEn: 'asc' },
    });
    return subjects;
  }

  async getSubjectWithTopics(subjectKey: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { key: subjectKey },
      include: {
        topics: {
          where: { parentId: null },
          include: {
            children: { include: { lessons: { take: 3 } } },
            lessons: { take: 5, orderBy: { createdAt: 'asc' } },
          },
          orderBy: { orderIndex: 'asc' },
        },
        learningPaths: { orderBy: { orderIndex: 'asc' } },
      },
    });
    return subject;
  }

  async getLessons(pathId: string) {
    return this.prisma.lesson.findMany({
      where: { pathId },
      orderBy: { createdAt: 'asc' },
      include: { topic: true },
    });
  }

  async getLessonById(id: string) {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        topic: { include: { subject: true } },
        quizzes: { include: { questions: true } },
      },
    });
  }

  async getUserProgress(userId: string) {
    const [streak, xpTotal, topicMastery, recentAttempts] = await Promise.all([
      this.prisma.streak.findUnique({ where: { userId } }),
      this.prisma.xpEvent.aggregate({ where: { userId }, _sum: { amount: true } }),
      this.prisma.topicMastery.findMany({
        where: { userId },
        include: { topic: { include: { subject: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.prisma.attempt.findMany({
        where: { userId, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 5,
        include: { lesson: { include: { topic: true } } },
      }),
    ]);

    return {
      streak: streak?.currentDays ?? 0,
      longestStreak: streak?.longestDays ?? 0,
      totalXp: xpTotal._sum.amount ?? 0,
      level: this.xpToLevel(xpTotal._sum.amount ?? 0),
      topicMastery,
      recentAttempts,
    };
  }

  async awardXp(userId: string, kind: string, amount: number, metadata?: any) {
    const event = await this.prisma.xpEvent.create({
      data: { userId, kind, amount, metadata },
    });
    // Update streak
    await this.updateStreak(userId);
    return event;
  }

  async getDailyQuests(userId: string) {
    // MVP: static daily quests, future: dynamic per user progress
    return [
      { id: 'q1', title: 'Complete 1 Biology lesson', xpReward: 50, done: false, icon: '🧬' },
      { id: 'q2', title: 'Score 80%+ on a quiz', xpReward: 75, done: false, icon: '🎯' },
      { id: 'q3', title: 'Watch 2 Learnix Clips', xpReward: 30, done: false, icon: '🎬' },
    ];
  }

  private async updateStreak(userId: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const streak = await this.prisma.streak.findUnique({ where: { userId } });

    if (!streak) {
      await this.prisma.streak.create({ data: { userId, currentDays: 1, longestDays: 1, lastQualifiedAt: now, pauseTokens: 1 } });
      return;
    }

    const last = streak.lastQualifiedAt;
    if (!last) {
      await this.prisma.streak.update({ where: { userId }, data: { currentDays: 1, lastQualifiedAt: now } });
      return;
    }

    const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / 86400000);

    if (diffDays === 0) return; // Already counted today
    if (diffDays === 1) {
      const newCurrent = streak.currentDays + 1;
      await this.prisma.streak.update({
        where: { userId },
        data: { currentDays: newCurrent, longestDays: Math.max(newCurrent, streak.longestDays), lastQualifiedAt: now },
      });
    } else {
      // Streak broken (unless they have a pause token)
      if (streak.pauseTokens > 0 && diffDays === 2) {
        await this.prisma.streak.update({ where: { userId }, data: { pauseTokens: streak.pauseTokens - 1, lastQualifiedAt: now } });
      } else {
        await this.prisma.streak.update({ where: { userId }, data: { currentDays: 1, lastQualifiedAt: now } });
      }
    }
  }

  private xpToLevel(xp: number): number {
    // Level formula: Level = floor(sqrt(xp / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }
}
