import { COUNTRIES, LANGUAGES, type CountryInfo, type LanguageInfo } from './geo.data';

export { COUNTRIES, LANGUAGES };
export type { CountryInfo, LanguageInfo };

const COUNTRY_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));
const LANGUAGE_BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

/**
 * UI languages that ship with a full translation bundle. Everything else is still a valid
 * *content/interface preference* but falls back to English for untranslated UI strings
 * (§8 "en complete, sw stubbed with English fallback" — generalized to a global set).
 *
 * Grow this set as translation bundles land. Antigravity: the app must not reject a user's
 * language choice just because the UI isn't translated yet — store the preference, fall back
 * gracefully, and light up strings as bundles ship.
 */
export const SHIPPED_UI_LANGUAGES = ['en', 'sw'] as const;
export type ShippedUiLanguage = (typeof SHIPPED_UI_LANGUAGES)[number];

export function isValidCountry(code: string): boolean {
  return COUNTRY_BY_CODE.has(code.toUpperCase());
}

export function getCountry(code: string): CountryInfo | undefined {
  return COUNTRY_BY_CODE.get(code.toUpperCase());
}

export function isValidLanguage(code: string): boolean {
  return LANGUAGE_BY_CODE.has(code.toLowerCase());
}

export function getLanguage(code: string): LanguageInfo | undefined {
  return LANGUAGE_BY_CODE.get(code.toLowerCase());
}

export function isRtlLanguage(code: string): boolean {
  return !!LANGUAGE_BY_CODE.get(code.toLowerCase())?.rtl;
}

/** Languages spoken/official in a country (ISO 639-1). Used to pre-select onboarding defaults. */
export function languagesForCountry(code: string): LanguageInfo[] {
  const c = COUNTRY_BY_CODE.get(code.toUpperCase());
  if (!c) return [];
  return c.languages.map((l) => LANGUAGE_BY_CODE.get(l)).filter((l): l is LanguageInfo => !!l);
}

/**
 * Best-guess default UI language for a country: the country's first spoken language if it
 * ships a UI bundle, else English. Keeps onboarding sensible worldwide without forcing a
 * language a user can't read the UI in yet.
 */
export function defaultUiLanguageForCountry(code: string): ShippedUiLanguage {
  const langs = COUNTRY_BY_CODE.get(code.toUpperCase())?.languages ?? [];
  const shipped = langs.find((l) => (SHIPPED_UI_LANGUAGES as readonly string[]).includes(l));
  return (shipped as ShippedUiLanguage) ?? 'en';
}

/** Countries grouped by continent — handy for building a grouped country picker. */
export function countriesByContinent(): Record<string, CountryInfo[]> {
  const out: Record<string, CountryInfo[]> = {};
  for (const c of COUNTRIES) (out[c.continentName] ??= []).push(c);
  return out;
}
