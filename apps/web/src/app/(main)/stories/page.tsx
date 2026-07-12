'use client';
import { useState, useEffect, useRef } from 'react';

/* ── Data ── */
const STORIES = [
  {
    id: 's1', username: 'baraka_savo', seed: 'baraka', time: '13h',
    music: 'Musica in Armonia · W.A.Mozart (Requiem K...',
    image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&q=80',
    caption: '🐶💕💕 Mr.Savo',
    reactions: ['❤️', '🙌', '🔥', '🌮', '😢', '😍', '😮', '😂'],
    viewers: 32,
  },
  {
    id: 's2', username: 'amina_learns', seed: 'amina', time: '2h',
    music: 'worth · Drake, Playboi Carti',
    image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&q=80',
    caption: 'Study mode activated 🔥',
    reactions: ['❤️', '🙌', '🔥', '🌮', '😢', '😍', '😮', '😂'],
    viewers: 18,
  },
  {
    id: 's3', username: 'pix3lstar4', seed: 'pix3l', time: '5h',
    music: 'Jaa Jaa · Toxic Lyrikali',
    image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=600&q=80',
    caption: 'Swéêt fāçé😋💜',
    reactions: ['❤️', '🙌', '🔥', '🌮', '😢', '😍', '😮', '😂'],
    viewers: 97,
  },
];

