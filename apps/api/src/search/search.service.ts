import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchAll(query: string) {
    if (!query || query.trim() === '') {
      return { subjects: [], topics: [], users: [] };
    }

    const trimmed = query.trim();

    const [subjects, topics, users] = await Promise.all([
      this.prisma.subject.findMany({
        where: {
          OR: [
            { nameEn: { contains: trimmed, mode: 'insensitive' } },
            { nameSw: { contains: trimmed, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      this.prisma.topic.findMany({
        where: {
          OR: [
            { nameEn: { contains: trimmed, mode: 'insensitive' } },
            { nameSw: { contains: trimmed, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      this.prisma.profile.findMany({
        where: {
          OR: [
            { displayName: { contains: trimmed, mode: 'insensitive' } },
            { username: { contains: trimmed, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
    ]);

    return { subjects, topics, users };
  }
}
