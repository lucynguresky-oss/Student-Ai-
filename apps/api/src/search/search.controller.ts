import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') query: string) {
    const results = await this.searchService.searchAll(query);
    // Map to frontend-expected format
    return {
      subjects: results.subjects.map((s: any) => ({
        id: s.id,
        key: s.key,
        name: s.nameEn,
        emoji: s.key === 'BIO' ? '🧬' : s.key === 'CHE' ? '🧪' : s.key === 'PHY' ? '⚛️' : s.key === 'MAT' ? '📐' : '📝',
      })),
      topics: results.topics.map((t: any) => ({
        id: t.id,
        name: t.nameEn,
        emoji: '📖',
      })),
      people: results.users.map((u: any) => ({
        id: u.userId,
        displayName: u.displayName,
        username: u.username,
        avatarSeed: u.username,
      })),
    };
  }
}
