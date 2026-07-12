'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';

/* ─────────────────────────────────────────────────────────────────────────────
   CLIPS / VIDEO PAGE
   - Like toggle (animated red heart)
   - Comment slide-up overlay panel
   - Save toggle (bookmark state)
   - Avatar + @handle → routes to /profile?u=username
   - AI Explain + Test Me buttons
───────────────────────────────────────────────────────────────────────────── */

const CLIPS = [
  { id: 'c1', author: { username: 'mr_omondi', seed: 'omondi' }, subject: 'Biology · Form 4', description: 'Photosynthesis explained in 60 seconds! Light-dependent vs light-independent reactions. Save this for your KCSE revision! 🌿 #Biology #KCSE', likes: 12400, comments: 340, shares: 890, bg: 'linear-gradient(160deg, #0f2027, #203a43, #2c5364)', emoji: '🧬' },
  { id: 'c2', author: { username: 'mathwiz_ke', seed: 'math' }, subject: 'Mathematics', description: 'The quadratic formula trick that changed my life 📐 No more struggling with completing the square. #Maths #StudyTips', likes: 8900, comments: 215, shares: 430, bg: 'linear-gradient(160deg, #1a1a2e, #16213e, #0f3460)', emoji: '📐' },
  { id: 'c3', author: { username: 'chemdaily_ke', seed: 'chem' }, subject: 'Chemistry', description: 'Why does sodium explode in water? The science behind alkali metal reactivity 🔥 #Chemistry #Science', likes: 24100, comments: 891, shares: 2100, bg: 'linear-gradient(160deg, #2d1b69, #11998e, #38ef7d)', emoji: '🔬' },
  { id: 'c4', author: { username: 'physics_ke', seed: 'physics' }, subject: 'Physics', description: "Newton's 3rd Law explained with real examples from Kenya's daily life 🚀 #Physics #Learnix", likes: 7600, comments: 178, shares: 320, bg: 'linear-gradient(160deg, #0f0c29, #302b63, #24243e)', emoji: '🚀' },
];

const MOCK_COMMENTS: Record<string, Array<{ user: string; seed: string; text: string; likes: number }>> = {};

function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n); }

