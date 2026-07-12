'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const OWN_USERNAME = 'amina_learns';

const OWN_HIGHLIGHTS = [
  { id: '1', label: 'Guitarist', color: '#1a1636', emoji: '🎸' },
  { id: '2', label: 'Savo', color: '#16213e', emoji: '🌟' },
  { id: '3', label: 'Study', color: '#0d1f3c', emoji: '📚' },
  { id: '4', label: 'Goals', color: '#1a0a2e', emoji: '🎯' },
];

const OTHER_HIGHLIGHTS = [
  { id: '1', label: 'Fwends😋😋', color: '#2a1a3e', emoji: '🐼' },
  { id: '2', label: '🎀🦋😻', color: '#1a1a3e', emoji: '🎀' },
  { id: '3', label: '😋💞♥', color: '#1e1a40', emoji: '💜' },
  { id: '4', label: '🎵😋🎶', color: '#1a1640', emoji: '🎵' },
  { id: '5', label: 'Dāñçē', color: '#1e1e2e', emoji: '💃' },
];

const OWN_GRID = [
  'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&q=80',
  'https://images.unsplash.com/photo-1603126859738-1631624b4c10?w=400&q=80',
  'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&q=80',
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&q=80',
  'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400&q=80',
  'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&q=80',
];

const DISCOVER = [
  { id: '1', name: 'Musaazi Sean', seed: 'musaazi', mutuals: 1 },
  { id: '2', name: 'قيصر منسى', seed: 'qais', mutuals: 54 },
  { id: '3', name: 'Brightone', seed: 'bright', mutuals: 1 },
  { id: '4', name: 'Kevin Otieno', seed: 'kevin', mutuals: 3 },
];

const STORY_VIEWERS = [
  { name: 'Erico Junior', seed: 'erico', liked: true },
  { name: 'Yrimu✨', seed: 'yrimu', liked: true },
  { name: 'kinjo^_^', seed: 'kinjo', liked: false },
  { name: 'Bree🌸', seed: 'bree', liked: true },
  { name: 'rogft2026', seed: 'rogft', liked: false },
  { name: 'kash', seed: 'kash', liked: false },
  { name: 'RYN', seed: 'ryn', liked: false },
];

