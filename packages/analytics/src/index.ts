/**
 * @learnix/analytics — Unified analytics wrapper
 * PostHog integration will be added in Phase 0 completion.
 */

type EventPayload = Record<string, unknown>;

export const analytics = {
  track(event: string, payload?: EventPayload) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${event}`, payload);
    }
    // TODO: PostHog integration
  },

  identify(userId: string, traits?: EventPayload) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Identify: ${userId}`, traits);
    }
  },

  page(name: string, properties?: EventPayload) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Page: ${name}`, properties);
    }
  },
};
