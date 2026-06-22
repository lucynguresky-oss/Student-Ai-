'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

/* ─────────────────────────────────────────────────────────────────────────────
   SETTINGS & ACTIVITY PAGE
   - Every row is clickable (routes to sub-page or opens overlay)
   - Account Privacy toggle functional
   - Notifications settings functional
   - Log Out clears ALL state + disconnects socket + routes to /
   - Learnix Premium → /upgrade
   - Settings search filters visible items
   - Archive → shows inline overlay
───────────────────────────────────────────────────────────────────────────── */

type SettingItem = {
  icon: string;
  label: string;
  sub?: string;
  value?: string | (() => string);
  href?: string;
  action?: () => void;
  danger?: boolean;
  blue?: boolean;
  dot?: boolean;
  toggle?: boolean;
  toggleKey?: string;
};

type SettingSection = {
  title?: string;
  sideLabel?: string;
  items: SettingItem[];
};

function SettingsRow({ item, toggles, onToggle }: { item: SettingItem; toggles: Record<string, boolean>; onToggle: (k: string) => void }) {
  const router = useRouter();
  const { logout } = useStore();

  const handleClick = () => {
    if (item.danger && item.label === 'Log out') {
      if (confirm('Are you sure you want to log out of Learnix?')) {
        // Clear all localStorage data
        if (typeof window !== 'undefined') {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('learnix_')) localStorage.removeItem(key);
          });
          localStorage.removeItem('learnix_token');
          localStorage.removeItem('learnix_currentUser');
        }
        logout();
        router.push('/');
      }
      return;
    }
    if (item.action) { item.action(); return; }
    if (item.toggle && item.toggleKey) { onToggle(item.toggleKey); return; }
    if (item.href && item.href !== '#') router.push(item.href);
  };

  const val = typeof item.value === 'function' ? item.value() : item.value;

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', width: '100%', textAlign: 'left',
        background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      <span style={{ fontSize: 20, width: 24, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 500, color: item.danger ? '#EF4444' : item.blue ? '#3B82F6' : 'var(--text)' }}>{item.label}</div>
        {item.sub && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, lineHeight: 1.4 }}>{item.sub}</div>}
      </div>
      {item.toggle && item.toggleKey ? (
        <div style={{
          width: 48, height: 26, borderRadius: 13, padding: 2, transition: 'background 0.25s',
          background: toggles[item.toggleKey] ? '#22C55E' : 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: toggles[item.toggleKey] ? 'flex-end' : 'flex-start',
        }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'white', transition: 'all 0.25s' }} />
        </div>
      ) : (
        <>
          {item.dot && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', flexShrink: 0 }} />}
          {val && <span style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{val}</span>}
          {!item.danger && !item.blue && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          )}
        </>
      )}
    </button>
  );
}

