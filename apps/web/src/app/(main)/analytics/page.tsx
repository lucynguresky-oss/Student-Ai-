'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Session {
  id: string;
  durationSec: number;
  focusRating?: number;
  startedAt: string;
}

interface AnalyticsData {
  totalSeconds: number;
  averageRating: number;
  sessions: Session[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/analytics/study-time')
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: 20, color: 'white' }}>Loading analytics...</div>;

  const totalHours = data ? (data.totalSeconds / 3600).toFixed(1) : '0';
  const avgRating = data ? data.averageRating.toFixed(1) : '0';

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
      <div className="top-bar" style={{ marginBottom: '24px' }}>
        <Link href="/settings" style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Study Analytics</h1>
        <div style={{ width: '22px' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '20px', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Total Focus Time</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#3B82F6' }}>{totalHours} <span style={{ fontSize: '16px', color: 'var(--text2)' }}>hrs</span></div>
        </div>
        <div style={{ padding: '20px', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Average Focus Rating</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#10b981' }}>{avgRating} <span style={{ fontSize: '16px', color: 'var(--text2)' }}>/ 5</span></div>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Recent Sessions</h2>
      {data?.sessions.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--surface)', borderRadius: '16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏱️</div>
          <div style={{ fontWeight: 600 }}>No sessions yet</div>
          <div style={{ fontSize: '14px', color: 'var(--text2)' }}>Use the Pomodoro timer to track your focus.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data?.sessions.slice().reverse().map(session => (
            <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{Math.round(session.durationSec / 60)} minutes</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>
                  {new Date(session.startedAt).toLocaleDateString()} at {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}>
                {session.focusRating || '-'} / 5
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
