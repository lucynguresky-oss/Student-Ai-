import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportTargetType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SafetyService } from './safety.service';

class CreateReportDto {
  @IsEnum(ReportTargetType)
  targetType!: ReportTargetType;

  @IsOptional()
  @IsString()
  postId?: string;

  @IsOptional()
  @IsString()
  reportedUsername?: string;

  @IsOptional()
  @IsString()
  commentId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}

@ApiTags('safety')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  @Post('users/:username/block')
  block(@Param('username') username: string, @CurrentUser() user: AuthUser) {
    return this.safety.block(user.id, username);
  }

  @Delete('users/:username/block')
  unblock(@Param('username') username: string, @CurrentUser() user: AuthUser) {
    return this.safety.unblock(user.id, username);
  }

  @Get('users/me/blocked')
  blocked(@CurrentUser() user: AuthUser) {
    return this.safety.listBlocked(user.id);
  }

  @Post('reports')
  report(@CurrentUser() user: AuthUser, @Body() dto: CreateReportDto) {
    return this.safety.report(user.id, dto);
  }

  @Get('reports/queue')
  queue(@CurrentUser() user: AuthUser) {
    return this.safety.reportQueue(user.role);
  }
}
