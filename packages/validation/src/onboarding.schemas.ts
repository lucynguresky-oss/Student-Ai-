import { z } from 'zod';

/**
 * Onboarding wizard (§6). 10 steps (0–9). Every answer validated per-step and persisted.
 * Step order is the single source of truth for "nextStep" resolution on the backend.
 */
export const ONBOARDING_STEPS = [
  'welcome',
  'tracks',
  'motivation',
  'level',
  'daily_goal',
  'reminder',
  'age_band',
  'referral',
  'create_account',
  'plan_reveal',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Steps the user may skip (§6). */
export const SKIPPABLE_STEPS: ReadonlySet<OnboardingStep> = new Set(['reminder', 'referral']);

/** Steps that must have a persisted answer before /onboarding/complete succeeds. */
export const REQUIRED_STEPS: readonly OnboardingStep[] = [
  'tracks',
  'motivation',
  'level',
  'daily_goal',
  'age_band',
];

export function nextStep(step: OnboardingStep): OnboardingStep | null {
  const idx = ONBOARDING_STEPS.indexOf(step);
  if (idx < 0 || idx >= ONBOARDING_STEPS.length - 1) return null;
  return ONBOARDING_STEPS[idx + 1]!;
}

// ---------- Per-step answer schemas ----------
export const MOTIVATIONS = ['exams', 'school_support', 'career', 'curious', 'teacher'] as const;
export const LEVEL_CHOICES = ['new', 'basics', 'test_me'] as const;
export const DAILY_GOALS = [5, 10, 15, 20] as const;
export const AGE_BANDS = ['UNDER_13', 'TEEN_13_17', 'ADULT_18_24', 'ADULT_25_PLUS'] as const;
export const REFERRAL_SOURCES = [
  'friend_family',
  'tiktok',
  'instagram',
  'whatsapp',
  'school_teacher',
  'search',
  'other',
] as const;

export const tracksAnswerSchema = z.object({
  // Track slugs; min 1 max 3. First entry is primary (§6 step 1).
  trackSlugs: z.array(z.string().min(1)).min(1, 'Pick at least one').max(3, 'Pick up to three'),
});

export const motivationAnswerSchema = z.object({ motivation: z.enum(MOTIVATIONS) });

export const levelAnswerSchema = z.object({ level: z.enum(LEVEL_CHOICES) });

export const dailyGoalAnswerSchema = z.object({
  dailyGoalMinutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]),
});

export const reminderAnswerSchema = z.object({
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM')
    .nullable()
    .optional(),
  pushGranted: z.boolean().optional(),
});

export const ageBandAnswerSchema = z.object({ ageBand: z.enum(AGE_BANDS) });

export const referralAnswerSchema = z.object({ source: z.enum(REFERRAL_SOURCES) });

/** Map a step key to its answer schema. `welcome`, `create_account`, `plan_reveal` carry no answer. */
export const STEP_SCHEMAS: Partial<Record<OnboardingStep, z.ZodTypeAny>> = {
  tracks: tracksAnswerSchema,
  motivation: motivationAnswerSchema,
  level: levelAnswerSchema,
  daily_goal: dailyGoalAnswerSchema,
  reminder: reminderAnswerSchema,
  age_band: ageBandAnswerSchema,
  referral: referralAnswerSchema,
};

// ---------- Placement ----------
export const placementSubmitSchema = z.object({
  // answers keyed by questionId → chosen option index
  answers: z.array(z.object({ questionId: z.string(), choiceIdx: z.number().int().min(0) })).min(1),
});

/** Placement score → level mapping (§5.6). */
export function scoreToLevel(score: number): 'BEGINNER' | 'INTERMEDIATE' | 'CONFIDENT' {
  if (score < 40) return 'BEGINNER';
  if (score < 75) return 'INTERMEDIATE';
  return 'CONFIDENT';
}

/** "level" choice → TrackLevel for non-quiz paths (§6 step 3). */
export function levelChoiceToTrackLevel(choice: (typeof LEVEL_CHOICES)[number]): 'NEW' | 'BEGINNER' {
  return choice === 'new' ? 'NEW' : 'BEGINNER';
}

export type TracksAnswer = z.infer<typeof tracksAnswerSchema>;
export type DailyGoalAnswer = z.infer<typeof dailyGoalAnswerSchema>;
export type AgeBandAnswer = z.infer<typeof ageBandAnswerSchema>;
export type PlacementSubmit = z.infer<typeof placementSubmitSchema>;
