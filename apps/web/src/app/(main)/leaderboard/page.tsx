'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const PERIODS = ['Today', 'This Week', 'This Month', 'All Time'];
const SUBJECTS_FILTER = ['Overall', 'Biology', 'Chemistry', 'Physics', 'Mathematics', 'English'];

interface LeaderEntry {
  rank: number; name: string; school: string; seed: string;
  xp: number; streak: number; change: 'up' | 'down' | 'same';
  isYou?: boolean;
}

const LEADERS: LeaderEntry[] = [
  { rank: 1, name: 'Baraka Mwangi', school: 'Alliance High', seed: 'baraka', xp: 12450, streak: 45, change: 'same' },
  { rank: 2, name: 'Grace Otieno', school: 'Kenya High', seed: 'grace', xp: 11280, streak: 38, change: 'up' },
  { rank: 3, name: 'David Koech', school: 'Starehe Boys', seed: 'koech', xp: 10940, streak: 32, change: 'down' },
  { rank: 4, name: 'Amina Wanjiku', school: 'Pangani Girls', seed: 'amina', xp: 9870, streak: 28, change: 'up', isYou: true },
  { rank: 5, name: 'Brian Kiplagat', school: 'Mang\'u High', seed: 'brian', xp: 9340, streak: 25, change: 'up' },
  { rank: 6, name: 'Faith Wambui', school: 'Loreto Limuru', seed: 'faith', xp: 8920, streak: 22, change: 'down' },
  { rank: 7, name: 'Peter Ochieng', school: 'Maseno School', seed: 'peter', xp: 8510, streak: 20, change: 'same' },
  { rank: 8, name: 'Njeri Kamau', school: 'Bishop Gatimu', seed: 'njeri', xp: 8100, streak: 18, change: 'up' },
  { rank: 9, name: 'James Maina', school: 'Nairobi School', seed: 'james', xp: 7680, streak: 16, change: 'down' },
  { rank: 10, name: 'Lucy Akinyi', school: 'Precious Blood', seed: 'lucy', xp: 7250, streak: 15, change: 'same' },
  { rank: 11, name: 'Samuel Rotich', school: 'Kapsabet Boys', seed: 'samuel', xp: 6890, streak: 14, change: 'up' },
  { rank: 12, name: 'Mercy Chebet', school: 'Kaplong Girls', seed: 'mercy', xp: 6540, streak: 12, change: 'down' },
  { rank: 13, name: 'Kevin Onyango', school: 'Kakamega High', seed: 'kevin', xp: 6180, streak: 11, change: 'same' },
  { rank: 14, name: 'Diana Adhiambo', school: 'Butere Girls', seed: 'diana', xp: 5830, streak: 10, change: 'up' },
  { rank: 15, name: 'Victor Kiprono', school: 'Maranda High', seed: 'victor', xp: 5490, streak: 9, change: 'down' },
  { rank: 16, name: 'Sarah Mumbua', school: 'Machakos Girls', seed: 'sarah', xp: 5140, streak: 8, change: 'same' },
  { rank: 17, name: 'Collins Mutua', school: 'Lenana School', seed: 'collins', xp: 4800, streak: 7, change: 'up' },
  { rank: 18, name: 'Rose Njoki', school: 'State House Girls', seed: 'rose', xp: 4460, streak: 6, change: 'down' },
  { rank: 19, name: 'Joseph Wafula', school: 'Friends Kamusinga', seed: 'joseph', xp: 4120, streak: 5, change: 'same' },
  { rank: 20, name: 'Christine Auma', school: 'Moi Girls Eldoret', seed: 'christine', xp: 3780, streak: 4, change: 'up' },
];

interface Badge {
  id: string; icon: string; name: string; desc: string; unlocked: boolean;
}

