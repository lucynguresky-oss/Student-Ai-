import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoriesService } from './stories.service';

class CreateStoryDto {
  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @IsUrl({ require_tld: false })
  mediaUrl!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  blurhash?: string;

  @IsOptional()
  @IsNumber()
  durationSec?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}

@ApiTags('stories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stories')
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  /** Story tray for the home screen. */
  @Get('tray')
  tray(@CurrentUser() user: AuthUser) {
    return this.stories.tray(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStoryDto) {
    if (user.role !== 'ADMIN' && user.role !== 'TEACHER') {
      throw new ForbiddenException('Only verified educators can post Stories/Bites');
    }
    return this.stories.create(user.id, dto);
  }

  @Get('user/:username')
  forUser(@Param('username') username: string, @CurrentUser() user: AuthUser) {
    return this.stories.forUser(username, user.id);
  }

  @Post(':id/view')
  @HttpCode(200)
  view(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.stories.view(id, user.id);
  }

  @Get(':id/viewers')
  viewers(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.stories.viewers(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.stories.remove(id, user.id);
  }
}
