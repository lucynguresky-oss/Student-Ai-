import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────

export const UserStatus = z.enum(['ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED']);
export type UserStatus = z.infer<typeof UserStatus>;

export const AgeBand = z.enum(['UNDER_13', 'TEEN_13_17', 'ADULT_18_PLUS']);
export type AgeBand = z.infer<typeof AgeBand>;

export const PrivacyMode = z.enum(['PUBLIC', 'PRIVATE']);
export type PrivacyMode = z.infer<typeof PrivacyMode>;

export const RoleKey = z.enum([
  'STUDENT',
  'TEACHER',
  'CREATOR',
  'PARENT',
  'INSTITUTION_ADMIN',
  'MODERATOR',
  'SUPER_ADMIN',
]);
export type RoleKey = z.infer<typeof RoleKey>;

export const Stage = z.enum([
  'LOWER_PRIMARY',
  'UPPER_PRIMARY',
  'SECONDARY',
  'UNIVERSITY',
  'LIFELONG',
]);
export type Stage = z.infer<typeof Stage>;

export const QuizSource = z.enum(['VIDEO', 'LESSON', 'PAPER', 'STANDALONE']);
export type QuizSource = z.infer<typeof QuizSource>;

export const QuestionType = z.enum([
  'MCQ',
  'MULTI',
  'TF',
  'FILL',
  'SHORT',
  'MATCH',
  'ORDER',
  'ESSAY',
  'MATH',
  'DIAGRAM',
]);
export type QuestionType = z.infer<typeof QuestionType>;

export const PostType = z.enum([
  'TEXT',
  'IMAGE',
  'VIDEO',
  'DOC',
  'POLL',
  'QUESTION',
  'QUIZ',
  'BOOK_EXCERPT',
  'PAPER_QUESTION',
  'ANNOUNCEMENT',
]);
export type PostType = z.infer<typeof PostType>;

export const ModerationState = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED']);
export type ModerationState = z.infer<typeof ModerationState>;

export const LicenseCategory = z.enum([
  'PUBLIC_DOMAIN',
  'OER',
  'LICENSED_PUBLISHER',
  'INSTITUTION_ONLY',
  'USER_UPLOADED_MODERATED',
]);
export type LicenseCategory = z.infer<typeof LicenseCategory>;

export const AccessType = z.enum(['FREE', 'PLUS', 'PREMIUM', 'INSTITUTION']);
export type AccessType = z.infer<typeof AccessType>;

export const TopicMasteryState = z.enum([
  'NOT_STARTED',
  'LEARNING',
  'PRACTICING',
  'STRONG',
  'MASTERED',
  'NEEDS_REVISION',
]);
export type TopicMasteryState = z.infer<typeof TopicMasteryState>;

export const SubscriptionPlan = z.enum([
  'FREE',
  'PLUS',
  'PREMIUM',
  'TEACHER',
  'CREATOR_PRO',
  'INSTITUTION',
]);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlan>;

export const SubscriptionStatus = z.enum([
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'EXPIRED',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;

// ─── API Envelope (§1) ──────────────────────────────────────

export const ApiEnvelope = z.object({
  success: z.boolean(),
  data: z.any().nullable(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      fields: z.record(z.array(z.string())).optional(),
      requestId: z.string().optional(),
    })
    .nullable(),
  meta: z
    .object({
      page: z.number().optional(),
      perPage: z.number().optional(),
      total: z.number().optional(),
      cursor: z.string().optional(),
      hasMore: z.boolean().optional(),
    })
    .optional(),
});
export type ApiEnvelope = z.infer<typeof ApiEnvelope>;

export const PaginationQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuery>;

// ─── Auth Schemas ────────────────────────────────────────────

export const SignupRequest = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(2).max(50),
  ageBand: AgeBand,
});
export type SignupRequest = z.infer<typeof SignupRequest>;

export const LoginRequest = z.object({
  identifier: z.string().min(1), // email, phone, or username
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const TokenPair = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});
export type TokenPair = z.infer<typeof TokenPair>;

// ─── Profile Schemas ─────────────────────────────────────────

