'use client';
import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';

export default function PomodoroTimer() {
  const [minimized, setMinimized] = useState(true);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer finished
      if (mode === 'focus') {
        // Save session
        apiFetch('/analytics/study-time', {
          method: 'POST',
          body: JSON.stringify({ durationSec: 25 * 60, focusRating: 5 })
        }).catch(console.error);
        
        // Switch to break
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('focus');
        setTimeLeft(25 * 60);
      }
      setIsActive(false);
      alert(mode === 'focus' ? 'Focus session complete! Time for a break.' : 'Break over! Back to focus.');
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  if (minimized) {
    return (
      <div 
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed', bottom: '80px', right: '16px', zIndex: 100,
          background: mode === 'focus' ? 'var(--grad)' : '#22C55E',
          color: 'white', padding: '10px 16px', borderRadius: '20px',
          fontWeight: 800, fontSize: '14px', cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.1)'
        }}
      >
        ⏳ {mins}:{secs}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '80px', right: '16px', zIndex: 100, width: '260px',
      background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(20px)',
      border: '1px solid var(--border)', borderRadius: '24px', padding: '20px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.8)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text2)' }}>
          {mode === 'focus' ? '🎯 Focus Mode' : '☕ Break Time'}
        </div>
        <button onClick={() => setMinimized(true)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}>▼</button>
      </div>

      <div style={{ textAlign: 'center', fontSize: '48px', fontWeight: 900, fontFamily: 'monospace', marginBottom: '20px', color: mode === 'focus' ? '#3B82F6' : '#22C55E' }}>
        {mins}:{secs}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={toggleTimer} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: isActive ? 'rgba(239,68,68,0.2)' : 'var(--grad)', color: isActive ? '#EF4444' : 'white', fontWeight: 700, cursor: 'pointer' }}>
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button onClick={resetTimer} style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
          ↻
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button onClick={() => { setMode('focus'); setTimeLeft(25 * 60); setIsActive(false); }} style={{ flex: 1, padding: '6px', fontSize: '11px', background: 'none', border: 'none', color: mode === 'focus' ? 'white' : 'var(--text3)', cursor: 'pointer' }}>25m Focus</button>
        <button onClick={() => { setMode('break'); setTimeLeft(5 * 60); setIsActive(false); }} style={{ flex: 1, padding: '6px', fontSize: '11px', background: 'none', border: 'none', color: mode === 'break' ? 'white' : 'var(--text3)', cursor: 'pointer' }}>5m Break</button>
      </div>
    </div>
  );
}
