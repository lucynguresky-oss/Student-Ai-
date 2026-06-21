import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SearchService } from './search.service';

class SearchQueryDto {
  @IsString()
  q!: string;

  @IsOptional()
  @IsEnum(['users', 'hashtags', 'posts', 'all'])
  type?: 'users' | 'hashtags' | 'posts' | 'all';
}

class LeaderboardQueryDto {
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  subjectId?: string;
}

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  /**
   * GET /api/search?q=biology&type=all
   * Search users, hashtags, and posts. `type` narrows the scope.
   */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiQuery({ name: 'q', type: String })
  @ApiQuery({
    name: 'type',
    enum: ['users', 'hashtags', 'posts', 'all'],
    required: false,
  })
  find(@Query() dto: SearchQueryDto, @CurrentUser() viewer?: AuthUser) {
    return this.search.search(dto.q, dto.type ?? 'all', viewer?.id);
  }

  /**
   * GET /api/search/leaderboard?limit=20&subjectId=xxx
   * Returns users ranked by XP, optionally filtered to a subject.
   */
  @Get('leaderboard')
  @UseGuards(OptionalJwtAuthGuard)
  leaderboard(@Query() dto: LeaderboardQueryDto) {
    return this.search.leaderboard(dto.limit ?? 20, dto.subjectId);
  }
}
