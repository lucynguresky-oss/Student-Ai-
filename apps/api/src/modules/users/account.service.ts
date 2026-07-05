import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import type { AgeBand } from '@learnix/db';

/**
 * AccountService — small cross-module helpers used by auth, onboarding, profile, and lifecycle.
 * Kept dependency-light so multiple modules can share it without circular imports.
 */
@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Minor derivation (§9.3): UNDER_13 or TEEN_13_17 → minor. */
  static isMinorBand(band: AgeBand | null | undefined): boolean {
    return band === 'UNDER_13' || band === 'TEEN_13_17';
  }

  /** Live username availability with a short Redis cache (hot path — §5.3, scale). */
  async isUsernameAvailable(usernameLower: string): Promise<boolean> {
    return this.redis.getOrSet(`uname:avail:${usernameLower}`, 30, async () => {
      const existing = await this.prisma.user.findUnique({
        where: { username: usernameLower },
        select: { id: true },
      });
      return !existing;
    });
  }

  /** Invalidate availability cache when a username is claimed/changed. */
  async invalidateUsername(usernameLower: string): Promise<void> {
    await this.redis.invalidate(`uname:avail:${usernameLower}`);
  }

  /** Generate up to 3 free suggestions derived from a taken base. */
  async suggestUsernames(base: string, count = 3): Promise<string[]> {
    const clean = base.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 24) || 'learner';
    const candidates = new Set<string>();
    const suffixes = ['_', '.', String(Math.floor(Math.random() * 90) + 10)];
    let guard = 0;
    while (candidates.size < count && guard < 30) {
      guard++;
      const n = Math.floor(Math.random() * 9000) + 100;
      const variants = [
        `${clean}${n}`,
        `${clean}${suffixes[guard % suffixes.length]}${n}`,
        `real_${clean}`.slice(0, 30),
      ];
      for (const v of variants) {
        if (candidates.size >= count) break;
        if (v.length < 3 || v.length > 30) continue;
        if (await this.isUsernameAvailable(v)) candidates.add(v);
      }
    }
    return [...candidates].slice(0, count);
  }

  /** Auto username for guests (§5.1): learner_x7k2 style. */
  static guestUsername(): string {
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
    let s = '';
    for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return `learner_${s}`;
  }

  /** Shape the full self object for GET /users/me (§5.3). */
  async selfObject(userId: string): Promise<Record<string, any> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, preferences: true, onboarding: true, tracks: { include: { track: true } } },
    });
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: !!user.emailVerifiedAt,
      phone: user.phone,
      phoneVerified: !!user.phoneVerifiedAt,
      status: user.status,
      isGuest: user.isGuest,
      isMinor: user.isMinor,
      ageBand: user.ageBand,
      parentalConsent: !!user.parentalConsentAt,
      hasPassword: !!user.passwordHash,
      deletionRequestedAt: user.deletionRequestedAt,
      profile: user.profile && {
        displayName: user.profile.displayName,
        displayHandle: user.profile.displayHandle,
        bio: user.profile.bio,
        avatarUrl: user.profile.avatarUrl,
        country: user.profile.country,
        language: user.profile.language,
        visibility: user.profile.visibility,
        links: user.profile.links,
      },
      preferences: user.preferences && {
        dailyGoalMinutes: user.preferences.dailyGoalMinutes,
        reminderTime: user.preferences.reminderTime,
        timezone: user.preferences.timezone,
        theme: user.preferences.theme,
        contentLanguage: user.preferences.contentLanguage,
        soundEffects: user.preferences.soundEffects,
        notifications: user.preferences.notifications,
      },
      onboarding: user.onboarding && {
        currentStep: user.onboarding.currentStep,
        completed: !!user.onboarding.completedAt,
      },
      tracks: user.tracks.map((t) => ({
        slug: t.track.slug,
        title: t.track.title,
        level: t.level,
        isPrimary: t.isPrimary,
        placementScore: t.placementScore,
      })),
    };
  }
}
