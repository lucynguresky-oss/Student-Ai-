import { Injectable } from '@nestjs/common';

/**
 * Password strength gate (§9.1): zxcvbn score ≥ 2 and block a top-N common-password list.
 *
 * We avoid a heavy zxcvbn dependency in this reference by shipping a compact,
 * deterministic estimator with the same *contract* (score 0–4, reject < 2) plus an
 * embedded common-password set. Antigravity should swap the estimator for the real
 * `@zxcvbn-ts/core` package in production (see docs/ANTIGRAVITY_BUILD_PROMPT.md) — the
 * interface (`evaluate → {score, ok, reason}`) stays identical so nothing else changes.
 */

// A representative slice of the classic top-10k list. Prod loads the full list from a file.
const COMMON = new Set<string>([
  'password', 'password1', 'passw0rd', '12345678', '123456789', '1234567890',
  'qwerty', 'qwerty123', 'abc123', 'iloveyou', 'admin', 'welcome', 'letmein',
  'monkey', 'dragon', 'football', 'baseball', 'sunshine', 'princess', 'starwars',
  'whatever', 'trustno1', '000000', '111111', '123123', 'superman', 'batman',
  'learnix', 'lumi', 'kenya', 'nairobi', 'safaricom', 'mpesa',
]);

export interface StrengthResult {
  score: number; // 0..4
  ok: boolean;
  reason?: string;
}

@Injectable()
export class PasswordStrengthService {
  evaluate(password: string): StrengthResult {
    const pw = password ?? '';
    if (pw.length < 8) return { score: 0, ok: false, reason: 'Password must be at least 8 characters' };
    if (COMMON.has(pw.toLowerCase())) return { score: 0, ok: false, reason: 'This password is too common' };

    let score = 0;
    const len = pw.length;
    if (len >= 8) score++;
    if (len >= 12) score++;

    const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
    if (classes >= 2) score++;
    if (classes >= 3) score++;

    // Penalize obvious sequences / repeats.
    if (/(.)\1{3,}/.test(pw) || /(0123|1234|2345|3456|4567|5678|6789|abcd|qwer)/i.test(pw)) {
      score = Math.max(0, score - 2);
    }

    score = Math.min(4, score);
    if (score < 2) return { score, ok: false, reason: 'Please choose a stronger password' };
    return { score, ok: true };
  }
}
