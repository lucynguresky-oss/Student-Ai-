import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ModerationStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModerationService } from './moderation.service';

class SetStatusDto {
  @IsEnum(ModerationStatus)
  status!: ModerationStatus;
}

@ApiTags('moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  /** Author requests human review of a removed/flagged post. */
  @Post('posts/:id/appeal')
  appeal(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.moderation.appeal(id, user.id);
  }

  /** Moderator/admin queue of flagged + removed posts. */
  @Get('queue')
  queue(@CurrentUser() user: AuthUser) {
    return this.moderation.queue(user.role);
  }

  /** Admin override after review. */
  @Post('posts/:id/status')
  setStatus(
    @Param('id') id: string,
    @Body() dto: SetStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.moderation.setStatus(id, dto.status, user.role);
  }
}
