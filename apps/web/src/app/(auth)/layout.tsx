import LumiMascot from '@/components/LumiMascot';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-10"
          style={{
            background: 'radial-gradient(circle, #2dd4bf, transparent)',
            top: '-10%',
            left: '-10%',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-10"
          style={{
            background: 'radial-gradient(circle, #3b82f6, transparent)',
            top: '30%',
            right: '-5%',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-10"
          style={{
            background: 'radial-gradient(circle, #9333ea, transparent)',
            bottom: '-10%',
            left: '20%',
          }}
        />
      </div>

      {/* Logo + Lumi */}
      <div className="flex flex-col items-center mb-8 animate-slide-up">
        <LumiMascot size={80} mood="happy" />
        <Link href="/" className="mt-2">
          <span className="text-2xl font-black lx-gradient-text tracking-tight">Learnix</span>
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-[400px] lx-card p-8 animate-slide-up relative z-10"
        style={{ animationDelay: '0.1s' }}
      >
        {children}
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-[var(--text-dim)] text-center animate-fade-in">
        By signing in you agree to our{' '}
        <Link href="/legal/terms" className="underline underline-offset-2 hover:text-[var(--text-muted)]">
          Terms
        </Link>{' '}
        &amp;{' '}
        <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-[var(--text-muted)]">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
