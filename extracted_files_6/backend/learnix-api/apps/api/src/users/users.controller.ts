import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
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
import { UsersService } from './users.service';
import {
  ChangePasswordDto,
  ChangeUsernameDto,
  UpdateProfileDto,
} from './dto/update-profile.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Patch('me/username')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  changeUsername(@CurrentUser() user: AuthUser, @Body() dto: ChangeUsernameDto) {
    return this.users.changeUsername(user.id, dto);
  }

  @Patch('me/password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(user.id, dto);
  }

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  getProfile(
    @Param('username') username: string,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.users.getProfile(username, viewer?.id);
  }

  @Get(':username/followers')
  @UseGuards(OptionalJwtAuthGuard)
  followers(
    @Param('username') username: string,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.users.listFollowers(username, viewer?.id);
  }

  @Get(':username/following')
  @UseGuards(OptionalJwtAuthGuard)
  following(
    @Param('username') username: string,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.users.listFollowing(username, viewer?.id);
  }

  @Post(':username/follow')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  follow(@Param('username') username: string, @CurrentUser() user: AuthUser) {
    return this.users.follow(user.id, username);
  }

  @Delete(':username/follow')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  unfollow(@Param('username') username: string, @CurrentUser() user: AuthUser) {
    return this.users.unfollow(user.id, username);
  }

  @Post(':username/accept')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  accept(@Param('username') username: string, @CurrentUser() user: AuthUser) {
    return this.users.acceptRequest(user.id, username);
  }
}
