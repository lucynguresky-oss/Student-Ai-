import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { ConfigService } from '../config/config.service';

/**
 * CryptoService — all secret-handling primitives in one place (§9.1).
 *
 *  - Passwords: argon2id (64MB / t=3 / p=4) + server pepper appended before hashing.
 *  - TOTP secrets: AES-256-GCM at rest (§4 TwoFactor.totpSecretEnc).
 *  - Opaque tokens (refresh, verification) hashed with SHA-256 for storage/lookup.
 *  - Constant-time compare for OTP/backup-code checks.
 *
 * Nothing here logs its inputs.
 */
@Injectable()
export class CryptoService {
  private readonly encKey: Buffer;

  constructor(private readonly config: ConfigService) {
    // 32-byte key for AES-256. Accept base64 or hex; pad/validate length.
    const raw = config.env.TWO_FACTOR_ENC_KEY;
    let key = Buffer.from(raw, 'base64');
    if (key.length !== 32) key = createHash('sha256').update(raw).digest(); // derive if not exactly 32 bytes
    this.encKey = key;
  }

  private pepper(pw: string): string {
    return pw + this.config.env.PASSWORD_PEPPER;
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(this.pepper(password), {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  }

  async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, this.pepper(password));
    } catch {
      return false;
    }
  }

  /** SHA-256 hex of an opaque token (refresh tokens, verification tokens). */
  sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  /** URL-safe random opaque token. bytes=32 → 256-bit refresh token (§5.1). */
  randomToken(bytes = 32): string {
    return randomBytes(bytes).toString('base64url');
  }

  /** 6-digit numeric OTP as a zero-padded string. */
  randomOtp(): string {
    const n = randomBytes(4).readUInt32BE(0) % 1_000_000;
    return n.toString().padStart(6, '0');
  }

  constantTimeEquals(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  }

  // ---------- AES-256-GCM for TOTP secrets ----------
  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encKey, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // iv.tag.ciphertext, all base64url
    return `${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`;
  }

  decrypt(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split('.');
    if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed ciphertext');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.encKey,
      Buffer.from(ivB64, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64url')),
      decipher.final(),
    ]);
    return dec.toString('utf8');
  }
}
