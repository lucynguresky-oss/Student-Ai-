import { normalizePhone, normalizeKenyanPhone, isE164 } from './phone';
import { usernameSchema, phoneSchema } from './auth.schemas';
import { isReservedUsername } from './reserved-usernames';
import { scoreToLevel, nextStep, SKIPPABLE_STEPS } from './onboarding.schemas';
import {
  isValidCountry,
  isValidLanguage,
  isRtlLanguage,
  languagesForCountry,
  defaultUiLanguageForCountry,
  COUNTRIES,
  LANGUAGES,
} from './geo';

describe('normalizePhone (global)', () => {
  it.each([
    ['+254712345678', 'KE'],
    ['+14155552671', 'US'],
    ['+442079460958', 'GB'],
    ['+819012345678', 'JP'],
    ['+919876543210', 'IN'],
    ['+61412345678', 'AU'],
    ['+4915112345678', 'DE'],
  ])('parses international %s (country %s)', (input, country) => {
    const r = normalizePhone(input);
    expect(r.ok).toBe(true);
    expect(r.e164).toBe(input);
    expect(r.country).toBe(country);
  });

  it('parses a national number when given the country', () => {
    expect(normalizePhone('020 7946 0958', 'GB').e164).toBe('+442079460958');
    expect(normalizePhone('(415) 555-2671', 'US').e164).toBe('+14155552671');
    expect(normalizePhone('0712345678', 'KE').e164).toBe('+254712345678');
  });

  it('rejects invalid / unparseable input', () => {
    expect(normalizePhone('').ok).toBe(false);
    expect(normalizePhone('12345').ok).toBe(false);
    expect(normalizePhone('not a phone').ok).toBe(false);
  });

  it('detects mobile lines when the numbering plan allows (best-effort, for OTP SMS)', () => {
    // libphonenumber can classify line type where the national plan separates ranges.
    expect(normalizePhone('+447911123456').isMobile).toBe(true); // UK mobile
    // Where ranges overlap (e.g. NANP), it returns FIXED_LINE_OR_MOBILE → still treated as mobile.
    expect(normalizePhone('+14155552671').isMobile).toBe(true);
  });
});

describe('normalizeKenyanPhone (backward-compat wrapper)', () => {
  const CANON = '+254712345678';
  it.each(['0712345678', '+254712345678', '254712345678', '0712 345 678'])(
    'normalizes %s to E.164',
    (input) => {
      expect(normalizeKenyanPhone(input).e164).toBe(CANON);
    },
  );
  it('proves 0712345678 and +254712345678 resolve identically (AC §13)', () => {
    expect(normalizeKenyanPhone('0712345678').e164).toBe(normalizeKenyanPhone('+254712345678').e164);
  });
});

describe('isE164', () => {
  it('accepts valid E.164', () => expect(isE164('+254712345678')).toBe(true));
  it('rejects local format', () => expect(isE164('0712345678')).toBe(false));
});

describe('phoneSchema (zod transform)', () => {
  it('outputs E.164 for international input', () => {
    expect(phoneSchema.parse('+14155552671')).toBe('+14155552671');
  });
  it('outputs E.164 for Kenyan local input (KE fallback)', () => {
    expect(phoneSchema.parse('0712345678')).toBe('+254712345678');
  });
  it('throws on invalid', () => {
    expect(() => phoneSchema.parse('123')).toThrow();
  });
});

describe('geo dataset (global)', () => {
  it('covers the whole world', () => {
    expect(COUNTRIES.length).toBeGreaterThan(240);
    expect(LANGUAGES.length).toBeGreaterThan(180);
  });
  it('validates ISO country codes', () => {
    expect(isValidCountry('KE')).toBe(true);
    expect(isValidCountry('us')).toBe(true); // case-insensitive
    expect(isValidCountry('ZZ')).toBe(false);
  });
  it('validates ISO language codes', () => {
    expect(isValidLanguage('en')).toBe(true);
    expect(isValidLanguage('sw')).toBe(true);
    expect(isValidLanguage('zz')).toBe(false);
  });
  it('flags RTL languages', () => {
    expect(isRtlLanguage('ar')).toBe(true);
    expect(isRtlLanguage('he')).toBe(true);
    expect(isRtlLanguage('en')).toBe(false);
  });
  it('lists languages spoken in a country', () => {
    const ke = languagesForCountry('KE').map((l) => l.code);
    expect(ke).toEqual(expect.arrayContaining(['en', 'sw']));
  });
  it('picks a sensible default UI language per country', () => {
    expect(defaultUiLanguageForCountry('KE')).toBe('en'); // shipped bundle
    expect(defaultUiLanguageForCountry('FR')).toBe('en'); // French UI not shipped yet → fallback
  });
});

describe('usernameSchema', () => {
  it('lowercases and accepts valid handles', () => {
    expect(usernameSchema.parse('Amina.Learns_01')).toBe('amina.learns_01');
  });
  it.each([
    ['ab', 'too short'],
    ['.leading', 'leading dot'],
    ['trailing.', 'trailing dot'],
    ['double..dot', 'consecutive dots'],
    ['has space', 'space'],
    ['bad!char', 'symbol'],
    ['admin', 'reserved'],
    ['learnix', 'reserved brand'],
  ])('rejects %s (%s)', (input) => {
    expect(() => usernameSchema.parse(input)).toThrow();
  });
});

describe('isReservedUsername', () => {
  it('is case-insensitive', () => {
    expect(isReservedUsername('ADMIN')).toBe(true);
    expect(isReservedUsername('Lumi')).toBe(true);
    expect(isReservedUsername('amina')).toBe(false);
  });
});

describe('scoreToLevel (§5.6 mapping)', () => {
  it.each([
    [0, 'BEGINNER'],
    [39, 'BEGINNER'],
    [40, 'INTERMEDIATE'],
    [74, 'INTERMEDIATE'],
    [75, 'CONFIDENT'],
    [80, 'CONFIDENT'],
    [100, 'CONFIDENT'],
  ])('score %i → %s', (score, level) => {
    expect(scoreToLevel(score)).toBe(level);
  });
});

describe('onboarding step machine', () => {
  it('advances welcome → tracks → motivation', () => {
    expect(nextStep('welcome')).toBe('tracks');
    expect(nextStep('tracks')).toBe('motivation');
  });
  it('returns null after the last step', () => {
    expect(nextStep('plan_reveal')).toBeNull();
  });
  it('marks reminder and referral skippable', () => {
    expect(SKIPPABLE_STEPS.has('reminder')).toBe(true);
    expect(SKIPPABLE_STEPS.has('referral')).toBe(true);
    expect(SKIPPABLE_STEPS.has('age_band')).toBe(false);
  });
});
