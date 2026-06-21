import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':username')
  async getProfile(@Param('username') username: string) {
    const profile = await this.profilesService.findByUsername(username);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return { data: profile };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateData: UpdateProfileDto,
  ) {
    const updated = await this.profilesService.updateProfile(user.userId, updateData);
    return { data: updated };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':username/follow')
  async followUser(
    @CurrentUser() user: any,
    @Param('username') targetUsername: string,
  ) {
    await this.profilesService.followUser(user.userId, targetUsername);
    return { data: { success: true } };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':username/unfollow')
  async unfollowUser(
    @CurrentUser() user: any,
    @Param('username') targetUsername: string,
  ) {
    await this.profilesService.unfollowUser(user.userId, targetUsername);
    return { data: { success: true } };
  }
}