/* ── Story Creator ── */
function StoryCreator({ onClose, onPost }: { onClose: () => void; onPost: () => void }) {
  const [caption, setCaption] = useState('');
  const [text, setText] = useState('');
  const [textMode, setTextMode] = useState(false);
  const [selectedImage] = useState('https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&q=80');

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '50px 16px 16px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <button onClick={onClose} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px' }}>✕</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
          {[
            { icon: 'Aa', action: () => setTextMode(t => !t) },
            { icon: '😊' },
            { icon: '🎵' },
            { icon: '✏️' },
            { icon: '⌄' },
          ].map(({ icon, action }) => (
            <button key={icon} onClick={action} style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', fontSize: icon === 'Aa' ? '13px' : '18px', fontWeight: icon === 'Aa' ? 700 : 400 }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Image fill */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <img src={selectedImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.5) 100%)' }} />
        {/* Text overlay */}
        {textMode && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '80%', textAlign: 'center' }}>
            <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: '12px', padding: '12px 16px', display: 'inline-block' }}>
              <input value={text} onChange={e => setText(e.target.value)} placeholder="Add text..." autoFocus style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '24px', fontWeight: 700, textAlign: 'center', width: '100%', fontFamily: 'inherit' }} />
            </div>
          </div>
        )}
        {/* Caption at bottom */}
        <div style={{ position: 'absolute', bottom: '80px', left: '16px', right: '16px' }}>
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Add a caption..." style={{ background: 'none', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '17px', width: '100%', fontFamily: 'inherit', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }} />
        </div>
      </div>

      {/* Bottom action bar */}
      <div style={{ padding: '12px 16px 36px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.9)' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '24px', padding: '10px 18px', color: 'white', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden' }}>
            <img src="https://api.dicebear.com/8.x/avataaars/svg?seed=amina&backgroundColor=b6e3f4" alt="" style={{ width: '100%', height: '100%' }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Your story</span>
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: '24px', padding: '10px 18px', color: '#22C55E', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
          <span style={{ fontSize: '14px' }}>⭐</span>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Close Friends</span>
        </button>
        <button onClick={onPost} style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#3B82F6', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 16px rgba(59,130,246,0.5)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  );
}

/* ── Story Viewer ── */
function StoryViewer({ stories, startIndex, onClose }: { stories: typeof STORIES; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const story = stories[idx];
  if (!story) return null;
  const DURATION = 5000;

  useEffect(() => {
    setProgress(0);
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (idx < stories.length - 1) { setIdx(i => i + 1); return 0; }
          else { onClose(); return 100; }
        }
        return p + (100 / (DURATION / 100));
      });
    }, 100);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [idx, paused]);

  const goNext = () => { if (idx < stories.length - 1) { setIdx(i => i + 1); setProgress(0); } else onClose(); };
  const goPrev = () => { if (idx > 0) { setIdx(i => i - 1); setProgress(0); } };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 400, display: 'flex', flexDirection: 'column' }}>
      {/* Progress bars */}
      <div style={{ position: 'absolute', top: '50px', left: '12px', right: '12px', display: 'flex', gap: '4px', zIndex: 10 }}>
        {stories.map((s, i) => (
          <div key={s.id} style={{ flex: 1, height: '2.5px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'white', width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%', transition: i === idx ? 'none' : 'none' }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '60px 14px 14px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 10 }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', flexShrink: 0 }}>
          <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${story.seed}&backgroundColor=b6e3f4`} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'white' }}>{story.username}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)' }}>{story.time}</div>
        </div>
        {/* Music pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.5)', borderRadius: '20px', padding: '4px 10px 4px 6px', maxWidth: '140px', overflow: 'hidden' }}>
          <span style={{ fontSize: '10px' }}>♫</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.music}</span>
        </div>
        <button style={{ color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '2px', fontSize: '18px' }}>≡</button>
        <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px' }}>✕</button>
      </div>

      {/* Tap zones */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 5 }}>
        <div style={{ flex: 1 }} onClick={goPrev} onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)} />
        <div style={{ flex: 1 }} onClick={goNext} onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)} />
      </div>

      {/* Image */}
      <div style={{ flex: 1, position: 'relative' }}>
        <img src={story.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 25%, transparent 65%, rgba(0,0,0,0.6) 100%)' }} />
        {/* Caption bubble */}
        {story.caption && (
          <div style={{ position: 'absolute', bottom: '100px', left: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden' }}>
                <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${story.seed}&backgroundColor=b6e3f4`} alt="" style={{ width: '100%', height: '100%' }} />
              </div>
              <div style={{ background: 'rgba(0,0,0,0.65)', borderRadius: '20px', padding: '8px 14px', color: 'white', fontSize: '14px', fontWeight: 500 }}>
                {story.caption}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reaction row */}
      <div style={{ position: 'absolute', bottom: '72px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px', zIndex: 10, padding: '0 10px' }}>
        {story.reactions.map(r => (
          <button key={r} onClick={() => setLiked(s => { const n = new Set(s); n.has(r) ? n.delete(r) : n.add(r); return n; })}
            style={{ fontSize: '22px', background: 'none', border: 'none', cursor: 'pointer', transform: liked.has(r) ? 'scale(1.3)' : 'scale(1)', transition: 'transform 0.15s', filter: liked.has(r) ? 'drop-shadow(0 0 6px rgba(255,255,255,0.5))' : 'none' }}>
            {r}
          </button>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: '10px 12px 28px', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '24px', display: 'flex', alignItems: 'center', padding: '10px 16px' }}>
            <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Join the conversation..." style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '14px', flex: 1, fontFamily: 'inherit' }} />
            <button style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', padding: 0 }}>😊</button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>, label: 'Activity' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>, label: 'Share' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>, label: 'Send' },
              { icon: <span style={{ fontSize: '14px' }}>@</span>, label: 'Mention' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>, label: 'More' },
            ].map(({ icon, label }) => (
              <button key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
                {icon}
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── STORIES PAGE ── */
export default function StoriesPage() {
  const [viewing, setViewing] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [posted, setPosted] = useState(false);

  if (creating) {
    return <StoryCreator onClose={() => setCreating(false)} onPost={() => { setCreating(false); setPosted(true); }} />;
  }

  if (viewing !== null) {
    return <StoryViewer stories={STORIES} startIndex={viewing} onClose={() => setViewing(null)} />;
  }

  return (
    <div style={{ background: '#000', color: 'white', minHeight: '100dvh', paddingBottom: '80px' }}>
      {/* Header */}
      <div className="top-bar">
        <div style={{ fontWeight: 700, fontSize: '18px' }}>Stories</div>
        <button onClick={() => setCreating(true)} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      </div>

      {/* Your Story */}
      <div style={{ padding: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '14px', color: '#ccc' }}>Your story</div>
        <button onClick={() => setCreating(true)} style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0 0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: '58px', height: '58px', borderRadius: '50%', overflow: 'hidden', background: '#222' }}>
              <img src="https://api.dicebear.com/8.x/avataaars/svg?seed=amina&backgroundColor=b6e3f4" alt="" style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', background: '#3B82F6', border: '2.5px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </div>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>Add to story</div>
            <div style={{ color: '#888', fontSize: '13px', marginTop: '2px' }}>{posted ? 'Your story • Tap to view' : 'Share a photo, video or text'}</div>
          </div>
        </button>
      </div>

      {/* Other stories */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '14px', color: '#ccc' }}>All stories</div>
        {STORIES.map((story, i) => (
          <button key={story.id} onClick={() => setViewing(i)} style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {/* Avatar with gradient ring */}
            <div style={{ width: '58px', height: '58px', borderRadius: '50%', padding: '2px', background: 'linear-gradient(135deg,#f472b6,#7c3aed,#3b82f6)', flexShrink: 0 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #000' }}>
                <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${story.seed}&backgroundColor=b6e3f4`} alt="" style={{ width: '100%', height: '100%' }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>{story.username}</div>
              <div style={{ color: '#888', fontSize: '13px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.time} • {story.music}</div>
            </div>
            <div style={{ color: '#555' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
          </button>
        ))}
      </div>

      {/* Story circles at top (horizontal scroll preview) */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '12px', color: '#ccc' }}>Quick view</div>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
          <button onClick={() => setCreating(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1.5px dashed rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </div>
            <span style={{ fontSize: '10.5px', color: '#888' }}>Your story</span>
          </button>
          {STORIES.map((story, i) => (
            <button key={story.id} onClick={() => setViewing(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', padding: '2px', background: 'linear-gradient(135deg,#f472b6,#7c3aed,#3b82f6)' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid #000' }}>
                  <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${story.seed}&backgroundColor=b6e3f4`} alt="" style={{ width: '100%', height: '100%' }} />
                </div>
              </div>
              <span style={{ fontSize: '10.5px', color: '#888', maxWidth: '68px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.username}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
