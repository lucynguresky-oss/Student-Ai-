'use client';
import { useState } from 'react';
import Link from 'next/link';

const TABS = ['All', 'Mentions', 'Learning', 'Social', 'System'];

interface Notification {
  id: string;
  type: 'social' | 'learning' | 'system' | 'mention';
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
  avatar?: string;
  icon?: string;
  href: string;
}

const NOW = Date.now();
const h = (n: number) => NOW - n * 3600_000;
const d = (n: number) => NOW - n * 86_400_000;

const NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'social', title: 'Mr. Omondi liked your post', description: '"Finally cracked quadratic equations 🎉"', timestamp: h(0.5), read: false, avatar: 'omondi', href: '/feed' },
  { id: 'n2', type: 'learning', title: '🔥 Daily streak! 15 days', description: 'Keep going! You\'re on fire. Complete today\'s lesson to maintain your streak.', timestamp: h(1), read: false, icon: '🔥', href: '/learn' },
  { id: 'n3', type: 'mention', title: '@chemdaily_ke mentioned you', description: '"Check out @amina_learns explanation of electrochemistry!"', timestamp: h(2), read: false, avatar: 'chem', href: '/feed' },
  { id: 'n4', type: 'learning', title: 'New quiz available', description: 'Biology Chapter 4: Cell Division — Test your knowledge now!', timestamp: h(3), read: false, icon: '🎯', href: '/learn/quiz?id=q1' },
  { id: 'n5', type: 'social', title: 'amina_w started following you', description: '3 mutual friends · Biology Form 4', timestamp: h(5), read: true, avatar: 'amina2', href: '/profile?u=amina_w' },
  { id: 'n6', type: 'learning', title: 'You earned +50 XP!', description: 'Completed "Cell Division & Mitosis" lesson. Level 6 → 7 progress: 78%', timestamp: h(8), read: true, icon: '⚡', href: '/learn' },
  { id: 'n7', type: 'social', title: 'Your clip got 100 likes! 🎉', description: '"Photosynthesis in 60 seconds" is trending in Biology', timestamp: h(12), read: true, avatar: 'amina', href: '/clips' },
  { id: 'n8', type: 'system', title: 'New feature: Flashcards!', description: 'Study smarter with spaced repetition flashcards. Try them now →', timestamp: d(1), read: true, icon: '🃏', href: '/flashcards' },
  { id: 'n9', type: 'mention', title: 'Tagged in a study group', description: 'physics_ke tagged you in "Form 4 Physics Revision Group"', timestamp: d(1.5), read: true, avatar: 'physics', href: '/messages' },
  { id: 'n10', type: 'learning', title: 'Assignment due tomorrow!', description: 'Chemistry Paper 1 Practice — 5 questions remaining', timestamp: d(1), read: true, icon: '📝', href: '/papers' },
  { id: 'n11', type: 'social', title: 'Bright Osei liked your comment', description: 'On "Alkali metals become MORE reactive..."', timestamp: d(2), read: true, avatar: 'bright', href: '/feed' },
  { id: 'n12', type: 'system', title: 'Subscription renews in 3 days', description: 'Learnix Plus · KSh 500/month. Manage in Settings →', timestamp: d(2), read: true, icon: '⭐', href: '/upgrade' },
  { id: 'n13', type: 'learning', title: 'Weekly Report Ready!', description: 'You completed 8 lessons, 3 quizzes, and earned 420 XP this week.', timestamp: d(3), read: true, icon: '📊', href: '/learn' },
  { id: 'n14', type: 'social', title: 'Njeri Kamau sent you a message', description: '"Hey! Can you help me with Biology revision?"', timestamp: d(4), read: true, avatar: 'njeri', href: '/messages' },
  { id: 'n15', type: 'system', title: 'Welcome to Learnix! 🎓', description: 'Start your learning journey with 3 free subjects and AI-powered tutoring.', timestamp: d(7), read: true, icon: '🎓', href: '/learn' },
  { id: 'n16', type: 'learning', title: 'Achievement Unlocked!', description: '🏆 "Quiz Master" — Score 80%+ on 5 quizzes', timestamp: d(5), read: true, icon: '🏆', href: '/leaderboard' },
];

