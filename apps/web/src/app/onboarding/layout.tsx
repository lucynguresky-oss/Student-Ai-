import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Set up your account',
  description: 'Personalize your Learnix learning experience in just 2 minutes.',
  robots: { index: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
