import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Full list of subjects — used by clients to populate filter pickers. */
  async getSubjects() {
    return this.prisma.subject.findMany({
      orderBy: { nameEn: 'asc' },
      select: {
        id: true,
        nameEn: true,
        _count: { select: { posts: true } },
      },
    });
  }

  /** Single subject with basic metadata. */
  async getSubjectStats(subjectId: string) {
    return this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        nameEn: true,
        _count: { select: { posts: true } },
      },
    });
  }
}
