import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${plusJakarta.variable}`}
    >
      <body>
        <StoreProvider>
          <I18nProvider>
            <div className="app-shell">
              {children}
            </div>
          </I18nProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
