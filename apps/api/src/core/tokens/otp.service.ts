import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { CryptoService } from '../crypto/crypto.service';

export type OtpPurpose =
  | 'VERIFY_EMAIL'
  | 'VERIFY_PHONE'
  | 'RESET_PASSWORD'
  | 'LOGIN_OTP'
  | 'TWO_FACTOR'
  | 'REGISTER_PHONE'
  | 'CHANGE_EMAIL'
  | 'CHANGE_PHONE';

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'OTP_INVALID' | 'OTP_EXPIRED' | 'OTP_LOCKED' };

const TTL_SECONDS = 10 * 60; // 10-min validity (§9.1)
const MAX_ATTEMPTS = 5; // then lock (§9.1)
const LOCK_SECONDS = 15 * 60; // 15-min lock (§9.1)

interface OtpRecord {
  codeHash: string;
  attempts: number;
  createdAt: number;
}

/**
 * OtpService — OTP codes live in Redis ONLY (§4), hashed, constant-time compared (§9.1).
 * Being Redis-backed means the 5-attempt lock is enforced correctly across all API instances.
 */
@Injectable()
export class OtpService {
  constructor(
    private readonly redis: RedisService,
    private readonly crypto: CryptoService,
  ) {}

  private key(purpose: OtpPurpose, identifier: string): string {
    return `otp:${purpose}:${identifier}`;
  }
  private lockKey(purpose: OtpPurpose, identifier: string): string {
    return `otp:lock:${purpose}:${identifier}`;
  }

  /** Generate + store a code. Returns the plaintext so the caller can dispatch it via SMS/email. */
  async issue(purpose: OtpPurpose, identifier: string): Promise<string> {
    const code = this.crypto.randomOtp();
    const record: OtpRecord = {
      codeHash: this.crypto.sha256(code),
      attempts: 0,
      createdAt: Date.now(),
    };
    await this.redis.client.set(this.key(purpose, identifier), JSON.stringify(record), 'EX', TTL_SECONDS);
    return code;
  }

  async verify(purpose: OtpPurpose, identifier: string, code: string): Promise<OtpVerifyResult> {
    // Locked?
    if (await this.redis.client.exists(this.lockKey(purpose, identifier))) {
      return { ok: false, reason: 'OTP_LOCKED' };
    }

    const raw = await this.redis.client.get(this.key(purpose, identifier));
    if (!raw) return { ok: false, reason: 'OTP_EXPIRED' };

    const record = JSON.parse(raw) as OtpRecord;
    const matches = this.crypto.constantTimeEquals(record.codeHash, this.crypto.sha256(code));

    if (matches) {
      await this.redis.client.del(this.key(purpose, identifier)); // single-use
      return { ok: true };
    }

    // Wrong code → increment attempts; lock on the MAX_ATTEMPTS-th failure.
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) {
      await this.redis.client.del(this.key(purpose, identifier));
      await this.redis.client.set(this.lockKey(purpose, identifier), '1', 'EX', LOCK_SECONDS);
      return { ok: false, reason: 'OTP_LOCKED' };
    }
    // Persist attempt count without extending TTL.
    const ttl = await this.redis.client.ttl(this.key(purpose, identifier));
    await this.redis.client.set(
      this.key(purpose, identifier),
      JSON.stringify(record),
      'EX',
      ttl > 0 ? ttl : TTL_SECONDS,
    );
    return { ok: false, reason: 'OTP_INVALID' };
  }

  /** Test/support helper — clears any lock. Not exposed via HTTP. */
  async clearLock(purpose: OtpPurpose, identifier: string): Promise<void> {
    await this.redis.client.del(this.lockKey(purpose, identifier));
  }
}
