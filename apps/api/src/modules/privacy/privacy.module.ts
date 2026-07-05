import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Injectable, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AppException } from '../../core/http/app-exception';
import { AuthGuard } from '../../core/tokens/auth.guard';
import { CurrentUser, zodBody, type AuthedUser } from '../../core/http/request-context';
import { updatePrivacySchema, ERROR_CODES, type UpdatePrivacyInput } from '@learnix/validation';

/**
 * Privacy (§5.4, §9.3). who-can-message / who-can-comment are stored now and enforced by the
 * future social build. Minor accounts are LOCKED to PRIVATE — a PATCH to PUBLIC is rejected
 * with MINOR_PRIVACY_LOCKED (§13).
 *
 * Under-13 without parental consent: social/privacy surfaces return PARENTAL_CONSENT_REQUIRED
 * (§9.3) while lessons keep working (learning-only mode — DECIDED default §15).
 */
@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  private async guardConsent(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { ageBand: true, parentalConsentAt: true },
    });
    if (user.ageBand === 'UNDER_13' && !user.parentalConsentAt) {
      throw AppException.forbidden(ERROR_CODES.PARENTAL_CONSENT_REQUIRED);
    }
  }

  async get(userId: string) {
    await this.guardConsent(userId);
    const profile = await this.prisma.profile.findUniqueOrThrow({
      where: { userId },
      select: { visibility: true, links: true },
    });
    const prefs = await this.prisma.userPreference.findUnique({ where: { userId }, select: { notifications: true } });
    const social = (prefs?.notifications as any)?.social ?? {};
    return {
      visibility: profile.visibility,
      whoCanMessage: social.whoCanMessage ?? 'followers',
      whoCanComment: social.whoCanComment ?? 'everyone',
    };
  }

  async update(userId: string, input: UpdatePrivacyInput) {
    await this.guardConsent(userId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { isMinor: true } });

    if (input.visibility === 'PUBLIC' && user.isMinor) {
      throw AppException.forbidden(ERROR_CODES.MINOR_PRIVACY_LOCKED);
    }
    if (input.visibility) {
      await this.prisma.profile.update({ where: { userId }, data: { visibility: input.visibility } });
    }
    // Stash messaging/comment prefs inside preferences.notifications.social for now.
    if (input.whoCanMessage || input.whoCanComment) {
      const prefs = await this.prisma.userPreference.findUniqueOrThrow({ where: { userId }, select: { notifications: true } });
      const n = (prefs.notifications as any) ?? {};
      n.social = { ...(n.social ?? {}), ...(input.whoCanMessage ? { whoCanMessage: input.whoCanMessage } : {}), ...(input.whoCanComment ? { whoCanComment: input.whoCanComment } : {}) };
      await this.prisma.userPreference.update({ where: { userId }, data: { notifications: n } });
    }
    return this.get(userId);
  }

  async listBlocked(userId: string) {
    const blocks = await this.prisma.blockedUser.findMany({
      where: { blockerId: userId },
      select: { blockedId: true, createdAt: true, blocked: { select: { username: true } } },
    });
    return { blocked: blocks.map((b) => ({ userId: b.blockedId, username: b.blocked.username, since: b.createdAt })) };
  }

  async block(userId: string, targetId: string) {
    if (userId === targetId) throw AppException.badRequest(ERROR_CODES.VALIDATION_ERROR, 'Cannot block yourself');
    const target = await this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!target) throw AppException.notFound();
    await this.prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
      update: {},
      create: { blockerId: userId, blockedId: targetId },
    });
    return { ok: true };
  }

  async unblock(userId: string, targetId: string) {
    await this.prisma.blockedUser.deleteMany({ where: { blockerId: userId, blockedId: targetId } });
    return { ok: true };
  }
}

@ApiTags('privacy')
@Controller('privacy')
@UseGuards(AuthGuard)
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService) {}

  @Get()
  get(@CurrentUser() user: AuthedUser) {
    return this.privacy.get(user.userId);
  }

  @Patch()
  update(@CurrentUser() user: AuthedUser, @Body(zodBody(updatePrivacySchema)) body: any) {
    return this.privacy.update(user.userId, body);
  }

  @Get('blocked')
  blocked(@CurrentUser() user: AuthedUser) {
    return this.privacy.listBlocked(user.userId);
  }

  @Post('blocked/:userId')
  block(@CurrentUser() user: AuthedUser, @Param('userId') target: string) {
    return this.privacy.block(user.userId, target);
  }

  @Delete('blocked/:userId')
  unblock(@CurrentUser() user: AuthedUser, @Param('userId') target: string) {
    return this.privacy.unblock(user.userId, target);
  }
}

@Module({ controllers: [PrivacyController], providers: [PrivacyService] })
export class PrivacyModule {}
