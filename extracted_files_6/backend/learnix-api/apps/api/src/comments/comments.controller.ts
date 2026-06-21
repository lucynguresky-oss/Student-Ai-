import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get('posts/:postId/comments')
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Param('postId') postId: string,
    @Query() q: CursorPaginationDto,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.comments.list(postId, viewer?.id, q);
  }

  @Post('posts/:postId/comments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.comments.create(postId, user.id, dto);
  }

  @Get('comments/:commentId/replies')
  @UseGuards(OptionalJwtAuthGuard)
  replies(
    @Param('commentId') commentId: string,
    @Query() q: CursorPaginationDto,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.comments.listReplies(commentId, viewer?.id, q);
  }

  @Delete('comments/:commentId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('commentId') commentId: string, @CurrentUser() user: AuthUser) {
    return this.comments.remove(commentId, user.id);
  }

  @Post('comments/:commentId/like')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  like(@Param('commentId') commentId: string, @CurrentUser() user: AuthUser) {
    return this.comments.like(commentId, user.id);
  }

  @Delete('comments/:commentId/like')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  unlike(@Param('commentId') commentId: string, @CurrentUser() user: AuthUser) {
    return this.comments.unlike(commentId, user.id);
  }
}