export const UpdateProfileRequest = z.object({
  displayName: z.string().min(2).max(50).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/)
    .optional(),
  bio: z.string().max(500).optional(),
  country: z.string().length(2).optional(),
  curriculum: z.string().optional(),
  level: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  privacyMode: PrivacyMode.optional(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequest>;

// ─── Taxonomy Schemas (§9) ──────────────────────────────────

export interface CountryResponse {
  id: string;
  name: string;
  iso2: string;
  flag: string;
}

export interface CurriculumResponse {
  id: string;
  code: string;
  name: string;
  countryId: string;
}

export interface EducationLevelResponse {
  id: string;
  stage: Stage;
  name: string;
  orderIndex: number;
  curriculumId: string;
}

export interface SubjectResponse {
  id: string;
  key: string;
  nameEn: string;
  nameSw?: string | null;
  isCore?: boolean;
}

// ─── Onboarding Schemas (§8) ────────────────────────────────

export const OnboardingStepKind = z.enum([
  'greeting',
  'single_select',
  'searchable_select',
  'multi_select',
  'date_select',
  'celebration',
]);
export type OnboardingStepKind = z.infer<typeof OnboardingStepKind>;

export interface OnboardingStepOption {
  value: string;
  label: string;
  icon?: string;
  sublabel?: string;
  isDefault?: boolean;
}

export interface OnboardingStepResponse {
  id: string;
  kind: OnboardingStepKind;
  title: string;
  subtitle?: string;
  writesTo: string;
  options?: OnboardingStepOption[];
  minSelections?: number;
  maxSelections?: number;
  skipCondition?: string;
}

export const OnboardingAnswerRequest = z.object({
  stepId: z.string(),
  value: z.union([z.string(), z.array(z.string()), z.number()]),
});
export type OnboardingAnswerRequest = z.infer<typeof OnboardingAnswerRequest>;

// ─── Quiz Schemas (§11) ─────────────────────────────────────

export interface QuizResponse {
  id: string;
  title: string;
  source: QuizSource;
  subjectId?: string | null;
  questions: QuizQuestionResponse[];
}

/** Question response — `isCorrect` is NEVER included (server-side only) */
export interface QuizQuestionResponse {
  id: string;
  order: number;
  stem: string;
  type: QuestionType;
  options: QuizOptionResponse[];
}

/** Option response — no `isCorrect` field */
export interface QuizOptionResponse {
  id: string;
  order: number;
  text: string;
}

export const QuizAnswerRequest = z.object({
  questionId: z.string(),
  optionId: z.string(),
});
export type QuizAnswerRequest = z.infer<typeof QuizAnswerRequest>;

export interface QuizAnswerResponse {
  isCorrect: boolean;
  correctOptionId: string;
  explanation: string | null;
  xpAwarded: number;
}

// ─── Account Settings Schemas (§12) ─────────────────────────

export const UpdateSettingsRequest = z.object({
  isPrivate: z.boolean().optional(),
  theme: z.enum(['dark', 'light', 'system']).optional(),
  language: z.string().optional(),
  allowDmsFrom: z.enum(['everyone', 'followers', 'none']).optional(),
  allowCommentsFrom: z.enum(['everyone', 'followers', 'none']).optional(),
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  quietHoursStart: z.number().min(0).max(23).nullable().optional(),
  quietHoursEnd: z.number().min(0).max(23).nullable().optional(),
});
export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsRequest>;

// ─── Session Schemas (§7) ───────────────────────────────────

export interface SessionResponse {
  id: string;
  device: string | null;
  ip: string | null;
  userAgent: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

// ─── Gamification Schemas (§14) ─────────────────────────────

export interface XpResponse {
  total: number;
  recentEvents: Array<{
    id: string;
    amount: number;
    kind: string;
    createdAt: string;
  }>;
}

export interface StreakResponse {
  current: number;
  longest: number;
  lastActiveDate: string | null;
}

// ─── Health Check ────────────────────────────────────────────

export const HealthResponse = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  version: z.string(),
  uptime: z.number(),
  timestamp: z.string(),
  services: z.record(z.enum(['up', 'down'])),
});
export type HealthResponse = z.infer<typeof HealthResponse>;
