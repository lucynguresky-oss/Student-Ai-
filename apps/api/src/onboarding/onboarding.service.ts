import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import { OnboardingStepOption } from '@learnix/types';

interface StepConfig {
  id: string;
  kind: 'greeting' | 'single_select' | 'searchable_select' | 'multi_select' | 'date_select' | 'celebration';
  title: string;
  subtitle?: string;
  writesTo: string;
  options?: OnboardingStepOption[];
  minSelections?: number;
  skipCondition?: string;
}

/** Config-driven onboarding step definitions */
const STEP_CONFIGS: StepConfig[] = [
  // ── Language pick (first thing — before we even greet) ─────────────
  {
    id: 'language',
    kind: 'searchable_select',
    title: 'Choose your language',
    subtitle: 'You can change this any time in Settings.',
    writesTo: 'locale',
    // options populated dynamically from Locale table (status=complete only)
  },
  {
    id: 'greeting',
    kind: 'greeting',
    title: "Hi, I'm Lumi! ✨",
    subtitle: "Let's set up your learning — takes 30 seconds.",
    writesTo: '_none',
  },
  {
    id: 'stage',
    kind: 'single_select',
    title: 'Where are you in your learning journey?',
    subtitle: 'This helps us find the right content for you.',
    writesTo: 'stage',
    options: [
      { value: 'UNIVERSITY', label: 'University / College', icon: '🎓' },
      { value: 'SECONDARY', label: 'High School (Secondary)', icon: '📚' },
      { value: 'UPPER_PRIMARY', label: 'Upper Primary', icon: '✏️' },
      { value: 'LOWER_PRIMARY', label: 'Lower Primary', icon: '🧒' },
      { value: 'LIFELONG', label: 'Just here to learn', icon: '🌍' },
    ],
  },
  {
    id: 'country',
    kind: 'searchable_select',
    title: 'What country are you in?',
    subtitle: "We'll match content to your national curriculum.",
    writesTo: 'countryId',
    // options populated dynamically from DB
  },
  {
    id: 'curriculum',
    kind: 'single_select',
    title: 'Which curriculum do you follow?',
    writesTo: 'curriculumId',
    skipCondition: 'single_curriculum', // auto-skip if only 1 curriculum
  },
  {
    id: 'level',
    kind: 'single_select',
    title: 'What level / form / grade are you in?',
    writesTo: 'levelId',
  },
  {
    id: 'subjects',
    kind: 'multi_select',
    title: 'What subjects are you studying?',
    subtitle: 'Core subjects are pre-selected. Add electives as you like!',
    writesTo: 'subjectIds',
    minSelections: 1,
  },
  {
    id: 'daily_goal',
    kind: 'single_select',
    title: 'Set your daily learning goal',
    subtitle: 'You can change this anytime.',
    writesTo: 'dailyGoalMinutes',
    options: [
      { value: '5',  label: '5 minutes / day',  icon: '🌱', sublabel: 'Casual' },
      { value: '10', label: '10 minutes / day', icon: '📖', sublabel: 'Regular', isDefault: true },
      { value: '20', label: '20 minutes / day', icon: '🔥', sublabel: 'Serious' },
      { value: '30', label: '30 minutes / day', icon: '🚀', sublabel: 'Intense' },
    ],
  },
  {
    id: 'celebration',
    kind: 'celebration',
    title: 'All set! 🎉',
    subtitle: 'Your feed is now tuned to your subjects.',
    writesTo: '_none',
  },
];

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taxonomy: TaxonomyService,
  ) {}

  /**
   * Returns the next onboarding step with populated options.
   * Uses the current learner state to determine which step to show
   * and applies branching logic (skip curriculum if only one, etc.)
   */
  async getNextStep(
    userId: string,
    currentStepId?: string,
  ) {
    const learner = await this.prisma.learnerProfile.findUnique({
      where: { userId },
    });

    // Determine the index of the next step
    let nextIndex = 0;
    if (currentStepId) {
      const currentIndex = STEP_CONFIGS.findIndex((s) => s.id === currentStepId);
      nextIndex = currentIndex + 1;
    }

    // Walk through steps applying skip conditions
    while (nextIndex < STEP_CONFIGS.length) {
      const stepConfig = STEP_CONFIGS[nextIndex]!;

      // Apply branching logic
      if (stepConfig.id === 'curriculum' && learner?.countryId) {
        const curricula = await this.taxonomy.getCurricula(learner.countryId);
        if (curricula.length === 1) {
          // Auto-set the only curriculum and skip this step
          await this.prisma.learnerProfile.update({
            where: { userId },
            data: { curriculumId: curricula[0]!.id },
          });
          nextIndex++;
          continue;
        }
      }

      // Populate dynamic options
      const step = { ...stepConfig, options: stepConfig.options ?? [] };

      if (step.id === 'language') {
        // Only show locales that are UI-complete
        const locales = await this.taxonomy.getLocales(true);
        step.options = locales.map((l) => ({
          value: l.code,
          label: l.nativeName,
          sublabel: l.englishName,
          icon: l.rtl ? '↩' : undefined,
        }));
      } else if (step.id === 'country') {
        const countries = await this.taxonomy.getCountries();
        step.options = countries.map((c) => ({
          value: c.id,
          label: c.name,
          icon: c.flag,
        }));
      } else if (step.id === 'curriculum' && learner?.countryId) {
        const curricula = await this.taxonomy.getCurricula(learner.countryId);
        step.options = curricula.map((c) => ({
          value: c.id,
          label: c.name,
          sublabel: c.code,
        }));
      } else if (step.id === 'level' && learner?.curriculumId) {
        const levels = await this.taxonomy.getLevels(
          learner.curriculumId,
          learner.stage ?? undefined,
        );
        step.options = levels.map((l) => ({
          value: l.id,
          label: l.name,
          sublabel: l.stage,
        }));
      } else if (step.id === 'subjects' && learner?.curriculumId) {
        const subjects = await this.taxonomy.getSubjects(
          learner.curriculumId,
          learner.levelId ?? undefined,
        );
        step.options = subjects.map((s) => ({
          value: s.id,
          label: s.nameEn,
          sublabel: s.nameSw ?? undefined,
          isDefault: s.isCore,
        }));
      }

      return {
        step,
        totalSteps: STEP_CONFIGS.length,
        currentStep: nextIndex + 1,
      };
    }

    // All steps completed
    return null;
  }

  /**
   * Persist a single onboarding answer to the LearnerProfile.
   * Creates the LearnerProfile if it doesn't exist yet.
   */
  async submitAnswer(
    userId: string,
    stepId: string,
    value: string | string[] | number,
  ) {
    const stepConfig = STEP_CONFIGS.find((s) => s.id === stepId);
    if (!stepConfig) throw new NotFoundException(`Unknown step: ${stepId}`);

    const writesTo = stepConfig.writesTo;
    if (writesTo === '_none') return { ok: true };

    // Ensure LearnerProfile exists
    const existing = await this.prisma.learnerProfile.findUnique({
      where: { userId },
    });

    const data: Record<string, unknown> = {};

    switch (writesTo) {
      case 'locale':
        // Locale lives on User, not LearnerProfile — update it directly
        await this.prisma.user.update({
          where: { id: userId },
          data: { locale: value as string },
        });
        return { ok: true };
      case 'stage':
        data.stage = value as string;
        break;
      case 'countryId':
        data.countryId = value as string;
        break;
      case 'curriculumId':
        data.curriculumId = value as string;
        break;
      case 'levelId':
        data.levelId = value as string;
        break;
      case 'subjectIds':
        data.subjectIds = Array.isArray(value) ? value : [value as string];
        break;
      case 'dailyGoalMinutes':
        data.dailyGoalMinutes = typeof value === 'number' ? value : parseInt(value as string, 10);
        break;
    }

    if (existing) {
      await this.prisma.learnerProfile.update({
        where: { userId },
        data: data as any,
      });
    } else {
      // First answer — create with defaults; countryId is now nullable
      await this.prisma.learnerProfile.create({
        data: {
          userId,
          stage: (data.stage as string) ?? 'SECONDARY',
          // countryId is nullable — don't force an empty string
          ...data,
        } as any,
      });
    }

    return { ok: true };
  }

  /**
   * Mark onboarding as complete.
   * Awards +10 XP and "First Steps" badge.
   */
  async completeOnboarding(userId: string) {
    // Mark as complete
    await this.prisma.learnerProfile.update({
      where: { userId },
      data: { completedOnboarding: true },
    });

    // Award XP
    await this.prisma.xpEvent.create({
      data: {
        userId,
        kind: 'onboarding_complete',
        amount: 10,
        metadata: { source: 'onboarding' },
      },
    });

    // Start streak
    await this.prisma.streak.upsert({
      where: { userId },
      create: {
        userId,
        currentDays: 1,
        longestDays: 1,
        lastQualifiedAt: new Date(),
      },
      update: {
        currentDays: 1,
        lastQualifiedAt: new Date(),
      },
    });

    // Award "First Steps" badge if exists
    const badge = await this.prisma.badge.findUnique({
      where: { key: 'FIRST_LESSON' },
    });
    if (badge) {
      await this.prisma.userBadge.upsert({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
        create: { userId, badgeId: badge.id },
        update: {},
      });
    }

    // Load the final profile to return
    const profile = await this.prisma.learnerProfile.findUnique({
      where: { userId },
    });

    return {
      profile,
      xpAwarded: 10,
      badge: badge ? { key: badge.key, name: badge.nameEn } : null,
    };
  }
}