const BADGES: Badge[] = [
  { id: 'b1', icon: '🎯', name: 'First Lesson', desc: 'Complete your first lesson', unlocked: true },
  { id: 'b2', icon: '🔥', name: '7-Day Streak', desc: 'Maintain a 7-day learning streak', unlocked: true },
  { id: 'b3', icon: '⚡', name: '100 XP', desc: 'Earn 100 experience points', unlocked: true },
  { id: 'b4', icon: '🏆', name: 'Quiz Master', desc: 'Score 80%+ on 5 quizzes', unlocked: true },
  { id: 'b5', icon: '🥇', name: 'Top 10', desc: 'Reach the top 10 leaderboard', unlocked: false },
  { id: 'b6', icon: '🧬', name: 'Biology Expert', desc: 'Complete all Biology lessons', unlocked: false },
  { id: 'b7', icon: '📐', name: 'Math Wizard', desc: 'Complete all Mathematics lessons', unlocked: false },
  { id: 'b8', icon: '🧪', name: 'Chemistry Pro', desc: 'Complete all Chemistry lessons', unlocked: false },
  { id: 'b9', icon: '🚀', name: 'Physics Genius', desc: 'Complete all Physics lessons', unlocked: false },
  { id: 'b10', icon: '📚', name: 'Bookworm', desc: 'Read 10 textbook chapters', unlocked: true },
  { id: 'b11', icon: '💎', name: '30-Day Streak', desc: 'Maintain a 30-day streak', unlocked: false },
  { id: 'b12', icon: '🌟', name: '1000 XP', desc: 'Earn 1000 experience points', unlocked: true },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('This Week');
  const [subjectFilter, setSubjectFilter] = useState('Overall');
  const [showBadgeDetail, setShowBadgeDetail] = useState<Badge | null>(null);
  const [leaders, setLeaders] = useState<LeaderEntry[]>(LEADERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/gamification/leaderboard')
      .then(data => {
        const formatted = data.map((d: any, i: number) => ({
          rank: i + 1,
          name: d.displayName || d.username,
          school: 'Learnix Academy',
          seed: d.username,
          xp: d.xp,
          streak: 1,
          change: 'same',
          isYou: i === 0, // Mock current user for demo
        }));
        if (formatted.length > 0) {
          setLeaders(formatted);
        }
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <div style={{ color: 'white', padding: 20 }}>Loading leaderboard...</div>;

  const you = leaders.find(l => l.isYou) || leaders[0] || {
    rank: 1, name: 'Learner', school: 'Learnix Academy', seed: 'learner', xp: 0, streak: 0, change: 'same'
  };
  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  const medalColors: Record<number, { bg: string; border: string; text: string }> = {
    1: { bg: 'linear-gradient(135deg,#FFD700,#FFA500)', border: '#FFD700', text: '#000' },
    2: { bg: 'linear-gradient(135deg,#C0C0C0,#A0A0A0)', border: '#C0C0C0', text: '#000' },
    3: { bg: 'linear-gradient(135deg,#CD7F32,#8B5E3C)', border: '#CD7F32', text: '#000' },
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div className="top-bar">
        <Link href="/learn" style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🏆</span>
          <span style={{ fontWeight: 800, fontSize: '18px' }}>Leaderboard</span>
        </div>
        <Link href="/profile" style={{ color: 'white', textDecoration: 'none' }}>
          <img src="https://api.dicebear.com/8.x/avataaars/svg?seed=amina" alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--border)' }} />
        </Link>
      </div>

      {/* Period tabs */}
      <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', overflowX: 'auto', scrollbarWidth: 'none', borderBottom: '1px solid var(--border)' }}>
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: '7px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
            background: period === p ? 'rgba(59,130,246,0.2)' : 'var(--surface)',
            border: `1px solid ${period === p ? 'var(--blue)' : 'var(--border)'}`,
            color: period === p ? 'white' : 'var(--text2)', whiteSpace: 'nowrap', flexShrink: 0,
            cursor: 'pointer',
          }}>{p}</button>
        ))}
      </div>

      {/* Subject filter */}
      <div style={{ display: 'flex', gap: '6px', padding: '8px 16px', overflowX: 'auto', scrollbarWidth: 'none', borderBottom: '1px solid var(--border)' }}>
        {SUBJECTS_FILTER.map(s => (
          <button key={s} onClick={() => setSubjectFilter(s)} className={`chip${subjectFilter === s ? ' active' : ''}`} style={{ fontSize: '11px', padding: '5px 10px' }}>{s}</button>
        ))}
      </div>

      {/* Your Stats */}
      <div style={{ margin: '16px', padding: '16px', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(24,214,200,0.06))', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div style={{ position: 'relative' }}>
            <img src="https://api.dicebear.com/8.x/avataaars/svg?seed=amina" alt="" style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #3B82F6' }} />
            <div style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--grad)', borderRadius: '6px', padding: '2px 6px', fontSize: '10px', fontWeight: 800, color: 'white', border: '2px solid #000' }}>#{you.rank}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{you.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{you.school}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#3B82F6' }}>{you.xp.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>XP</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Rank', value: `#${you.rank}`, icon: '📊' },
            { label: 'Streak', value: `${you.streak}d`, icon: '🔥' },
            { label: 'To #3', value: `${((top3[2]?.xp ?? 0) - you.xp).toLocaleString()} XP`, icon: '🎯' },
          ].map(s => (
            <div key={s.label} style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', marginBottom: '2px' }}>{s.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: 'var(--text2)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', padding: '0 16px 24px' }}>
        {[top3[1]!, top3[0]!, top3[2]!].map((entry, idx) => {
          const actualRank = (idx === 0 ? 2 : idx === 1 ? 1 : 3) as 1 | 2 | 3;
          const medal = medalColors[actualRank]!;
          const height = actualRank === 1 ? 120 : actualRank === 2 ? 100 : 85;
          const medals = ['', '🥈', '🥇', '🥉'];

          return (
            <div key={entry.rank} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${entry.seed}`} alt="" style={{ width: actualRank === 1 ? '64px' : '52px', height: actualRank === 1 ? '64px' : '52px', borderRadius: '50%', border: `3px solid ${medal.border}`, boxShadow: `0 0 20px ${medal.border}40` }} />
                {actualRank === 1 && <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '24px' }}>👑</div>}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, textAlign: 'center', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{entry.name.split(' ')[0]}</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: medal.border, marginBottom: '6px' }}>{entry.xp.toLocaleString()}</div>
              <div style={{ width: '100%', height: `${height}px`, background: medal.bg, borderRadius: '12px 12px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)', borderRadius: 'inherit' }} />
                <span style={{ fontSize: '28px', zIndex: 1 }}>{medals[actualRank]}</span>
                <span style={{ fontSize: '14px', fontWeight: 900, color: medal.text, zIndex: 1 }}>#{actualRank}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranked list */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>Rankings</div>
        {rest.map(entry => (
          <div key={entry.rank} style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
            background: entry.isYou ? 'rgba(59,130,246,0.08)' : 'var(--surface)',
            borderRadius: '12px', marginBottom: '6px',
            border: entry.isYou ? '1.5px solid rgba(59,130,246,0.3)' : '1px solid var(--border)',
          }}>
            <div style={{ width: '28px', textAlign: 'center', fontWeight: 800, fontSize: '14px', color: entry.isYou ? '#3B82F6' : 'var(--text2)', flexShrink: 0 }}>
              {entry.rank}
            </div>
            <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${entry.seed}`} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0, border: entry.isYou ? '2px solid #3B82F6' : '1px solid var(--border)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: entry.isYou ? 700 : 600, color: entry.isYou ? 'white' : 'var(--text)' }}>{entry.name} {entry.isYou && <span style={{ fontSize: '11px', color: '#3B82F6' }}>(You)</span>}</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{entry.school}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', color: 'var(--text2)' }}>🔥{entry.streak}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>{entry.xp.toLocaleString()}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>XP</div>
              </div>
              <span style={{ fontSize: '12px', color: entry.change === 'up' ? '#22C55E' : entry.change === 'down' ? '#EF4444' : 'var(--text3)' }}>
                {entry.change === 'up' ? '▲' : entry.change === 'down' ? '▼' : '─'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Achievements</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {BADGES.map(badge => (
            <button key={badge.id} onClick={() => setShowBadgeDetail(badge)} style={{
              padding: '14px 8px', background: badge.unlocked ? 'var(--surface)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${badge.unlocked ? 'var(--border)' : 'rgba(255,255,255,0.04)'}`,
              borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              cursor: 'pointer', opacity: badge.unlocked ? 1 : 0.4, position: 'relative', transition: 'all 0.15s',
            }}>
              {badge.unlocked && <div style={{ position: 'absolute', inset: '-1px', borderRadius: '14px', background: 'transparent', boxShadow: '0 0 12px rgba(59,130,246,0.15)', pointerEvents: 'none' }} />}
              <span style={{ fontSize: '28px', filter: badge.unlocked ? 'none' : 'grayscale(1)' }}>{badge.icon}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, textAlign: 'center', color: badge.unlocked ? 'white' : 'var(--text3)' }}>{badge.name}</span>
              {!badge.unlocked && <span style={{ fontSize: '14px' }}>🔒</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Badge detail modal */}
      {showBadgeDetail && (
        <div onClick={() => setShowBadgeDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1A1A1A', borderRadius: '20px', padding: '32px 24px', textAlign: 'center', maxWidth: '320px', width: '100%', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px', filter: showBadgeDetail.unlocked ? 'none' : 'grayscale(1)' }}>{showBadgeDetail.icon}</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>{showBadgeDetail.name}</h3>
            <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '16px', lineHeight: 1.5 }}>{showBadgeDetail.desc}</p>
            <div style={{ padding: '8px 16px', borderRadius: '8px', background: showBadgeDetail.unlocked ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)', color: showBadgeDetail.unlocked ? '#22C55E' : '#EF4444', fontSize: '13px', fontWeight: 700, display: 'inline-block' }}>
              {showBadgeDetail.unlocked ? '✅ Unlocked!' : '🔒 Not yet unlocked'}
            </div>
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setShowBadgeDetail(null)} style={{ padding: '12px 32px', borderRadius: '10px', background: 'var(--grad)', color: 'white', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
