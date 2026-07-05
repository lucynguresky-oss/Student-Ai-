import { Body, Controller, Get, Patch, UseGuards, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuthGuard } from '../../core/tokens/auth.guard';
import { CurrentUser, zodBody, type AuthedUser } from '../../core/http/request-context';
import { updateNotificationPrefsSchema } from '@learnix/validation';

/**
 * Notification preferences matrix (§5.4, §7): Push/Email/SMS × Streak/Social/Product.
 * Minors get no SMS marketing category (§9.3) — enforced by clamping sms.product=false when
 * the account is a minor.
 */
@ApiTags('notification-prefs')
@Controller('notification-prefs')
@UseGuards(AuthGuard)
export class NotificationPrefsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get(@CurrentUser() user: AuthedUser): Promise<any> {
    const prefs = await this.prisma.userPreference.findUnique({
      where: { userId: user.userId },
      select: { notifications: true },
    });
    return { notifications: prefs?.notifications ?? {} };
  }

  @Patch()
  async update(@CurrentUser() user: AuthedUser, @Body(zodBody(updateNotificationPrefsSchema)) body: any) {
    const notifications = body.notifications;
    if (user.isMinor) {
      // No SMS marketing to minors (§9.3).
      notifications.sms = { ...notifications.sms, product: false, social: false };
    }
    await this.prisma.userPreference.update({ where: { userId: user.userId }, data: { notifications } });
    return { notifications };
  }
}

@Module({ controllers: [NotificationPrefsController] })
export class NotificationPrefsModule {}
