import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Learnix — Learn Anything, Anywhere', template: '%s | Learnix' },
  description:
    'Learnix is a global education platform combining social learning with gamified lessons. Learn with Lumi — your personal AI guide.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL ?? 'https://learnix.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://learnix.app',
    siteName: 'Learnix',
    title: 'Learnix — Learn Anything, Anywhere',
    description: 'Instagram-style social layer + Duolingo-style gamified learning for a worldwide audience.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learnix — Learn Anything, Anywhere',
    description: 'Learn with Lumi — your personal AI guide.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  // Determine RTL from locale
  const rtlLocales = ['ar', 'he', 'fa', 'ur', 'yi', 'dv', 'ku'];
  const dir = rtlLocales.includes(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="noise-overlay">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
