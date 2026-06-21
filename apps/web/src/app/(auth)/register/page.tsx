'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Connect to backend API
    setTimeout(() => {
      window.location.href = '/feed';
    }, 1000);
  };

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
        Create an account
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '2rem' }}>
        Join thousands of students learning smarter
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            Full Name
          </label>
          <input
            type="text"
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
