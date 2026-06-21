import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get('feed')
  async getFeed(
    @CurrentUser() user: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit: string = '20',
  ) {
    const posts = await this.postsService.getFeed(user?.userId, cursor, parseInt(limit));
    
    let nextCursor: string | undefined = undefined;
    if (posts.length > 0) {
      nextCursor = posts[posts.length - 1]!.id;
    }

    return {
      data: posts,
      meta: {
        cursor: nextCursor,
        hasMore: posts.length === parseInt(limit),
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(@CurrentUser() user: any, @Body() data: any) {
    const post = await this.postsService.createPost(user.userId, data);
    return { data: post };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/react')
  async reactToPost(
    @CurrentUser() user: any,
    @Param('id') postId: string,
    @Body('kind') kind: string,
  ) {
    await this.postsService.reactToPost(user.userId, postId, kind);
    return { data: { success: true } };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  async savePost(
    @CurrentUser() user: any,
    @Param('id') postId: string,
  ) {
    await this.postsService.savePost(user.userId, postId);
    return { data: { success: true } };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async addComment(
    @CurrentUser() user: any,
    @Param('id') postId: string,
    @Body('body') body: string,
  ) {
    const comment = await this.postsService.addComment(user.userId, postId, body);
    return { data: comment };
  }

  @Get(':id/comments')
  async getComments(@Param('id') postId: string) {
    const comments = await this.postsService.getComments(postId);
    return { data: comments };
  }
}
