import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

class EditCaptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2200)
  caption!: string;
}

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.posts.create(user.id, dto);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() viewer?: AuthUser) {
    return this.posts.findOne(id, viewer?.id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.posts.remove(id, user.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  editCaption(
    @Param('id') id: string,
    @Body() dto: EditCaptionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.posts.editCaption(id, user.id, dto.caption);
  }

  @Get(':id/likes')
  @UseGuards(OptionalJwtAuthGuard)
  likers(@Param('id') id: string, @Query() q: CursorPaginationDto) {
    return this.posts.likers(id, q);
  }

  @Post(':id/view')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  view(@Param('id') id: string) {
    return this.posts.registerView(id);
  }

  @Post(':id/like')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  like(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.posts.like(id, user.id);
  }

  @Delete(':id/like')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  unlike(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.posts.unlike(id, user.id);
  }

  @Post(':id/save')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  save(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.posts.save(id, user.id);
  }

  @Delete(':id/save')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  unsave(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.posts.unsave(id, user.id);
  }
}
