import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { FeedService } from './feed.service';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get('home')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  home(@CurrentUser() user: AuthUser, @Query() q: CursorPaginationDto) {
    return this.feed.home(user.id, q);
  }

  @Get('explore')
  @UseGuards(OptionalJwtAuthGuard)
  explore(@CurrentUser() viewer?: AuthUser) {
    return this.feed.explore(viewer?.id);
  }

  @Get('reels')
  @UseGuards(OptionalJwtAuthGuard)
  reels(@Query() q: CursorPaginationDto, @CurrentUser() viewer?: AuthUser) {
    return this.feed.reels(viewer?.id, q);
  }

  @Get('user/:username')
  @UseGuards(OptionalJwtAuthGuard)
  byUser(
    @Param('username') username: string,
    @Query() q: CursorPaginationDto,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.feed.byUser(username, viewer?.id, q);
  }

  @Get('user/:username/tagged')
  @UseGuards(OptionalJwtAuthGuard)
  tagged(
    @Param('username') username: string,
    @Query() q: CursorPaginationDto,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.feed.taggedPosts(username, viewer?.id, q);
  }

  @Get('hashtag/:tag')
  @UseGuards(OptionalJwtAuthGuard)
  byHashtag(
    @Param('tag') tag: string,
    @Query() q: CursorPaginationDto,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.feed.byHashtag(tag, viewer?.id, q);
  }
}