/* Archive overlay showing archived items */
function ArchiveOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: '#1A1A1A', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', maxHeight: '70vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Archive</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: 22 }}>✕</button>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No archived items</div>
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>Posts and stories you archive will appear here. They are hidden from your profile but you can restore them at any time.</div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { currentUser, logout } = useStore();
  const [search, setSearch] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    privateAccount: true,
    pushNotifs: true,
    emailNotifs: false,
    streakReminder: true,
    aiSuggestions: true,
    studyVisibility: true,
    tagsEnabled: true,
    contentFilter: true,
  });

  const toggle = useCallback((key: string) => setToggles(p => ({ ...p, [key]: !p[key] })), []);

  const SECTIONS: SettingSection[] = [
    {
      title: 'Your account',
      sideLabel: '∞ Learnix',
      items: [
        { icon: '👤', label: 'Accounts Centre', sub: 'Password, security, personal details, ad preferences', href: '/settings/account' },
      ],
    },
    {
      title: 'For you',
      items: [
        { icon: '🎓', label: 'Student Account settings', href: '/settings/student' },
        { icon: '✅', label: 'Learnix Verified', value: 'Not subscribed', href: '/upgrade' },
      ],
    },
    {
      title: 'How you use Learnix',
      items: [
        { icon: '📈', label: 'Study Analytics', sub: 'View your Pomodoro focus stats', href: '/analytics' },
        { icon: '🔖', label: 'Saved', sub: 'View your saved posts and collections', href: '/settings/saved' },
        { icon: '🕐', label: 'Archive', sub: 'View archived posts and stories', action: () => setShowArchive(true) },
        { icon: '📊', label: 'Your activity', sub: 'Time spent, interactions, links visited', href: '/settings/activity' },
        { icon: '🔔', label: 'Notifications', href: '/settings/notifications' },
        { icon: '⏱', label: 'Time management', href: '/settings/time' },
        { icon: '📱', label: 'Learnix for tablets', href: '/settings/tablet' },
      ],
    },
    {
      title: 'Who can see your content',
      items: [
        { icon: '🔒', label: 'Account privacy', value: () => toggles.privateAccount ? 'Private' : 'Public', toggle: true, toggleKey: 'privateAccount' },
        { icon: '🏷', label: 'Tags and mentions', toggle: true, toggleKey: 'tagsEnabled' },
        { icon: '📖', label: 'Study visibility', toggle: true, toggleKey: 'studyVisibility' },
      ],
    },
    {
      title: 'What you see',
      items: [
        { icon: '✂️', label: 'Content preferences', href: '/settings/content' },
        { icon: '🌐', label: 'Language', value: 'English (UK)', href: '/settings/language' },
        { icon: '🔇', label: 'Muted accounts', href: '/settings/muted' },
        { icon: '🚫', label: 'Blocked accounts', href: '/settings/blocked' },
      ],
    },
    {
      title: 'Your orders and subscriptions',
      items: [
        { icon: '💳', label: 'Orders and payments', href: '/settings/payments' },
        { icon: '⭐', label: 'Learnix Premium', sub: 'Unlock unlimited study tools', href: '/upgrade' },
      ],
    },
    {
      title: 'More info and support',
      items: [
        { icon: '❓', label: 'Help', href: '/settings/help' },
        { icon: '🛡', label: 'Privacy Centre', href: '/settings/privacy' },
        { icon: '📋', label: 'Account Status', href: '/settings/status' },
        { icon: 'ℹ️', label: 'About', href: '/settings/about' },
      ],
    },
    {
      title: 'Also from Learnix',
      items: [
        { icon: '🧵', label: 'Learnix Threads', sub: 'Share study ideas and join conversations', href: '/feed' },
        { icon: '🎬', label: 'Learnix Clips', sub: 'Create short educational videos', dot: true, href: '/clips' },
        { icon: '🤖', label: 'AI Tutor', sub: 'Your personal study assistant', href: '/ai-tutor' },
      ],
    },
    {
      title: 'Login',
      items: [
        { icon: '➕', label: 'Add account', blue: true, href: '/auth/signup' },
        { icon: '🚪', label: 'Log out', danger: true },
      ],
    },
  ];

  const allItems = SECTIONS.flatMap(s => s.items);
  const filteredSections = search
    ? [{ title: 'Results', items: allItems.filter(i => i.label.toLowerCase().includes(search.toLowerCase()) || (i.sub ?? '').toLowerCase().includes(search.toLowerCase())) }]
    : SECTIONS;

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Archive overlay */}
      {showArchive && <ArchiveOverlay onClose={() => setShowArchive(false)} />}

      {/* Header */}
      <div className="top-bar">
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Settings and activity</span>
        <div style={{ width: 22 }} />
      </div>

      {/* Search */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 52, background: 'var(--bg)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', borderRadius: 12, padding: '10px 14px', border: '1px solid var(--border)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14.5 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 18, lineHeight: 1, padding: 0 }}>✕</button>
          )}
        </div>
      </div>

      {/* Account Centre Banner */}
      {!search && (
        <button
          onClick={() => router.push('/settings/account')}
          style={{ display: 'block', width: 'calc(100% - 24px)', margin: '12px 12px 0', padding: '14px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', marginBottom: -1, cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${currentUser?.avatarSeed ?? 'amina'}`} alt="" style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Accounts Centre</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4, marginTop: 2 }}>Password, security, personal details, ad preferences</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 12, lineHeight: 1.5 }}>
            Manage your connected experiences and account settings across Learnix technologies.{' '}
            <span style={{ color: '#3B82F6', fontWeight: 600 }}>Learn more</span>
          </div>
        </button>
      )}

      {/* Sections */}
      {filteredSections.map((section, si) => (
        <div key={si} style={{ marginTop: section.title ? 20 : 0 }}>
          {section.title && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 8px' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{section.title}</span>
              {section.sideLabel && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{section.sideLabel}</span>}
            </div>
          )}
          <div style={{ background: 'var(--surface)', borderRadius: 14, margin: '0 12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {section.items.map((item, ii) => (
              <SettingsRow key={ii} item={item} toggles={toggles} onToggle={toggle} />
            ))}
          </div>
        </div>
      ))}

      {search && filteredSections[0]?.items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text2)' }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No settings found</div>
          <div style={{ fontSize: 13 }}>Try a different search term</div>
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}