function CommentPanel({ clipId, onClose }: { clipId: string; onClose: () => void }) {
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState(MOCK_COMMENTS[clipId] ?? []);
  const { addXP } = useStore();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLocalComments(c => [{ user: 'amina_learns', seed: 'amina', text: newComment, likes: 0 }, ...c]);
    setNewComment('');
    addXP(5);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'rgba(0,0,0,0.5)', position: 'absolute', inset: 0 }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#1A1A1A', borderRadius: '20px 20px 0 0', maxHeight: '70dvh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 12px' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{localComments.length} comments</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 20 }}>✕</button>
        </div>

        {/* Comments list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px' }}>
          {localComments.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${c.seed}`} alt="" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, marginRight: 6 }}>{c.user}</span>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 11 }}>❤️ {c.likes}</button>
                </div>
                <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, marginTop: 2 }}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={submit} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid var(--border)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=amina`} alt="" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
          <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: 20, padding: '9px 14px', color: 'white', fontSize: 14, outline: 'none' }} />
          <button type="submit" disabled={!newComment.trim()} style={{ background: 'none', border: 'none', color: newComment.trim() ? '#3B82F6' : 'rgba(59,130,246,0.4)', fontWeight: 700, fontSize: 14, cursor: newComment.trim() ? 'pointer' : 'default' }}>Post</button>
        </form>
      </div>
    </div>
  );
}

function ClipItem({ clip }: { clip: typeof CLIPS[0] }) {
  const { likedPosts, savedPosts, toggleLike, toggleSave, addXP, followedUsers, toggleFollow } = useStore();
  const liked = likedPosts.has(clip.id);
  const saved = savedPosts.has(clip.id);
  const [localLikes, setLocalLikes] = useState(clip.likes);
  const [commentOpen, setCommentOpen] = useState(false);

  const handleLike = () => {
    toggleLike(clip.id);
    setLocalLikes(n => liked ? n - 1 : n + 1);
    if (!liked) addXP(2);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/clips/${clip.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: clip.subject, text: clip.description, url }); }
      catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      alert('Link copied to clipboard!');
    }
  };

  const avatarUrl = `https://api.dicebear.com/8.x/avataaars/svg?seed=${clip.author.seed}&backgroundColor=b6e3f4,c0aede`;
  const isFollowing = followedUsers.has(clip.author.username);

  return (
    <>
      {commentOpen && <CommentPanel clipId={clip.id} onClose={() => setCommentOpen(false)} />}

      <div className="clip-item" style={{ background: clip.bg }}>
        {/* Placeholder emoji background */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 120, opacity: 0.15, userSelect: 'none' }}>{clip.emoji}</span>
        </div>

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)' }} />

        {/* Top tabs */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '48px 16px 12px', display: 'flex', justifyContent: 'center', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: 24, background: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: '6px 16px' }}>
            {['Following', 'For You'].map((t, i) => (
              <span key={t} style={{ fontSize: 15, fontWeight: i === 1 ? 700 : 400, color: i === 1 ? 'white' : 'rgba(255,255,255,0.6)', borderBottom: i === 1 ? '2px solid white' : 'none', paddingBottom: 4 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Bottom left — author + caption */}
        <div className="clip-overlay-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {/* Avatar → routes to profile */}
            <Link href={`/profile?u=${clip.author.username}`} style={{ display: 'block', width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#E1306C,#F58529)', padding: 2, flexShrink: 0 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid black', overflow: 'hidden' }}>
                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </Link>
            <div>
              {/* Handle → routes to profile */}
              <Link href={`/profile?u=${clip.author.username}`} style={{ fontWeight: 700, fontSize: 14, color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                @{clip.author.username}
              </Link>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{clip.subject}</div>
            </div>
            <button
              onClick={() => { toggleFollow(clip.author.username); if (!isFollowing) addXP(1); }}
              style={{ background: isFollowing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {isFollowing ? 'Following ✓' : 'Follow'}
            </button>
          </div>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.9)', lineHeight: 1.45 }}>{clip.description}</p>

          {/* AI Action Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Link href={`/ai-tutor?context=${encodeURIComponent(clip.description)}&mode=explain`} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(59,130,246,0.3)', border: '1px solid rgba(59,130,246,0.5)', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: 'white', textDecoration: 'none' }}>
              🤖 AI Explain
            </Link>
            <Link href={`/learn/quiz/q1?context=${encodeURIComponent(clip.subject)}`} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.3)', border: '1px solid rgba(34,197,94,0.5)', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: 'white', textDecoration: 'none' }}>
              🎯 Test Me
            </Link>
          </div>

          {/* Subject / music bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 13 }}>🎵</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Learnix · {clip.subject}</span>
          </div>
        </div>

        {/* Right rail — action buttons */}
        <div className="clip-overlay-right">
          {/* Like */}
          <button onClick={handleLike} className="clip-action" style={{ transform: liked ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s' }}>
            <svg viewBox="0 0 24 24" fill={liked ? '#EF4444' : 'rgba(255,255,255,0.9)'} stroke={liked ? 'none' : 'white'} strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>{fmt(localLikes)}</span>
          </button>

          {/* Comment */}
          <button onClick={() => setCommentOpen(true)} className="clip-action">
            <svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" stroke="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{fmt(clip.comments)}</span>
          </button>

          {/* Share */}
          <button onClick={handleShare} className="clip-action">
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span>{fmt(clip.shares)}</span>
          </button>

          {/* Save */}
          <button onClick={() => { toggleSave(clip.id); if (!saved) addXP(3); }} className="clip-action">
            <svg viewBox="0 0 24 24" fill={saved ? 'white' : 'rgba(255,255,255,0.9)'} stroke="none">
              <polygon points="19 21 12 16 5 21 5 3 19 3"/>
            </svg>
            <span>Save</span>
          </button>

          {/* Spinning avatar record */}
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--surface)', border: '3px solid rgba(255,255,255,0.3)', overflow: 'hidden', animation: 'spin 4s linear infinite' }}>
            <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </div>
    </>
  );
}

export default function ClipsPage() {
  return (
    <div className="clips-container" style={{ paddingBottom: 0 }}>
      {CLIPS.map(clip => (
        <ClipItem key={clip.id} clip={clip} />
      ))}
    </div>
  );
}
