import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ProfileService } from '../profile/profile.service';
import { AccountService } from './account.service';
import { AvatarProcessorService } from '../profile/avatar.processor';
import { AuthGuard, Public } from '../../core/tokens/auth.guard';
import { RateLimitGuard, RateLimit, RateLimits } from '../../core/rate-limit/rate-limit.guard';
import { CurrentUser, deviceContextFrom, zodBody, type AuthedUser } from '../../core/http/request-context';
import { ProvidersModule } from '../../providers/providers.module';
import { AppException } from '../../core/http/app-exception';
import {
  updateProfileSchema,
  changeUsernameSchema,
  avatarConfirmSchema,
  changeEmailStartSchema,
  changeEmailConfirmSchema,
  changePhoneStartSchema,
  changePhoneConfirmSchema,
  ERROR_CODES,
} from '@learnix/validation';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard, RateLimitGuard)
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profile: ProfileService,
    private readonly accounts: AccountService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: AuthedUser): Promise<any> {
    const self = await this.accounts.selfObject(user.userId);
    if (!self) throw AppException.notFound();
    return self;
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: AuthedUser, @Body(zodBody(updateProfileSchema)) body: any): Promise<any> {
    return this.profile.updateProfile(user.userId, body);
  }

  @Public()
  @RateLimit(...RateLimits.usernameCheck)
  @Get('username-available')
  async usernameAvailable(@Query('u') u: string) {
    return this.profile.checkUsername(u ?? '');
  }

  @Patch('me/username')
  async changeUsername(@CurrentUser() user: AuthedUser, @Body(zodBody(changeUsernameSchema)) body: any) {
    return this.profile.changeUsername(user.userId, body.username);
  }

  @Post('me/avatar/presign')
  async avatarPresign(@CurrentUser() user: AuthedUser, @Body() body: { contentType: string }) {
    return this.profile.presignAvatar(user.userId, body.contentType);
  }

  @Post('me/avatar/confirm')
  async avatarConfirm(@CurrentUser() user: AuthedUser, @Body(zodBody(avatarConfirmSchema)) body: any) {
    return this.profile.confirmAvatar(user.userId, body.key);
  }

  @Patch('me/email/start')
  async emailStart(@CurrentUser() user: AuthedUser, @Body(zodBody(changeEmailStartSchema)) body: any) {
    await this.profile.changeEmailStart(user.userId, body.email);
    return { ok: true };
  }

  @Patch('me/email/confirm')
  async emailConfirm(@CurrentUser() user: AuthedUser, @Body(zodBody(changeEmailConfirmSchema)) body: any, @Req() req: FastifyRequest) {
    return this.profile.changeEmailConfirm(user.userId, body.email, body.otp, { ...deviceContextFrom(req), currentSessionId: user.sessionId });
  }

  @Patch('me/phone/start')
  async phoneStart(@CurrentUser() user: AuthedUser, @Body(zodBody(changePhoneStartSchema)) body: any) {
    await this.profile.changePhoneStart(user.userId, body.phone);
    return { ok: true };
  }

  @Patch('me/phone/confirm')
  async phoneConfirm(@CurrentUser() user: AuthedUser, @Body(zodBody(changePhoneConfirmSchema)) body: any, @Req() req: FastifyRequest) {
    return this.profile.changePhoneConfirm(user.userId, body.phone, body.otp, { ...deviceContextFrom(req), currentSessionId: user.sessionId });
  }
}

/** Public profile (§8 /u/[username]) — minimal v1, respects minor privacy. */
@ApiTags('profiles')
@Controller('u')
export class PublicProfileController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get(':username')
  async publicProfile(@Param('username') username: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        username: true,
        status: true,
        isMinor: true,
        profile: { select: { displayName: true, displayHandle: true, bio: true, avatarUrl: true, visibility: true, country: true, links: true } },
      },
    });
    if (!user || user.status !== 'ACTIVE' || !user.profile) throw AppException.notFound();
    // Private (incl. all minors) → return a minimal stub, not the full profile.
    if (user.profile.visibility === 'PRIVATE') {
      return { username: user.username, displayName: user.profile.displayName, avatarUrl: user.profile.avatarUrl, private: true };
    }
    return {
      username: user.username,
      displayName: user.profile.displayName,
      bio: user.profile.bio,
      avatarUrl: user.profile.avatarUrl,
      country: user.profile.country,
      links: user.profile.links,
      private: false,
    };
  }
}

@Module({
  imports: [ProvidersModule],
  controllers: [UsersController, PublicProfileController],
  providers: [ProfileService, AccountService, AvatarProcessorService],
  exports: [AccountService, ProfileService, AvatarProcessorService],
})
export class UsersModule {}
