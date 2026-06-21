import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import { StoreProvider } from '@/store/useStore';
import { I18nProvider } from '@/lib/i18n';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta', display: 'swap' });

// Arabic script subset for ar locale
const notoArabic = Inter({ subsets: ['latin'], variable: '--font-arabic', display: 'swap' });

export const metadata: Metadata = {
  title: 'Learnix — Social Learning',
  description: 'The social learning platform for students around the world. Learn, share, and grow together.',
  themeColor: '#000000',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Learnix',
    description: 'Social Learning Platform',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read locale from cookie for SSR — set by the i18n provider on locale change.
  // Falls back to 'en' if not set yet (first visit).
  const cookieStore = await cookies();
  const initialLocale = cookieStore.get('learnix_locale')?.value ?? 'en';

  // RTL locales need dir="rtl" on <html> at SSR time to avoid layout flash.
  const rtlLocales = new Set(['ar', 'he', 'fa', 'ur', 'ps']);
  const initialDir = rtlLocales.has(initialLocale) ? 'rtl' : 'ltr';

  return (
    <html
      lang={initialLocale}
      dir={initialDir}
      className={`${inter.variable} ${plusJakarta.variable}`}
    >
      <body>
        <StoreProvider>
          <I18nProvider initialLocale={initialLocale}>
            <div className="app-shell">
              {children}
            </div>
          </I18nProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