/* ─────────────────────────────────────────────
   EDIT PROFILE MODAL
───────────────────────────────────────────── */
function EditProfileModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('Amina Wanjiku');
  const [uname, setUname] = useState('amina_learns');
  const [pronouns, setPronouns] = useState('she/her');
  const [bio, setBio] = useState('Form 4 · KCSE 2026 🇰🇪\nFuture Engineer 🚀 | Biology & Maths nerd\n🔥 15 day streak');
  const [gender, setGender] = useState('Female');
  const [genderOpen, setGenderOpen] = useState(false);

  const field = (label: string, value: string, set: (v: string) => void, ph?: string) => (
    <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px 16px' }}>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <input value={value} onChange={e => set(e.target.value)} placeholder={ph || label}
        style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '15px', width: '100%' }} />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 300, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, background: '#000', zIndex: 10 }}>
        <button onClick={onClose} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px 4px 0' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span style={{ fontWeight: 700, fontSize: '17px', flex: 1 }}>Edit profile</span>
        <button onClick={onClose} style={{ color: '#3B82F6', background: 'none', border: 'none', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>Done</button>
      </div>
      {/* Avatars */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '28px 20px 8px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: '#222' }}>
          <img src="https://api.dicebear.com/8.x/avataaars/svg?seed=amina&backgroundColor=b6e3f4" alt="" style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,#18D6C8,#3B82F6,#7C3AED)', padding: '2px' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#222' }}>
            <img src="https://api.dicebear.com/8.x/bottts/svg?seed=amina_bot" alt="" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <button style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Edit picture or avatar</button>
      </div>
      {/* Fields */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {field('Name', name, setName)}
        {field('Username', uname, setUname)}
        {field('Pronouns', pronouns, setPronouns, 'Add pronouns')}
        <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bio</div>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '15px', width: '100%', resize: 'none', fontFamily: 'inherit' }} />
        </div>
        <button style={{ background: 'none', border: 'none', color: 'white', fontSize: '15px', textAlign: 'left', padding: '10px 0', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          Add Link
        </button>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>Add banners</div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>Add music, profiles and more.</div>
        </div>
        {/* Gender */}
        <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px 16px', cursor: 'pointer' }} onClick={() => setGenderOpen(g => !g)}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gender</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px' }}>{gender}</span>
            <span style={{ color: '#888', display: 'inline-block', transform: genderOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
          </div>
          {genderOpen && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(g => (
                <button key={g} onClick={() => { setGender(g); setGenderOpen(false); }}
                  style={{ background: g === gender ? 'rgba(59,130,246,0.15)' : 'none', border: 'none', color: g === gender ? '#60a5fa' : 'white', fontSize: '15px', padding: '8px 4px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}>
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Action links */}
        {['Switch to Professional account', 'Personal information settings', 'Show that your profile is verified'].map((txt, i) => (
          <button key={txt} style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '15px', textAlign: 'left', padding: '13px 0', cursor: 'pointer', borderTop: i === 0 ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.04)' }}>
            {txt}
          </button>
        ))}
        <div style={{ height: '40px' }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SETTINGS SHEET
───────────────────────────────────────────── */
function SettingsSheet({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', background: '#111', borderRadius: '20px 20px 0 0', paddingBottom: '40px' }}>
        <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.18)', borderRadius: '2px', margin: '12px auto' }} />
        {[
          { icon: '⚙️', label: 'Settings and activity', href: '/settings' },
          { icon: '🔒', label: 'Privacy and security', href: '/settings' },
          { icon: '📊', label: 'Your activity', href: '/settings' },
          { icon: '🏷️', label: 'Saved', href: '/settings' },
          { icon: '🕐', label: 'Archive', href: '/settings' },
          { icon: '🔔', label: 'Notifications', href: '/settings' },
          { icon: '⏱️', label: 'Time management', href: '/settings' },
        ].map(({ icon, label, href }) => (
          <Link key={label} href={href} onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none', color: 'white' }}>
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <span style={{ fontSize: '15px', fontWeight: 500 }}>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STORY STATS VIEW
───────────────────────────────────────────── */
function StoryStats({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 250, display: 'flex', flexDirection: 'column' }}>
      {/* Preview */}
      <div style={{ height: '220px', flexShrink: 0, background: '#111', overflow: 'hidden', position: 'relative' }}>
        <img src="https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 12, left: 16, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '34px', height: '34px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button style={{ position: 'absolute', top: 12, right: 16, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '34px', height: '34px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
        </button>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)' }}>
          <img src="https://api.dicebear.com/8.x/avataaars/svg?seed=amina&backgroundColor=b6e3f4" alt="" style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px' }}>
        <svg width="18" height="10" viewBox="0 0 18 10"><polyline points="2 8 9 2 16 8" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" /></svg>
      </div>
      {/* Viewer count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          <span style={{ fontWeight: 700, fontSize: '18px' }}>32</span>
        </div>
        <button style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
        </button>
      </div>
      {/* Comments */}
      <div style={{ padding: '0 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>Comments</span>
          <button style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>See All</button>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', background: '#222', flexShrink: 0 }}>
            <img src="https://api.dicebear.com/8.x/avataaars/svg?seed=baraka&backgroundColor=c0aede" alt="" style={{ width: '100%', height: '100%' }} />
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>baraka_savo </span>
            <span style={{ fontSize: '11.5px', color: '#888' }}>13h ago · </span>
            <span style={{ fontSize: '13px' }}>🐶💕💕 Mr.Savo</span>
          </div>
        </div>
      </div>
      {/* Who viewed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 0' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '12px' }}>Who viewed your story</div>
        {STORY_VIEWERS.map(v => (
          <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', background: '#222' }}>
                <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${v.seed}&backgroundColor=b6e3f4,c0aede`} alt="" style={{ width: '100%', height: '100%' }} />
              </div>
              {v.liked && <div style={{ position: 'absolute', bottom: -2, right: -2, fontSize: '13px', lineHeight: 1 }}>❤️</div>}
            </div>
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{v.name}</span>
            <button style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '16px' }}>•••</button>
            <button style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </div>
        ))}
        <div style={{ height: '40px' }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PROFILE PAGE
───────────────────────────────────────────── */
export default function ProfilePage() {
  const params = useParams();
  const username = (params?.username as string) ?? OWN_USERNAME;
  const isOwn = username === OWN_USERNAME;

  const [tab, setTab] = useState(0);
  const [following, setFollowing] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storyStatsOpen, setStoryStatsOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const avatarUrl = `https://api.dicebear.com/8.x/avataaars/svg?seed=${isOwn ? 'amina' : 'pix3lstar'}&backgroundColor=b6e3f4,c0aede`;
  const bioFull = isOwn
    ? 'Form 4 · KCSE 2026 🇰🇪\nFuture Engineer 🚀 | Biology & Maths nerd\n🔥 15 day streak'
    : '1st Timothy 4:12\nSwéêt fāçé😋, Sävâgê søûl💜\n@st4rboy_d4ryll hb🙁';
  const bioLines = bioFull.split('\n');
  const bioPreview = bioFull.slice(0, 72);
  const bioTooLong = bioFull.length > 72;

  const stats = isOwn
    ? [['2', 'posts'], ['901', 'followers'], ['1,711', 'following']]
    : [['0', 'posts'], ['377', 'followers'], ['431', 'following']];

  const highlights = isOwn ? OWN_HIGHLIGHTS : OTHER_HIGHLIGHTS;

  const ownTabs = [
    <svg key="g" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
    <svg key="r" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="18" rx="3" /><polygon points="10 8 16 12 10 16 10 8" /></svg>,
    <svg key="x" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>,
    <svg key="t" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="19 21 12 16 5 21 5 3 19 3" /></svg>,
  ];
  const otherTabs = [ownTabs[0], ownTabs[1], ownTabs[3]];
  const tabIcons = isOwn ? ownTabs : otherTabs;

  return (
    <div style={{ background: '#000', color: 'white', minHeight: '100dvh', paddingBottom: '80px' }}>
      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} />}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
      {storyStatsOpen && <StoryStats onClose={() => setStoryStatsOpen(false)} />}

      {/* Gallery modal */}
      {galleryOpen && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={() => setGalleryOpen(false)} style={{ color: 'white', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            <span style={{ fontWeight: 700, fontSize: '16px' }}>New Post</span>
            <button style={{ color: '#3B82F6', background: 'none', border: 'none', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>Next</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px', flex: 1, overflowY: 'auto' }}>
            {OWN_GRID.map((src, i) => (
              <div key={i} style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer' }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create sheet */}
      {createOpen && (
        <div onClick={() => setCreateOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', background: '#1C1C1E', borderRadius: '20px 20px 0 0', paddingBottom: '40px' }}>
            <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.18)', borderRadius: '2px', margin: '12px auto 4px' }} />
            <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 700, padding: '8px 0 12px', margin: 0 }}>Create</h2>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            {[
              { emoji: '🎬', label: 'Reel', desc: 'Share your short study video or clip', action: () => { setCreateOpen(false); setGalleryOpen(true); } },
              { emoji: '⊞', label: 'Post', desc: 'Upload a picture or study note', action: () => { setCreateOpen(false); setGalleryOpen(true); } },
              { emoji: '⊕', label: 'Story', desc: 'Share a quick study update', action: () => setCreateOpen(false) },
              { emoji: '♡', label: 'Highlights', desc: 'Pin your best study moments', action: () => setCreateOpen(false) },
            ].map((item, i) => (
              <button key={i} onClick={item.action} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'white' }}>
                <span style={{ fontSize: '22px' }}>{item.emoji}</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '1px' }}>{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div className="top-bar">
        {isOwn ? (
          <>
            <button onClick={() => setCreateOpen(true)} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>+</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>amina_learns</span>
              <span style={{ color: '#666', fontSize: '10px' }}>▾</span>
            </div>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <button style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="9" r="2" /><circle cx="15" cy="9" r="2" /><circle cx="15" cy="15" r="2" /><circle cx="9" cy="15" r="2" /></svg>
              </button>
              <button onClick={() => setSettingsOpen(true)} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              </button>
            </div>
          </>
        ) : (
          <>
            <Link href="/feed" style={{ color: 'white', display: 'flex' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <span style={{ fontWeight: 700, fontSize: '16px' }}>{username}</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              </button>
              <button style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── PROFILE INFO ── */}
      <div style={{ padding: '16px' }}>
        {/* Avatar + Stats */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '14px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* Music pill */}
            <div style={{ position: 'absolute', top: -20, left: -6, zIndex: 10, background: 'rgba(18,18,18,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '5px 10px 5px 5px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'white', fontWeight: 600, maxWidth: '112px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.7)' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'linear-gradient(135deg,#3B82F6,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '9px' }}>♫</div>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isOwn ? 'worth Drake, P...' : 'Try sharing...'}</span>
            </div>
            {/* Avatar */}
            <div style={{ width: '84px', height: '84px', borderRadius: '50%', overflow: 'hidden', background: '#222', border: '2px solid rgba(255,255,255,0.08)' }}>
              <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {isOwn && (
              <button onClick={() => setCreateOpen(true)} style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: '#3B82F6', border: '2.5px solid #000', color: 'white', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>+</button>
            )}
          </div>
          {/* Stats */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            {stats.map(([v, l]) => (
              <button key={l} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '2px 6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{v}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>{l}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Name + pronouns */}
        {isOwn ? (
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Amina Wanjiku</div>
        ) : (
          <div style={{ marginBottom: '4px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>M4dne3ss._.mp4😝✨</span>
            <span style={{ fontSize: '12px', color: '#999', background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: '999px' }}>her/she/them</span>
          </div>
        )}

        {/* Bio */}
        <div style={{ fontSize: '13.5px', lineHeight: 1.6, marginBottom: '10px' }}>
          {(showMore ? bioLines : [bioPreview]).map((line, i) => (
            <div key={i}>
              {line.split(/(@\w+)/g).map((part, j) =>
                part.startsWith('@') ? <span key={j} style={{ color: '#60a5fa' }}>{part}</span> : part
              )}
            </div>
          ))}
          {bioTooLong && !showMore && (
            <button onClick={() => setShowMore(true)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '13.5px', cursor: 'pointer', padding: 0, fontWeight: 600 }}>... more</button>
          )}
        </div>

        {/* Music player (other) */}
        {!isOwn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px' }}>
            <span style={{ color: '#888' }}>▷</span>
            <span style={{ fontWeight: 600 }}>Jaa Jaa</span>
            <span style={{ color: '#888' }}>Toxic Lyrikali</span>
          </div>
        )}

        {/* Add banners (own) */}
        {isOwn && (
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'white', fontSize: '14px', fontWeight: 500, cursor: 'pointer', marginBottom: '12px', padding: 0 }}>
            + Add banners
          </button>
        )}

        {/* Mutual followers (other) */}
        {!isOwn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex' }}>
              {['juliet', 'wanjiii'].map((s, i) => (
                <img key={s} src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${s}&backgroundColor=b6e3f4`} alt=""
                  style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid #000', marginLeft: i > 0 ? '-6px' : 0, background: '#333' }} />
              ))}
            </div>
            <span style={{ fontSize: '12px', color: '#999', lineHeight: 1.4 }}>
              Followed by <span style={{ color: 'white', fontWeight: 600 }}>callme_.juliet</span>, <span style={{ color: 'white', fontWeight: 600 }}>_wanjiii_.ru</span> and 72 others
            </span>
          </div>
        )}

        {/* Action buttons */}
        {isOwn ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setEditOpen(true)} style={{ flex: 1, padding: '9px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}>Edit profile</button>
            <button style={{ flex: 1, padding: '9px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}>Share profile</button>
            <button style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', cursor: 'pointer' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setFollowing(f => !f)} style={{ flex: 1, padding: '9px', borderRadius: '10px', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', background: following ? 'rgba(255,255,255,0.07)' : 'transparent', border: '1px solid ' + (following ? 'rgba(255,255,255,0.15)' : '#22C55E'), color: following ? 'white' : '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              {following ? 'Following' : 'Follow'} <span style={{ fontSize: '10px' }}>▾</span>
            </button>
            <button style={{ flex: 1, padding: '9px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}>Message</button>
          </div>
        )}
      </div>

      {/* ── DISCOVER PEOPLE (own) ── */}
      {isOwn && (
        <div style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Discover people</span>
            <button style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>See All</button>
          </div>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '0 16px 12px', scrollbarWidth: 'none' }}>
            {DISCOVER.filter(p => !dismissed.has(p.id)).map(p => (
              <div key={p.id} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px 12px', minWidth: '138px', maxWidth: '138px', textAlign: 'center', position: 'relative', flexShrink: 0 }}>
                <button onClick={() => setDismissed(s => new Set([...s, p.id]))} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>✕</button>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 8px', background: '#333' }}>
                  <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${p.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`} alt="" style={{ width: '100%', height: '100%' }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>{p.mutuals} mutual{p.mutuals !== 1 ? 's' : ''}</div>
                <button onClick={() => setFollowMap(m => ({ ...m, [p.id]: !m[p.id] }))} style={{ width: '100%', padding: '7px', borderRadius: '8px', background: followMap[p.id] ? 'rgba(255,255,255,0.08)' : '#3B82F6', border: followMap[p.id] ? '1px solid rgba(255,255,255,0.15)' : 'none', color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {followMap[p.id] ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STORY HIGHLIGHTS ── */}
      <div style={{ overflowX: 'auto', scrollbarWidth: 'none', padding: '6px 16px 16px' }}>
        <div style={{ display: 'flex', gap: '16px', width: 'max-content' }}>
          {isOwn && (
            <button onClick={() => setCreateOpen(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1.5px dashed rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </div>
              <span style={{ fontSize: '10.5px', color: '#999' }}>New</span>
            </button>
          )}
          {highlights.map(h => (
            <button key={h.id} onClick={isOwn ? () => setStoryStatsOpen(true) : undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: h.color, border: '2px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
                {h.emoji}
              </div>
              <span style={{ fontSize: '10.5px', color: '#999', maxWidth: '68px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{h.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: '54px', background: '#000', zIndex: 10 }}>
        {tabIcons.map((icon, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ flex: 1, padding: '12px 4px', background: 'none', border: 'none', cursor: 'pointer', color: tab === i ? 'white' : '#555', borderBottom: tab === i ? '1.5px solid white' : '1.5px solid transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}>
            {icon}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      {tab === 0 && isOwn && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px' }}>
          {OWN_GRID.map((src, i) => (
            <div key={i} style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
              {i === 0 && (
                <div style={{ position: 'absolute', top: '6px', left: '6px', zIndex: 2 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                </div>
              )}
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' }} />
            </div>
          ))}
        </div>
      )}
      {tab === 0 && !isOwn && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px', textAlign: 'center' }}>
          <div style={{ width: '76px', height: '76px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>No posts yet</span>
        </div>
      )}
      {tab > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '12px', color: '#555' }}>
          <span style={{ fontSize: '40px' }}>📱</span>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Nothing here yet</span>
        </div>
      )}
    </div>
  );
}
