import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
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
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { SavedService } from './saved.service';

class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;
}

class AssignCollectionDto {
  @IsOptional()
  @IsString()
  collectionId?: string | null;
}

@ApiTags('saved')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SavedController {
  constructor(private readonly saved: SavedService) {}

  @Get('saved')
  listSaved(@CurrentUser() user: AuthUser, @Query() q: CursorPaginationDto) {
    return this.saved.listSaved(user.id, q);
  }

  @Get('collections')
  listCollections(@CurrentUser() user: AuthUser) {
    return this.saved.listCollections(user.id);
  }

  @Post('collections')
  createCollection(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCollectionDto,
  ) {
    return this.saved.createCollection(user.id, dto.name);
  }

  @Delete('collections/:id')
  deleteCollection(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.saved.deleteCollection(user.id, id);
  }

  @Get('collections/:id/posts')
  collectionPosts(
    @Param('id') id: string,
    @Query() q: CursorPaginationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.saved.collectionPosts(user.id, id, q);
  }

  @Put('saved/:postId/collection')
  assign(
    @Param('postId') postId: string,
    @Body() dto: AssignCollectionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.saved.assign(user.id, postId, dto.collectionId ?? null);
  }
}
