import { Injectable, Logger } from '@nestjs/common';

/**
 * AnalyticsService (§11). Thin emitter → structured console log in dev; a provider adapter
 * (Segment/PostHog/etc.) plugs in later behind the same `track()` call.
 *
 * Contract: every event carries actor (userId or guest id), sessionId, platform, appVersion.
 * NO PII in payloads — never pass raw email/phone (§11). Callers pass method/counts only.
 */
export interface AnalyticsContext {
  userId?: string;
  guestId?: string;
  sessionId?: string;
  platform?: string; // web | android | ios
  appVersion?: string;
}

export type AnalyticsEvent =
  | 'onboarding_started'
  | 'onboarding_step_viewed'
  | 'onboarding_step_completed'
  | 'onboarding_step_skipped'
  | 'placement_started'
  | 'placement_submitted'
  | 'signup_wall_viewed'
  | 'signup_started'
  | 'signup_completed'
  | 'guest_created'
  | 'guest_converted'
  | 'onboarding_completed'
  | 'login_success'
  | 'login_failed'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'session_revoked'
  | 'account_deactivated'
  | 'deletion_requested'
  | 'deletion_cancelled'
  | 'username_changed'
  | 'avatar_uploaded';

// Fields that must never appear in analytics payloads.
const PII_KEYS = new Set(['email', 'phone', 'password', 'otp', 'token']);

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger('Analytics');

  track(event: AnalyticsEvent, ctx: AnalyticsContext, props: Record<string, unknown> = {}): void {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(props)) {
      if (!PII_KEYS.has(k)) clean[k] = v;
    }
    const payload = {
      event,
      actor: ctx.userId ?? ctx.guestId ?? 'anonymous',
      sessionId: ctx.sessionId,
      platform: ctx.platform ?? 'web',
      appVersion: ctx.appVersion ?? 'dev',
      ts: new Date().toISOString(),
      ...clean,
    };
    this.logger.log(JSON.stringify(payload));
    // Prod: enqueue to an analytics sink (buffered/batched) — see docs/SCALE.md.
  }
}
