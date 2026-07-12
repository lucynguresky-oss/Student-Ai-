'use client';

/**
 * Learnix i18n Provider & Hook — Addendum G
 *
 * Architecture:
 *  - Locale bundles are lazy-loaded on first use (no bundle bloat for unused locales).
 *  - Falls back to 'en' for any missing key, ensuring nothing breaks for draft locales.
 *  - Sets document.documentElement.lang and dir on every locale change (RTL support).
 *  - Persists the selected locale to localStorage AND calls the API to update User.locale.
 *
 * Usage:
 *   const { t, locale, setLocale, dir } = useI18n();
 *   t('onboarding.continueBtn')          // → 'Continue' / 'Endelea' / etc.
 *   t('onboarding.step', { current: 2, total: 9 })  // supports {param} interpolation
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { LocaleBundle } from './locales/en';

// ─── Lazy bundle loader ────────────────────────────────────────
// Add new locales here. The import() ensures each bundle is only
// downloaded when first needed (Next.js dynamic import compatible).
const BUNDLE_LOADERS: Record<string, () => Promise<{ default: LocaleBundle }>> = {
  en:        () => import('./locales/en'),
  'en-GB':   () => import('./locales/en'),   // reuse en until en-GB diverges
  'en-KE':   () => import('./locales/en'),   // reuse en until en-KE diverges
  sw:        () => import('./locales/sw'),
  fr:        () => import('./locales/fr'),
  ar:        () => import('./locales/ar'),
  // Tier 2 — add when bundles are reviewed:
  // hi:     () => import('./locales/hi'),
  // es:     () => import('./locales/es'),
  // de:     () => import('./locales/de'),
  // pt-BR:  () => import('./locales/pt-BR'),
};

// RTL locales — drives document dir attribute and CSS logical props
const RTL_CODES = new Set(['ar', 'ar-SA', 'ar-EG', 'he', 'fa', 'ur', 'ps', 'ku']);

// ─── Cache ────────────────────────────────────────────────────
const bundleCache: Record<string, LocaleBundle> = {};
let enBundle: LocaleBundle | null = null;

async function loadBundle(locale: string): Promise<LocaleBundle> {
  if (bundleCache[locale]) return bundleCache[locale]!;
  const loader = BUNDLE_LOADERS[locale] ?? BUNDLE_LOADERS['en']!;
  const mod = await loader();
  bundleCache[locale] = mod.default;
  return mod.default;
}

async function ensureEn(): Promise<LocaleBundle> {
  if (enBundle) return enBundle;
  const mod = await import('./locales/en');
  enBundle = mod.default;
  return enBundle;
}

// ─── Deep-get a key like 'onboarding.continueBtn' ────────────
function deepGet(obj: Record<string, any>, key: string): string | undefined {
  const parts = key.split('.');
  let curr: any = obj;
  for (const p of parts) {
    if (curr == null || typeof curr !== 'object') return undefined;
    curr = curr[p];
  }
  return typeof curr === 'string' ? curr : undefined;
}

// ─── Interpolation: replace {param} with actual values ────────
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

// ─── Context shape ────────────────────────────────────────────
interface I18nContextValue {
  locale: string;
  dir: 'ltr' | 'rtl';
  setLocale: (code: string) => void;
  /** Translate a key, with optional interpolation params */
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────
interface I18nProviderProps {
  children: ReactNode;
  /**
   * Initial locale — pass from server component (cookie/header) for SSR accuracy.
   * Falls back to localStorage, then 'en'.
   */
  initialLocale?: string;
  /**
   * Optional: called after locale changes so the parent can persist to the API.
   * Keep this optional so the provider works on unauthenticated pages too.
   */
  onLocaleChange?: (code: string) => Promise<void>;
}

export function I18nProvider({ children, initialLocale, onLocaleChange }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<string>(() => {
    // Priority: prop > localStorage > 'en'
    if (initialLocale) return initialLocale;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('learnix_locale') ?? 'en';
    }
    return 'en';
  });

  const [bundle, setBundle] = useState<LocaleBundle | null>(null);
  const [fallback, setFallback] = useState<LocaleBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load bundle whenever locale changes
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      const [b, fb] = await Promise.all([loadBundle(locale), ensureEn()]);
      if (!cancelled) {
        setBundle(b);
        setFallback(fb);
        setIsLoading(false);

        // Apply HTML attributes
        const dir = RTL_CODES.has(locale) ? 'rtl' : 'ltr';
        document.documentElement.lang = locale;
        document.documentElement.dir = dir;
      }
    })();

    return () => { cancelled = true; };
  }, [locale]);

  const setLocale = useCallback((code: string) => {
    setLocaleState(code);
    localStorage.setItem('learnix_locale', code);
    onLocaleChange?.(code).catch(console.error);
  }, [onLocaleChange]);

  const dir = RTL_CODES.has(locale) ? 'rtl' : 'ltr';

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    if (!bundle && !fallback) return key; // pre-hydration: return the key itself
    const raw =
      (bundle ? deepGet(bundle as any, key) : undefined) ??
      (fallback ? deepGet(fallback as any, key) : undefined) ??
      key;
    return interpolate(raw, params);
  }, [bundle, fallback]);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, dir, setLocale, t, isLoading }),
    [locale, dir, setLocale, t, isLoading],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

// ─── RTL utility ─────────────────────────────────────────────
export function isRtlLocale(locale: string): boolean {
  return RTL_CODES.has(locale);
}

// ─── Detect browser locale and return the best match ─────────
export function detectBrowserLocale(supported: string[]): string {
  if (typeof navigator === 'undefined') return 'en';
  const preferred = navigator.languages ?? [navigator.language];
  for (const lang of preferred) {
    // Exact match
    if (supported.includes(lang)) return lang;
    // Base language match (e.g. 'sw-KE' → 'sw')
    const base = lang.split('-')[0]!;
    if (supported.includes(base)) return base;
  }
  return 'en';
}
