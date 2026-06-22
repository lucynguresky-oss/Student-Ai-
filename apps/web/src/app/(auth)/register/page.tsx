'use client';

import { useState } from 'react';
import Link from 'next/link';

import { apiFetch } from '@/lib/api';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const displayName = formData.get('displayName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    // Derive a simple username from display name for now
    const username = displayName.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);

    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ displayName, email, username, password }),
      });
      // Registration successful, log them in or redirect to login
      const tokens = res.data;
      localStorage.setItem('learnix_access_token', tokens.accessToken);
      localStorage.setItem('learnix_refresh_token', tokens.refreshToken);
      window.location.href = '/feed';
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
        Create an account
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        Join thousands of students learning smarter
      </p>

      {/* OAuth Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
        <a href="http://localhost:4000/api/auth/google" className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text)', border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: '0.5rem' }}>
          <img src="https://authjs.dev/img/providers/google.svg" alt="Google" style={{ width: '18px' }} />
          Google
        </a>
        <a href="http://localhost:4000/api/auth/github" className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text)', border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: '0.5rem' }}>
          <img src="https://authjs.dev/img/providers/github.svg" alt="GitHub" style={{ width: '18px', filter: 'invert(1)' }} />
          GitHub
        </a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 1.5rem 0', color: 'var(--text3)', fontSize: '13px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        OR
        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', fontSize: '13px', fontWeight: 500 }}>
            {error}
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            Full Name
          </label>
          <input
            type="text"
            name="displayName"
            className="glass"
            style={{
              width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
              border: '1px solid var(--color-border)', color: 'white',
              background: 'rgba(255,255,255,0.05)', outline: 'none'
            }}
            placeholder="Amina Wanjiku"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            Email
          </label>
          <input
            type="email"
            name="email"
            className="glass"
            style={{
              width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
              border: '1px solid var(--color-border)', color: 'white',
              background: 'rgba(255,255,255,0.05)', outline: 'none'
            }}
            placeholder="amina@example.com"
            required
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            Password
          </label>
          <input
            type="password"
            name="password"
            className="glass"
            style={{
              width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
              border: '1px solid var(--color-border)', color: 'white',
              background: 'rgba(255,255,255,0.05)', outline: 'none'
            }}
            placeholder="••••••••"
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', fontWeight: 600 }}
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--color-primary-teal)', fontWeight: 600 }}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
