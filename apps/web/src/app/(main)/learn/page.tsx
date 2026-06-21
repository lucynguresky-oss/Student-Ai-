'use client';
import { useState } from 'react';
import Link from 'next/link';

const SUBJECTS = [
  { key: 'BIO', label: 'Biology', emoji: '🧬', color: '#22C55E', topics: 12, lessons: 48 },
  { key: 'CHE', label: 'Chemistry', emoji: '⚗️', color: '#F59E0B', topics: 10, lessons: 40 },
  { key: 'PHY', label: 'Physics', emoji: '🚀', color: '#3B82F6', topics: 11, lessons: 44 },
  { key: 'MAT', label: 'Mathematics', emoji: '📐', color: '#7C3AED', topics: 14, lessons: 56 },
  { key: 'ENG', label: 'English', emoji: '📝', color: '#EC4899', topics: 8, lessons: 32 },
];

const DAILY_QUESTS = [
  { id: 'q1', label: 'Complete 1 Biology lesson', xp: 50, done: false, emoji: '🧬' },
  { id: 'q2', label: 'Score 80%+ on a quiz', xp: 75, done: true, emoji: '🎯' },
  { id: 'q3', label: 'Watch 2 Learnix Clips', xp: 30, done: false, emoji: '🎬' },
];

const RECENT = [
  { id: 'l1', subject: 'Biology', title: 'Cell Division & Mitosis', progress: 60, emoji: '🧬', color: '#22C55E' },
  { id: 'l2', subject: 'Maths', title: 'Quadratic Equations', progress: 35, emoji: '📐', color: '#7C3AED' },
];

export default function LearnPage() {
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const streakDays = 15;
  const totalXp = 2840;
  const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
  const xpToNext = (level * level * 100);
  const xpPct = Math.min(100, (totalXp / xpToNext) * 100);

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Top bar */}
      <div className="top-bar">
        <span style={{ fontWeight: 800, fontSize: '20px' }}>Learn</span>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B', fontWeight: 700, fontSize: '15px' }}>
            <span>🔥</span>{streakDays}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3B82F6', fontWeight: 700, fontSize: '15px' }}>
            <span>⚡</span>{totalXp.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Level + XP bar */}
      <div style={{ padding: '16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>Level {level}</span>
          <span style={{ color: 'var(--text2)' }}>{totalXp} / {xpToNext} XP</span>
        </div>
        <div style={{ height: '8px', background: 'var(--surface)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${xpPct}%`, background: 'var(--grad)', borderRadius: '999px', transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* Continue Learning */}
      {RECENT.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Continue Learning</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {RECENT.map(item => (
              <Link key={item.id} href={`/learn/lesson/${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                  {item.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '2px' }}>{item.subject}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  <div style={{ height: '4px', background: 'var(--surface2)', borderRadius: '999px' }}>
                    <div style={{ height: '100%', width: `${item.progress}%`, background: item.color, borderRadius: '999px' }} />
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Daily Quests */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>Daily Quests</div>
          <span style={{ fontSize: '12px', color: 'var(--blue)' }}>1/3 done</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {DAILY_QUESTS.map(q => (
            <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: q.done ? 'rgba(34,197,94,0.08)' : 'var(--surface)', borderRadius: '12px', border: `1px solid ${q.done ? 'rgba(34,197,94,0.3)' : 'var(--border)'}` }}>
              <span style={{ fontSize: '20px' }}>{q.done ? '✅' : q.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 500, color: q.done ? 'var(--text2)' : 'var(--text)', textDecoration: q.done ? 'line-through' : 'none' }}>{q.label}</div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,0.12)', padding: '3px 8px', borderRadius: '6px' }}>+{q.xp} XP</div>
            </div>
          ))}
        </div>
      </div>

      {/* Subjects */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Subjects</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {SUBJECTS.map(s => (
            <Link key={s.key} href={`/learn/subject/${s.key.toLowerCase()}`} style={{ padding: '16px', background: 'var(--surface)', borderRadius: '16px', border: `1px solid ${activeSubject === s.key ? s.color : 'var(--border)'}`, display: 'flex', flexDirection: 'column', gap: '10px', transition: 'border-color 0.2s' }}>
              <div style={{ fontSize: '32px' }}>{s.emoji}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{s.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{s.lessons} lessons</div>
              </div>
              <div style={{ height: '4px', background: 'var(--surface2)', borderRadius: '999px' }}>
                <div style={{ height: '100%', width: '40%', background: s.color, borderRadius: '999px' }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Quick Access</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Link href="/leaderboard" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.06))', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', textDecoration: 'none' }}>
            <span style={{ fontSize: '28px' }}>🏆</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'white' }}>Leaderboard</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>Rank #4 · 9,870 XP</div>
            </div>
          </Link>
          <Link href="/flashcards" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(59,130,246,0.06))', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', textDecoration: 'none' }}>
            <span style={{ fontSize: '28px' }}>🃏</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'white' }}>Flashcards</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>5 decks · 50 cards</div>
            </div>
          </Link>
          <Link href="/papers" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(59,130,246,0.06))', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', textDecoration: 'none' }}>
            <span style={{ fontSize: '28px' }}>📄</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'white' }}>Past Papers</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>16 papers · KCSE</div>
            </div>
          </Link>
          <Link href="/ai-tutor" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(24,214,200,0.06))', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', textDecoration: 'none' }}>
            <span style={{ fontSize: '28px' }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'white' }}>AI Tutor</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>GPT-4o · KCSE Ready</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
