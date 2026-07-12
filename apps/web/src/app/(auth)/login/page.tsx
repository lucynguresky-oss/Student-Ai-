'use client';
import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

const DEMO_ACCOUNTS = [
  { username: 'amara.otieno', label: 'Amara Otieno (Student Form 4)', desc: 'KCSE Biology, Chemistry, Maths, English' },
  { username: 'brian.codes', label: 'Brian Codes (Student Form 3)', desc: 'KCSE Physics, Maths, English' },
  { username: 'sci.with.sam', label: 'Sam Teacher (Teacher)', desc: 'KCSE Biology, Chemistry educator' },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addAccount = useAuthStore((state) => state.addAccount);

  const performLogin = async (idVal: string, passVal: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Authenticate with backend
      const loginRes = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: idVal, password: passVal }),
      });

      const tokens = loginRes.data;

      // Temporary override the access token in local storage so subsequent /auth/me call is authorized
      localStorage.setItem('learnix_access_token', tokens.accessToken);
      localStorage.setItem('learnix_refresh_token', tokens.refreshToken);

      // 2. Fetch full user profile details
      const meRes = await apiFetch('/auth/me');
      const me = meRes.data;

      // 3. Save to Zustand store
      addAccount({
        id: me.id,
        username: me.profile?.username || '',
        displayName: me.profile?.displayName || '',
        email: me.email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        avatarUrl: me.profile?.avatarUrl,
      });

      // 4. Redirect to feed
      window.location.href = '/feed';
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(identifier, password);
  };

  const handleDemoClick = (username: string) => {
    setIdentifier(username);
    setPassword('Learnix@2026!');
    performLogin(username, 'Learnix@2026!');
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' }}>
      {/* Logo */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px', fontWeight: 900, color: 'white', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>LX</div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Learnix</h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '4px' }}>Learn together. Grow together.</p>
      </div>

      <div className="auth-card" style={{ width: '100%', maxWidth: '380px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', fontSize: '13px', fontWeight: 500 }}>
              {error}
            </div>
          )}
          <input className="input-field" type="text" placeholder="Email, phone or username" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
          <input className="input-field" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '4px' }}>
            {loading ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0', color: 'var(--text3)', fontSize: '13px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          OR
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* OAuth Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <a href="http://localhost:4000/api/auth/google" className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text)' }}>
            <img src="https://authjs.dev/img/providers/google.svg" alt="Google" style={{ width: '18px' }} />
            Google
          </a>
          <a href="http://localhost:4000/api/auth/github" className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text)' }}>
            <img src="https://authjs.dev/img/providers/github.svg" alt="GitHub" style={{ width: '18px', filter: 'invert(1)' }} />
            GitHub
          </a>
        </div>

        {/* Demo Accounts Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Quick Demo Access</p>
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.username}
              onClick={() => handleDemoClick(acc.username)}
              disabled={loading}
              type="button"
              className="btn-outline"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 14px', height: 'auto', gap: '2px', textAlign: 'left' }}
            >
              <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--blue)' }}>@{acc.username}</span>
              <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 500 }}>{acc.label}</span>
              <span style={{ fontSize: '9px', color: 'var(--text3)' }}>{acc.desc}</span>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <a href="#" style={{ color: 'var(--blue)', fontSize: '13px', fontWeight: 500 }}>Forgot password?</a>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '20px 24px', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center', width: '100%', maxWidth: '380px', fontSize: '14px', color: 'var(--text2)' }}>
        Don't have an account?{' '}
        <Link href="/register" style={{ color: 'var(--blue)', fontWeight: 700 }}>Sign up</Link>
      </div>
    </div>
  );
}
