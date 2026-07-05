/**
 * Global phone normalization to E.164 using Google's libphonenumber (via libphonenumber-js).
 *
 * Learnix is worldwide (not Kenya-only), so we do NOT hardcode a country. The canonical input
 * is any parseable phone string:
 *   - E.164 / international ("+254712345678", "+14155552671", "+442079460958") parses directly.
 *   - A national number ("0712345678", "020 7946 0958") parses only when a `defaultCountry`
 *     (ISO alpha-2) is supplied — the frontend PhoneInput passes the selected country.
 *
 * We return E.164 plus the detected country and whether the line is mobile (useful because OTP
 * SMS only reaches mobile numbers).
 */
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export interface NormalizePhoneResult {
  ok: boolean;
  e164?: string;
  country?: string; // ISO alpha-2, when derivable
  isMobile?: boolean;
  reason?: string;
}

export function normalizePhone(raw: string, defaultCountry?: string): NormalizePhoneResult {
  if (!raw || !raw.trim()) return { ok: false, reason: 'empty' };
  try {
    const parsed = parsePhoneNumberFromString(
      raw.trim(),
      defaultCountry ? (defaultCountry.toUpperCase() as CountryCode) : undefined,
    );
    if (!parsed || !parsed.isValid()) return { ok: false, reason: 'invalid' };
    const type = parsed.getType();
    return {
      ok: true,
      e164: parsed.number,
      country: parsed.country,
      isMobile: type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE',
    };
  } catch {
    return { ok: false, reason: 'parse_error' };
  }
}

/**
 * Backward-compatible Kenya helper — thin wrapper that defaults the region to KE so a bare
 * local number like "0712345678" still normalizes. Prefer normalizePhone(raw, country) with
 * the user's selected country elsewhere.
 */
export function normalizeKenyanPhone(raw: string): NormalizePhoneResult {
  // Accept both bare-local (needs KE context) and already-international inputs.
  const asIntl = normalizePhone(raw);
  if (asIntl.ok) return asIntl;
  return normalizePhone(raw, 'KE');
}

/** Structural E.164 guard for already-normalized values. */
export function isE164(s: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(s);
}
