import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import type { AbstractIntlMessages } from 'next-intl';

// Languages with complete UI bundles
export const SHIPPED_UI_LANGUAGES = ['en', 'sw'] as const;
export type ShippedLocale = (typeof SHIPPED_UI_LANGUAGES)[number];

export default getRequestConfig(async () => {
  // Read locale preference from cookie (set during onboarding)
  const cookieStore = await cookies();
  const raw = cookieStore.get('lx_locale')?.value ?? 'en';

  // Fall back to English if we don't have a translation bundle
  const locale = (SHIPPED_UI_LANGUAGES as readonly string[]).includes(raw) ? raw : 'en';

  let messages: AbstractIntlMessages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default as AbstractIntlMessages;
  } catch {
    messages = (await import('../messages/en.json')).default as AbstractIntlMessages;
  }

  return { locale, messages };
});
