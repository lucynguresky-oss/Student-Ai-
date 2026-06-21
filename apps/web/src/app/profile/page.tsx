'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/lib/auth-store';

function AccountSwitcherModal({ onClose }: { onClose: () => void }) {
  const accountList = useAuthStore((state) => state.accountList);
  const currentUser = useAuthStore((state) => state.currentUser);
  const switchAccount = useAuthStore((state) => state.switchAccount);
  const router = useRouter();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: '#1A1A1A', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Switch Accounts</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: 22 }}>✕</button>
        </div>

        {/* Accounts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {accountList.map((acc) => {
            const isActive = currentUser?.username === acc.username;
            return (
              <div
                key={acc.username}
                onClick={() => {
                  if (!isActive) switchAccount(acc.username);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: isActive ? 'rgba(59,130,246,0.1)' : 'var(--surface)',
                  border: isActive ? '1px solid #3B82F6' : '1px solid var(--border)',
                  borderRadius: 12,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${acc.username.split('.')[0] || 'default'}`}
                    alt=""
                    style={{ width: 36, height: 36, borderRadius: '50%' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{acc.displayName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>@{acc.username}</div>
                  </div>
                </div>
                {isActive && <span style={{ color: '#3B82F6', fontWeight: 700, fontSize: 16 }}>✓</span>}
              </div>
            );
          })}
        </div>

        {/* Add Account Option */}
        <button
          onClick={() => {
            onClose();
            router.push('/login');
          }}
          style={{
            width: '100%',
            padding: '14px',
            background: 'none',
            border: '1px dashed var(--border)',
            borderRadius: 12,
            color: '#3B82F6',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span>➕</span> Add Existing Account
        </button>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────────────────
   PROFILE PAGE
   - Share Profile → Web Share API with clipboard fallback
   - Edit Profile → inline modal that persists changes via store.login()
   - Follow buttons update global state
   - Followers/Following counts are live from store
   - Discover People carousel fully interactive
   - Message button navigates to /messages
   - Highlights are tappable (route to /stories)
   - Bottom nav included since profile is outside (main) layout
───────────────────────────────────────────────────────────────────────────── */

const DISCOVER = [
  { id: 'musaazi', name: 'Musaazi Sean', seed: 'musaazi', mutuals: 1 },
  { id: 'qaisar', name: 'Qaisar Munshi', seed: 'qaisar', mutuals: 54 },
  { id: 'bright', name: 'Bright Osei', seed: 'bright', mutuals: 1 },
  { id: 'njeri', name: 'Njeri Kamau', seed: 'njeri', mutuals: 8 },
  { id: 'koech', name: 'David Koech', seed: 'koech', mutuals: 3 },
];

const HIGHLIGHTS = [
  { id: 'h1', label: 'New', emoji: '+', color: '#555' },
  { id: 'h2', label: 'Guitarist', emoji: '🎸', color: '#7C3AED' },
  { id: 'h3', label: 'Savo', emoji: '✨', color: '#F59E0B' },
  { id: 'h4', label: 'Study', emoji: '📚', color: '#3B82F6' },
  { id: 'h5', label: 'Goals', emoji: '🎯', color: '#EF4444' },
];

const GRID = [
  'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=300&q=80',
  'https://images.unsplash.com/photo-1603126859738-1631624b4c10?w=300&q=80',
  'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&q=80',
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=300&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&q=80',
];

const REELS_GRID = [
  { url: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=300&q=80', views: '12.4K' },
  { url: 'https://images.unsplash.com/photo-1603126859738-1631624b4c10?w=300&q=80', views: '5.2K' },
  { url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=300&q=80', views: '8.7K' },
];

function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { currentUser, login } = useStore();
  const [name, setName] = useState(currentUser?.displayName ?? '');
  const [bio, setBio] = useState(currentUser?.bio ?? '');
  const [username, setUsername] = useState(currentUser?.username ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    
    // Update user in store (persists to localStorage)
    login({
      ...currentUser,
      displayName: name.trim() || currentUser.displayName,
      username: username.trim() || currentUser.username,
      bio: bio.trim(),
    });

    // Try to persist to API
    try {
      await fetch('http://localhost:4000/v1/profiles/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: name.trim(),
          username: username.trim(),
          bio: bio.trim(),
        }),
      });
    } catch { /* API unavailable — local update still persists */ }

    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: '#1A1A1A', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Edit Profile</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: 22 }}>✕</button>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${currentUser?.avatarSeed ?? 'amina'}`} alt="" style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #3B82F6' }} />
            <button 
              onClick={() => {
                const seeds = ['amina', 'baraka', 'grace', 'koech', 'njeri', 'omondi', 'bright', 'faith', 'peter', 'james', 'lucy', 'mercy'];
                const newSeed = seeds[Math.floor(Math.random() * seeds.length)];
                if (currentUser) {
                  login({ ...currentUser, avatarSeed: newSeed } as any);
                }
              }}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, background: '#3B82F6', borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Display Name', value: name, setter: setName, placeholder: 'Your display name' },
            { label: 'Username', value: username, setter: setUsername, placeholder: 'username' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'white', fontSize: 14.5, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => (e.target.style.borderColor = '#3B82F6')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself..."
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'white', fontSize: 14.5, outline: 'none', resize: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              onFocus={e => (e.target.style.borderColor = '#3B82F6')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ background: saving ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg,#3B82F6,#18D6C8)', border: 'none', borderRadius: 12, padding: '14px', color: 'white', fontWeight: 700, fontSize: 16, cursor: saving ? 'wait' : 'pointer', marginTop: 8, transition: 'opacity 0.2s' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Bottom Nav for profile page (since it's outside (main) layout) */
function ProfileBottomNav() {
  const navItems = [
    { icon: '🏠', label: 'Home', href: '/feed' },
    { icon: '🔍', label: 'Search', href: '/search' },
    { icon: '🎬', label: 'Clips', href: '/clips' },
    { icon: '📚', label: 'Library', href: '/library' },
    { icon: '🧠', label: 'Learn', href: '/learn' },
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--border)', padding: '6px 0 env(safe-area-inset-bottom)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      maxWidth: 480, margin: '0 auto', zIndex: 50,
    }}>
      {navItems.map(item => (
        <Link key={item.href} href={item.href}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none', color: 'var(--text2)', fontSize: 20, padding: '4px 8px' }}>
          <span>{item.icon}</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>{item.label}</span>
        </Link>
      ))}
      {/* Active profile indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 9, fontWeight: 600, color: 'white' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid white', overflow: 'hidden' }}>
          <img src="https://api.dicebear.com/8.x/avataaars/svg?seed=amina" alt="" style={{ width: '100%', height: '100%' }} />
        </div>
        <span>Profile</span>
      </div>
    </nav>
  );
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, followedUsers, toggleFollow, xp, streak } = useStore();
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const viewUser = searchParams.get('u') ?? currentUser?.username ?? 'amara.otieno';
  const isOwnProfile = viewUser === currentUser?.username;
  const avatarSeed = isOwnProfile ? (currentUser?.avatarSeed ?? viewUser) : viewUser;

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/profile?u=${viewUser}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentUser?.displayName ?? viewUser} on Learnix`,
          text: `Check out ${viewUser}'s profile on Learnix — the social learning app for KCSE students!`,
          url,
        });
      } catch { /* User cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('✅ Profile link copied to clipboard!');
      } catch {
        alert(`Share this link: ${url}`);
      }
    }
  };

  const handleDismissDiscover = (id: string) => {
    setDismissed(p => new Set([...p, id]));
  };

  const handleMessage = () => {
    router.push('/messages');
  };

  return (
    <>
      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} />}
      {switcherOpen && <AccountSwitcherModal onClose={() => setSwitcherOpen(false)} />}

      {/* Header */}
      <div className="top-bar">
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: 22, display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div 
          onClick={() => isOwnProfile && setSwitcherOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: isOwnProfile ? 'pointer' : 'default' }}
        >
          <span style={{ fontSize: 16 }}>{currentUser?.isPrivate ? '🔒' : '🌐'}</span>
          <span style={{ fontWeight: 700 }}>{viewUser}</span>
          {isOwnProfile && <span style={{ fontSize: 10, color: 'var(--text2)', marginLeft: 2 }}>▼</span>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/upgrade" style={{ color: 'white', display: 'flex', alignItems: 'center', fontSize: 22, textDecoration: 'none' }}>⭐</Link>
          <Link href="/settings" style={{ color: 'white', display: 'flex', alignItems: 'center', fontSize: 22, textDecoration: 'none' }}>☰</Link>
        </div>
      </div>

      <div style={{ overflowY: 'auto', paddingBottom: 80 }}>
        {/* Profile Info */}
        <div style={{ padding: '12px 16px' }}>
          {/* Avatar + Stats */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 86, height: 86, borderRadius: '50%', border: '3px solid #E1306C', padding: 3 }}>
                <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${avatarSeed}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
              </div>
              {isOwnProfile && (
                <button onClick={() => setEditOpen(true)} style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, background: '#3B82F6', borderRadius: '50%', border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, color: 'white' }}>+</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { label: 'Posts', value: currentUser?.posts ?? 2 },
                { label: 'Followers', value: `${((currentUser?.followers ?? 901) / 1000).toFixed(1)}K` },
                { label: 'Following', value: (currentUser?.following ?? 1711).toLocaleString() },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{isOwnProfile ? (currentUser?.displayName ?? 'Amina Wanjiku') : viewUser}</div>
          <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: 4, whiteSpace: 'pre-line' }}>
            {isOwnProfile ? (currentUser?.bio ?? 'Form 4 · KCSE 2026 🇰🇪\nFuture Engineer 🚀 | Biology & Maths nerd') : `@${viewUser} · Student on Learnix`}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#18D6C8', marginBottom: 12 }}>🔥 {streak} Day Streak · ⚡ {xp.toLocaleString()} XP</div>

          {/* Upgrade Banner */}
          <Link href="/upgrade" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.06))', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 14, padding: '10px 14px', textDecoration: 'none', marginBottom: 12, transition: 'transform 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.01)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
            <span style={{ fontSize: 18 }}>⭐</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#F59E0B', fontWeight: 700, fontSize: 13 }}>Upgrade to Learnix Plus</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1 }}>Get unlimited AI tutor, textbooks & past papers</div>
            </div>
            <span style={{ color: '#F59E0B', fontSize: 18 }}>›</span>
          </Link>

          {/* Action Buttons */}
          {isOwnProfile ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button onClick={() => setEditOpen(true)} style={{ flex: 1, padding: '9px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>Edit profile</button>
              <button onClick={handleShareProfile} style={{ flex: 1, padding: '9px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>Share profile</button>
              <Link href="/search" style={{ width: 40, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, textDecoration: 'none', color: 'white' }}>👤+</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button
                onClick={() => toggleFollow(viewUser)}
                style={{ flex: 1, padding: '9px 0', background: followedUsers.has(viewUser) ? 'var(--surface)' : 'var(--blue)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', transition: 'all 0.2s' }}>
                {followedUsers.has(viewUser) ? 'Following ✓' : 'Follow'}
              </button>
              <button onClick={handleMessage} style={{ flex: 1, padding: '9px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', transition: 'background 0.15s' }}>Message</button>
              <button onClick={handleShareProfile} style={{ width: 40, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontSize: 16, color: 'white' }}>↗️</button>
            </div>
          )}
        </div>

        {/* Story Highlights */}
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '0 16px 16px', scrollbarWidth: 'none' }}>
          {HIGHLIGHTS.map(h => (
            <Link key={h.id} href="/stories" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0, transition: 'transform 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: `${h.color}22`, border: `2px solid ${h.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: h.id === 'h1' ? 22 : 26 }}>
                {h.emoji}
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{h.label}</span>
            </Link>
          ))}
        </div>

        {/* Discover People */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Discover people</span>
            <Link href="/search" style={{ color: 'var(--blue)', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>See All</Link>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
            {DISCOVER.filter(d => !dismissed.has(d.id)).map(d => (
              <div key={d.id} style={{ flexShrink: 0, width: 140, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 12px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <button onClick={() => handleDismissDiscover(d.id)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
                <Link href={`/profile?u=${d.seed}`}>
                  <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${d.seed}`} alt="" style={{ width: 54, height: 54, borderRadius: '50%', border: '2px solid var(--border)' }} />
                </Link>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{d.mutuals} mutual{d.mutuals !== 1 ? 's' : ''}</div>
                </div>
                <button
                  onClick={() => toggleFollow(d.id)}
                  style={{ width: '100%', padding: '8px 0', borderRadius: 10, background: followedUsers.has(d.id) ? 'var(--surface)' : 'var(--blue)', border: followedUsers.has(d.id) ? '1px solid var(--border)' : 'none', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {followedUsers.has(d.id) ? 'Following ✓' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Grid Tabs */}
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex' }}>
            {[
              { icon: '⊞', label: 'Posts' },
              { icon: '▶', label: 'Reels' },
              { icon: '🏷', label: 'Tagged' },
            ].map((t, i) => (
              <button key={t.label} onClick={() => setTab(i)} style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', borderBottom: tab === i ? '2px solid white' : '2px solid transparent', color: tab === i ? 'white' : 'var(--text2)', fontSize: 20, transition: 'all 0.2s' }}>
                {t.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Photo Grid — Posts tab */}
        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            {GRID.map((url, i) => (
              <div key={i} style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
              </div>
            ))}
          </div>
        )}

        {/* Reels tab */}
        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            {REELS_GRID.map((reel, i) => (
              <Link key={i} href="/clips" style={{ aspectRatio: '9/16', overflow: 'hidden', position: 'relative', cursor: 'pointer', textDecoration: 'none' }}>
                <img src={reel.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                <div style={{ position: 'absolute', bottom: 6, left: 6, display: 'flex', alignItems: 'center', gap: 4, color: 'white', fontSize: 12, fontWeight: 700 }}>
                  <span>▶</span> {reel.views}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Tagged tab */}
        {tab === 2 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text2)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏷</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No tagged posts</div>
            <div style={{ fontSize: 13 }}>When people tag you in posts, they&apos;ll appear here.</div>
          </div>
        )}
      </div>

      <ProfileBottomNav />
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: 'var(--bg)' }}>
        <div style={{ fontSize: 32 }}>🔄</div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
