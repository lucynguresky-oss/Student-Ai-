import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { AppException } from '../../core/http/app-exception';
import { AccountService } from '../users/account.service';
import { PLAN_RESOLVER, type PlanResolver, type Motivation } from './plan-resolver';
import {
  ERROR_CODES,
  ONBOARDING_STEPS,
  SKIPPABLE_STEPS,
  REQUIRED_STEPS,
  STEP_SCHEMAS,
  nextStep,
  scoreToLevel,
  levelChoiceToTrackLevel,
  type OnboardingStep,
} from '@learnix/validation';
import type { AgeBand, TrackLevel } from '@learnix/db';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
    @Inject(PLAN_RESOLVER) private readonly planResolver: PlanResolver,
  ) {}

  async getState(userId: string): Promise<any> {
    const state = await this.prisma.onboardingState.findUnique({ where: { userId } });
    if (!state) {
      return this.prisma.onboardingState.create({ data: { userId } });
    }
    return state;
  }

  /** Persist an answer for a step, advance currentStep, return the next step. */
  async submitStep(userId: string, stepKey: string, answer: unknown) {
    if (!ONBOARDING_STEPS.includes(stepKey as OnboardingStep)) {
      throw AppException.badRequest(ERROR_CODES.ONBOARDING_STEP_INVALID);
    }
    const step = stepKey as OnboardingStep;
    const schema = STEP_SCHEMAS[step];
    let parsed: unknown = {};
    if (schema) {
      const res = schema.safeParse(answer);
      if (!res.success) {
        throw AppException.badRequest(ERROR_CODES.ONBOARDING_ANSWER_INVALID, undefined, {
          issues: res.error.issues.map((i) => ({ path: i.path, message: i.message })),
        });
      }
      parsed = res.data;
    }

    const state = await this.getState(userId);
    const responses = { ...(state.responses as Record<string, unknown>), [step]: parsed };

    // Side effects for specific steps.
    if (step === 'age_band') {
      await this.applyAgeBand(userId, (parsed as { ageBand: AgeBand }).ageBand);
    }

    const advanceTo = nextStep(step) ?? state.currentStep;
    const updated = await this.prisma.onboardingState.update({
      where: { userId },
      data: { responses: responses as any, currentStep: advanceTo },
    });
    this.analytics.track('onboarding_step_completed', { userId }, { step });
    return { nextStep: nextStep(step), currentStep: updated.currentStep };
  }

  async skipStep(userId: string, stepKey: string) {
    const step = stepKey as OnboardingStep;
    if (!SKIPPABLE_STEPS.has(step)) {
      throw AppException.badRequest(ERROR_CODES.ONBOARDING_STEP_NOT_SKIPPABLE);
    }
    const advanceTo = nextStep(step) ?? step;
    await this.prisma.onboardingState.update({ where: { userId }, data: { currentStep: advanceTo } });
    this.analytics.track('onboarding_step_skipped', { userId }, { step });
    return { nextStep: nextStep(step) };
  }

  /** Minor-mode application (§9.3): set flags, force PRIVATE profile, mark under-13. */
  private async applyAgeBand(userId: string, ageBand: AgeBand): Promise<void> {
    const isMinor = AccountService.isMinorBand(ageBand);
    await this.prisma.user.update({ where: { id: userId }, data: { ageBand, isMinor } });
    if (isMinor) {
      await this.prisma.profile.update({ where: { userId }, data: { visibility: 'PRIVATE' } });
    }
  }

  // ---------- Placement ----------
  async startPlacement(userId: string, trackId: string): Promise<any> {
    const questions = await this.prisma.placementQuestion.findMany({
      where: { trackId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 5,
      select: { id: true, prompt: true, options: true }, // never leak answerIdx
    });
    if (questions.length === 0) throw AppException.notFound(ERROR_CODES.NOT_FOUND, 'No placement quiz for this track');
    this.analytics.track('placement_started', { userId }, { trackId });
    return { trackId, questions };
  }

  async submitPlacement(userId: string, trackId: string, answers: Array<{ questionId: string; choiceIdx: number }>) {
    const questions = await this.prisma.placementQuestion.findMany({
      where: { trackId, isActive: true },
      select: { id: true, answerIdx: true },
    });
    const key = new Map(questions.map((q) => [q.id, q.answerIdx]));
    let correct = 0;
    for (const a of answers) {
      if (key.get(a.questionId) === a.choiceIdx) correct++;
    }
    const total = Math.max(1, Math.min(questions.length, answers.length));
    const score = Math.round((correct / total) * 100);
    const level = scoreToLevel(score);
    this.analytics.track('placement_submitted', { userId }, { trackId, score });
    return { trackId, score, level };
  }

  // ---------- Complete ----------
  async complete(userId: string) {
    const state = await this.getState(userId);
    const responses = state.responses as Record<string, any>;

    // Validate required steps are answered (§13).
    for (const req of REQUIRED_STEPS) {
      if (!(req in responses)) {
        throw AppException.badRequest(ERROR_CODES.ONBOARDING_INCOMPLETE, `Missing step: ${req}`);
      }
    }

    const trackSlugs: string[] = responses.tracks?.trackSlugs ?? [];
    const motivation: Motivation = responses.motivation?.motivation ?? 'curious';
    const levelChoice: string = responses.level?.level ?? 'new';
    const dailyGoalMinutes: number = responses.daily_goal?.dailyGoalMinutes ?? 10;
    const reminderTime: string | null = responses.reminder?.reminderTime ?? null;
    const placement = responses.placement as { trackId: string; level: TrackLevel } | undefined;

    // Resolve tracks.
    const tracks = await this.prisma.learningTrack.findMany({ where: { slug: { in: trackSlugs }, isActive: true } });
    if (tracks.length === 0) throw AppException.badRequest(ERROR_CODES.ONBOARDING_INCOMPLETE, 'No valid tracks selected');

    // Write everything transactionally (§10 gamification defaults).
    const planInputs = await this.prisma.$transaction(async (tx) => {
      const inputs: Array<{ trackId: string; slug: string; title: string; level: TrackLevel; isPrimary: boolean }> = [];
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i]!;
        const isPrimary = trackSlugs[0] === t.slug || (i === 0 && !trackSlugs.includes(trackSlugs[0]!));
        // Level: placement result for the primary track if taken, else the level choice.
        let level: TrackLevel = levelChoiceToTrackLevel(levelChoice as any);
        if (placement && placement.trackId === t.id) level = placement.level;

        await tx.userTrack.upsert({
          where: { userId_trackId: { userId, trackId: t.id } },
          update: { level, isPrimary, placementScore: placement?.trackId === t.id ? undefined : undefined },
          create: { userId, trackId: t.id, level, isPrimary },
        });
        inputs.push({ trackId: t.id, slug: t.slug, title: t.title, level, isPrimary });
      }

      // Preferences: goal + reminder.
      await tx.userPreference.upsert({
        where: { userId },
        update: { dailyGoalMinutes, reminderTime: reminderTime ?? undefined },
        create: {
          userId,
          dailyGoalMinutes,
          reminderTime: reminderTime ?? undefined,
          notifications: { push: { streak: true, social: true, product: true }, email: { streak: true, social: false, product: true }, sms: { streak: false, social: false, product: false } },
        },
      });

      // Streak state at 0 (§10). Create minimal UserStreak if absent.
      await tx.userStreak.upsert({ where: { userId }, update: {}, create: { userId, current: 0, longest: 0 } });

      // Mark onboarding complete.
      await tx.onboardingState.update({ where: { userId }, data: { completedAt: new Date(), currentStep: 'plan_reveal' } });

      return inputs;
    });

    const plan = this.planResolver.resolve({ tracks: planInputs, motivation, dailyGoalMinutes });

    const durationSec = Math.round((Date.now() - state.startedAt.getTime()) / 1000);
    this.analytics.track('onboarding_completed', { userId }, { durationSec, tracks: trackSlugs.length, goal: dailyGoalMinutes });

    return plan;
  }
}
