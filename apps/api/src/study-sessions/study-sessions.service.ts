import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudySessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(userId: string) {
    const sessions = await this.prisma.studySession.findMany({
      where: { userId },
      orderBy: { startedAt: 'asc' },
    });

    const totalSeconds = sessions.reduce((acc, curr) => acc + curr.durationSec, 0);
    const averageRating = sessions.length > 0
      ? sessions.reduce((acc, curr) => acc + (curr.focusRating || 0), 0) / sessions.filter(s => s.focusRating).length
      : 0;

    return {
      totalSeconds,
      averageRating: isNaN(averageRating) ? 0 : averageRating,
      sessions,
    };
  }

  async createSession(userId: string, data: { durationSec: number, focusRating?: number, notes?: string, subjectId?: string }) {
    return this.prisma.studySession.create({
      data: {
        userId,
        durationSec: data.durationSec,
        focusRating: data.focusRating,
        notes: data.notes,
        subjectId: data.subjectId,
        startedAt: new Date(Date.now() - data.durationSec * 1000), // Approximate start time
      }
    });
  }
}
