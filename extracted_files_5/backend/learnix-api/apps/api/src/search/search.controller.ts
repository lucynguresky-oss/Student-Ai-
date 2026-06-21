import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  run(
    @Query('q') q: string,
    @Query('type') type: 'all' | 'users' | 'hashtags' | 'posts' = 'all',
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.search.search(viewer?.id, q ?? '', type);
  }
}
