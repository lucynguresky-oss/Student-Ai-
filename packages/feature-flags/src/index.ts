/**
 * @learnix/feature-flags — Typed feature flag wrapper
 * PostHog feature flags will be integrated later.
 */

export type FeatureFlag =
  | 'ai_tutor_enabled'
  | 'video_clips_enabled'
  | 'past_papers_enabled'
  | 'library_enabled'
  | 'payments_enabled'
  | 'social_features_enabled'
  | 'doomscroll_guardrail'
  | 'bm25_weight';

const defaultFlags: Record<FeatureFlag, boolean> = {
  ai_tutor_enabled: true,
  video_clips_enabled: true,
  past_papers_enabled: true,
  library_enabled: true,
  payments_enabled: false,
  social_features_enabled: true,
  doomscroll_guardrail: true,
  bm25_weight: true,
};

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // TODO: PostHog integration
  return defaultFlags[flag] ?? false;
}

export function getFeatureFlags(): Record<FeatureFlag, boolean> {
  return { ...defaultFlags };
}