function timeFmt(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

function groupByTime(notifs: Notification[]): { label: string; items: Notification[] }[] {
  const today: Notification[] = [];
  const thisWeek: Notification[] = [];
  const earlier: Notification[] = [];
  const oneDay = 86_400_000;
  const oneWeek = 7 * oneDay;

  notifs.forEach(n => {
    const age = Date.now() - n.timestamp;
    if (age < oneDay) today.push(n);
    else if (age < oneWeek) thisWeek.push(n);
    else earlier.push(n);
  });

  const groups: { label: string; items: Notification[] }[] = [];
  if (today.length) groups.push({ label: 'Today', items: today });
  if (thisWeek.length) groups.push({ label: 'This Week', items: thisWeek });
  if (earlier.length) groups.push({ label: 'Earlier', items: earlier });
  return groups;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const markAllRead = () => {
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  };

  const dismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const filtered = notifications
    .filter(n => !dismissed.has(n.id))
    .filter(n => {
      if (activeTab === 'All') return true;
      if (activeTab === 'Mentions') return n.type === 'mention';
      if (activeTab === 'Learning') return n.type === 'learning';
      if (activeTab === 'Social') return n.type === 'social';
      if (activeTab === 'System') return n.type === 'system';
      return true;
    });

  const unreadCount = notifications.filter(n => !n.read && !dismissed.has(n.id)).length;
  const groups = groupByTime(filtered);

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div className="top-bar">
        <Link href="/feed" style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <span style={{ fontWeight: 800, fontSize: '18px' }}>Notifications</span>
        <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          {unreadCount > 0 ? 'Mark All Read' : '✓ All Read'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', overflowX: 'auto', scrollbarWidth: 'none', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '7px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
            background: activeTab === tab ? 'rgba(59,130,246,0.2)' : 'var(--surface)',
            border: `1px solid ${activeTab === tab ? 'var(--blue)' : 'var(--border)'}`,
            color: activeTab === tab ? 'white' : 'var(--text2)', whiteSpace: 'nowrap', flexShrink: 0,
            cursor: 'pointer', transition: 'all 0.15s',
          }}>{tab}</button>
        ))}
      </div>

      {/* Notifications */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔔</div>
          <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px', color: 'var(--text)' }}>All caught up!</div>
          <p style={{ fontSize: '14px', lineHeight: 1.5 }}>No new notifications. Keep learning and they&apos;ll show up here.</p>
        </div>
      ) : (
        <div style={{ padding: '0' }}>
          {groups.map(group => (
            <div key={group.label}>
              <div style={{ padding: '14px 16px 8px', fontSize: '13px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{group.label}</div>
              {group.items.map(n => (
                <Link key={n.id} href={n.href} onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))} style={{
                  display: 'flex', gap: '12px', padding: '12px 16px', textDecoration: 'none',
                  background: n.read ? 'transparent' : 'rgba(59,130,246,0.04)',
                  borderBottom: '1px solid var(--border)', transition: 'background 0.15s',
                  position: 'relative',
                }}>
                  {/* Unread dot */}
                  {!n.read && <div style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }} />}

                  {/* Avatar / Icon */}
                  {n.avatar ? (
                    <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${n.avatar}`} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, border: '2px solid var(--border)' }} />
                  ) : (
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{n.icon}</div>
                  )}

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: n.read ? 500 : 700, color: 'var(--text)', marginBottom: '2px', lineHeight: 1.3 }}>{n.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.description}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>{timeFmt(n.timestamp)} ago</div>
                  </div>

                  {/* Dismiss */}
                  <button onClick={e => { e.preventDefault(); e.stopPropagation(); dismiss(n.id); }} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '16px', cursor: 'pointer', padding: '4px', alignSelf: 'flex-start', flexShrink: 0 }}>✕</button>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
