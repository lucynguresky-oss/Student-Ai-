import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { MessagingService } from './messaging.service';

class StartChatDto {
  @IsString()
  @IsNotEmpty()
  username!: string;
}

class SharePostDto {
  @IsString()
  @IsNotEmpty()
  postId!: string;
}

@ApiTags('messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.messaging.listConversations(user.id);
  }

  /** Start (or fetch existing) a 1:1 chat with another user. */
  @Post('direct')
  startDirect(@CurrentUser() user: AuthUser, @Body() dto: StartChatDto) {
    return this.messaging.getOrCreateDirect(user.id, dto.username);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.messaging.getConversation(id, user.id);
  }

  @Get(':id/messages')
  messages(
    @Param('id') id: string,
    @Query() q: CursorPaginationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messaging.getMessages(id, user.id, q);
  }

  @Post(':id/read')
  read(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.messaging.markRead(id, user.id);
  }

  @Post(':id/share')
  share(
    @Param('id') id: string,
    @Body() dto: SharePostDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messaging.sharePost(id, user.id, dto.postId);
  }
}
