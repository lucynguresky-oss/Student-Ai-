'use client';
import { useState } from 'react';

interface Post {
  id: string;
  author: { name: string; username: string; seed: string; verified?: boolean };
  subject?: string;
  body?: string;
  mediaUrl?: string;
  likes: number;
  comments: number;
  timeAgo: string;
}

export function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showHeart, setShowHeart] = useState(false);

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => newLiked ? c + 1 : c - 1);
    if (newLiked) { setShowHeart(true); setTimeout(() => setShowHeart(false), 800); }
  };

  const avatarUrl = `https://api.dicebear.com/8.x/avataaars/svg?seed=${post.author.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  return (
    <article className="post-card fade-up">
      {/* Header */}
      <div className="post-header">
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ position:'relative' }}>
            <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'var(--grad-ig)', padding:'2px' }}>
              <div style={{ width:'100%', height:'100%', borderRadius:'50%', border:'2px solid var(--bg)', overflow:'hidden' }}>
                <img src={avatarUrl} alt={post.author.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            </div>
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'4px', fontWeight:600, fontSize:'13.5px' }}>
              {post.author.username}
              {post.author.verified && <span style={{ color:'var(--blue)', fontSize:'14px' }}>✓</span>}
            </div>
            <div style={{ fontSize:'11px', color:'var(--text2)' }}>
              {post.subject && <span style={{ color:'var(--teal)' }}>{post.subject} · </span>}
              {post.timeAgo}
            </div>
          </div>
        </div>
        <button style={{ color:'var(--text2)', fontSize:'20px', padding:'4px 8px' }}>⋯</button>
      </div>

      {/* Media */}
      {post.mediaUrl ? (
        <div style={{ position:'relative' }} onDoubleClick={handleLike}>
          <img src={post.mediaUrl} alt="Post" className="post-media" />
          {showHeart && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <span style={{ fontSize:'80px', animation:'heartBeat 0.4s ease-out', filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>❤️</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding:'8px 12px 12px', fontSize:'15px', lineHeight:1.55 }}>{post.body}</div>
      )}

      {/* Actions */}
      <div className="post-actions">
        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
          <button className="post-action-btn" onClick={handleLike}>
            <svg viewBox="0 0 24 24" fill={liked ? '#EF4444' : 'none'} stroke={liked ? '#EF4444' : 'currentColor'}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button className="post-action-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button className="post-action-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <button className="post-action-btn" onClick={() => setSaved(s => !s)}>
          <svg viewBox="0 0 24 24" fill={saved ? 'white' : 'none'} stroke="currentColor">
            <polygon points="19 21 12 16 5 21 5 3 19 3"/>
          </svg>
        </button>
      </div>

      {/* Counts & Caption */}
      <div style={{ padding:'0 12px 12px', fontSize:'13.5px' }}>
        <div style={{ fontWeight:700, marginBottom:'4px' }}>{likeCount.toLocaleString()} likes</div>
        {post.mediaUrl && post.body && (
          <div style={{ marginBottom:'4px', lineHeight:1.4 }}>
            <span style={{ fontWeight:700, marginRight:'6px' }}>{post.author.username}</span>
            <span style={{ color:'var(--text2)' }}>{post.body}</span>
          </div>
        )}
        <button style={{ color:'var(--text3)', fontSize:'13px', display:'block', margin:'2px 0' }}>
          View all {post.comments} comments
        </button>
        <div style={{ color:'var(--text3)', fontSize:'10px', marginTop:'4px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{post.timeAgo}</div>
      </div>
    </article>
  );
}
