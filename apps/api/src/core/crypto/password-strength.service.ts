import { Injectable } from '@nestjs/common';
import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import { adjacencyGraphs, dictionary } from '@zxcvbn-ts/language-common';

// Instantiate the zxcvbn factory with options
const zxcvbn = new ZxcvbnFactory({
  graphs: adjacencyGraphs,
  dictionary: {
    ...dictionary,
    userInputs: [],
  },
});

// A representative slice of the classic top-10k list.
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
    if (pw.length < 8) {
      return { score: 0, ok: false, reason: 'Password must be at least 8 characters' };
    }
    if (COMMON.has(pw.toLowerCase())) {
      return { score: 0, ok: false, reason: 'This password is too common' };
    }

    const result = zxcvbn.check(pw);
    if (result.score < 2) {
      const reason = result.feedback.warning || result.feedback.suggestions?.[0] || 'Please choose a stronger password';
      return { score: result.score, ok: false, reason };
    }

    return { score: result.score, ok: true };
  }
}
