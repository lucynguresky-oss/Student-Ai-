'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/lib/auth-store';
import { apiFetch } from '@/lib/api';

interface Post {
  id: string;
  author: { name: string; username: string; seed: string; verified?: boolean };
  subject: string;
  body: string;
  mediaUrl?: string;
  likes: number;
  comments: number;
  timeAgo: string;
  quizId?: string;
}

interface Question {
  id: string;
  prompt: string;
  options: Array<{ id: string; text: string }>;
  marks: number;
}

function RetentionQuiz({ quizId, onComplete }: { quizId: string; onComplete: (xp: number) => void }) {
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<{
    isCorrect: boolean;
    correctOptionId: string;
    explanation: string;
    xpAwarded: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch(`/quizzes/${quizId}`)
      .then((res: any) => {
        if (!active) return;
        const q = res.data?.questions?.[0];
        if (q) {
          setQuestion({
            id: q.id,
            prompt: q.prompt,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
            marks: q.marks,
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load quiz:', err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [quizId]);

  const handleOptionSelect = async (optionId: string) => {
    if (selectedOptionId) return; // locked after answer
    setSelectedOptionId(optionId);
    
    if (!question) return;
    try {
      const res = await apiFetch(`/quizzes/${quizId}/answer`, {
        method: 'POST',
        body: JSON.stringify({
          questionId: question.id,
          answerOptionId: optionId,
        }),
      });
      const data = res.data;
      setQuizResult(data);
      if (data.xpAwarded > 0) {
        onComplete(data.xpAwarded);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text2)', fontSize: '13px' }}>
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>🔄</span> Loading quiz...
      </div>
    );
  }

  if (!question) return null;

  return (
    <div style={{
      background: 'rgba(245, 158, 11, 0.04)',
      border: '1px solid rgba(245, 158, 11, 0.15)',
      borderRadius: '16px',
      padding: '16px',
      margin: '12px',
      boxShadow: 'inset 0 1px 2px rgba(245, 158, 11, 0.05)'
    }}>
      {/* Label with amber color and brain icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <span style={{ fontSize: '16px' }}>🧠</span>
        <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Instant Video Retention Test
        </span>
      </div>

      {/* Question Stem in Serif font */}
      <h3 style={{
        fontFamily: "'Literata', Georgia, serif",
        fontSize: '16px',
        fontWeight: 600,
        lineHeight: 1.45,
        color: 'var(--text)',
        marginBottom: '14px'
      }}>
        {question.prompt}
      </h3>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {question.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const isCorrectAnswer = quizResult?.correctOptionId === opt.id;
          const isWrongAnswer = isSelected && quizResult && !quizResult.isCorrect;

          let optionStyle: React.CSSProperties = {
            width: '100%',
            textAlign: 'left',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: '13.5px',
            lineHeight: '1.4',
            cursor: selectedOptionId ? 'default' : 'pointer',
            transition: 'all 0.2s',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          };

          if (!selectedOptionId) {
            // Hover states applied programmatically or fallback
            optionStyle.background = 'rgba(255, 255, 255, 0.02)';
          } else if (isCorrectAnswer) {
            optionStyle.border = '2px solid #22C55E';
            optionStyle.background = 'rgba(34, 197, 94, 0.08)';
            optionStyle.color = '#22C55E';
            optionStyle.fontWeight = 600;
          } else if (isWrongAnswer) {
            optionStyle.border = '2px solid #EF4444';
            optionStyle.background = 'rgba(239, 68, 68, 0.08)';
            optionStyle.color = '#EF4444';
            optionStyle.fontWeight = 600;
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleOptionSelect(opt.id)}
              disabled={!!selectedOptionId}
              style={optionStyle}
            >
              <span>{opt.text}</span>
              {selectedOptionId && isCorrectAnswer && <span style={{ color: '#22C55E', fontWeight: 'bold' }}>✓ Correct</span>}
              {selectedOptionId && isWrongAnswer && <span style={{ color: '#EF4444', fontWeight: 'bold' }}>✗ Incorrect</span>}
            </button>
          );
        })}
      </div>

      {/* Explanation & Result */}
      {quizResult && (
        <div style={{
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid rgba(245, 158, 11, 0.1)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: quizResult.isCorrect ? '#22C55E' : '#EF4444'
            }}>
              {quizResult.isCorrect ? '🎉 Correct Answer!' : '😢 Nice Try!'}
            </span>
            {quizResult.isCorrect && (
              <span style={{ fontSize: '11px', background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                +{quizResult.xpAwarded} XP
              </span>
            )}
          </div>
          <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text2)' }}>
            {quizResult.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const { likedPosts, savedPosts, toggleLike, toggleSave, addXP } = useStore();
  const authUser = useAuthStore((state) => state.currentUser);
  
  const liked = likedPosts.has(post.id);
  const saved = savedPosts.has(post.id);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likes);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    toggleLike(post.id);
    const newLiked = !liked;
    setLocalLikes(n => newLiked ? n + 1 : n - 1);
    
    try {
      await apiFetch(`/posts/${post.id}/react`, {
        method: 'POST',
        body: JSON.stringify({ kind: 'LIKE' }),
      });
      if (newLiked) addXP(2);
    } catch (err) {
      console.error('Failed to react:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    toggleSave(post.id);
    
    try {
      await apiFetch(`/posts/${post.id}/save`, {
        method: 'POST',
      });
      if (!saved) addXP(3);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: `Learnix: ${post.subject}`, text: post.body, url }); }
      catch { /* user cancelled */ }
    } else if (typeof navigator !== 'undefined') {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const loadComments = async () => {
    if (commentsLoaded) return;
    try {
      const res = await apiFetch(`/posts/${post.id}/comments`);
      setComments(res.data || []);
      setCommentsLoaded(true);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const bodyVal = commentText;
    setCommentText('');

    // Optimistic UI update
    const tempComment = {
      id: `temp_${Date.now()}`,
      body: bodyVal,
      createdAt: new Date().toISOString(),
      author: {
        username: authUser?.username || 'you',
        displayName: authUser?.displayName || 'You',
      },
    };
    setComments(prev => [...prev, tempComment]);

    try {
      const res = await apiFetch(`/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: bodyVal }),
      });
      addXP(5);
      // Replace with real comment from DB
      setComments(prev => prev.map(c => c.id === tempComment.id ? res.data : c));
    } catch (err) {
      console.error('Failed to post comment:', err);
      // Remove optimistic comment on failure
      setComments(prev => prev.filter(c => c.id !== tempComment.id));
    }
  };

  const handleToggleComments = () => {
    const nextOpen = !commentOpen;
    setCommentOpen(nextOpen);
    if (nextOpen) {
      loadComments();
    }
  };

  return (
    <article style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
        <Link href={`/profile?u=${post.author.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid #E1306C', padding: 2, overflow: 'hidden' }}>
            <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${post.author.seed}`} alt={post.author.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>{post.author.username}</span>
              {post.author.verified && <span style={{ color: '#3B82F6', fontSize: 12 }}>✓</span>}
            </div>
            <div style={{ fontSize: 11, color: '#18D6C8' }}>{post.subject}</div>
          </div>
        </Link>
        <button style={{ background: 'none', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer', padding: 4 }}>⋯</button>
      </div>

      {/* Image / Video Media */}
      {post.mediaUrl && (
        <div style={{ position: 'relative' }}>
          {post.mediaUrl.endsWith('.mp4') || post.mediaUrl.includes('mux.dev') ? (
            <video
              src={post.mediaUrl}
              controls
              playsInline
              style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <img src={post.mediaUrl} alt={post.subject} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block' }} />
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={handleLike} disabled={isLiking} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 26, lineHeight: 1, transition: 'transform 0.15s', transform: liked ? 'scale(1.2)' : 'scale(1)' }}>
            {liked ? '❤️' : '🤍'}
          </button>
          <button onClick={handleToggleComments} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 24, lineHeight: 1 }}>💬</button>
          <button onClick={handleShare} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 22, lineHeight: 1 }}>↗️</button>
          
          {post.quizId && (
            <button
              onClick={() => setShowQuiz(q => !q)}
              style={{
                background: showQuiz ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                color: '#F59E0B',
                padding: '4px 10px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <span>🧠</span> {showQuiz ? 'Close test' : 'Test me'}
            </button>
          )}
        </div>
        <button onClick={handleSave} disabled={isSaving} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 24, lineHeight: 1, color: saved ? '#3B82F6' : 'inherit', transition: 'transform 0.15s', transform: saved ? 'scale(1.15)' : 'scale(1)' }}>
          {saved ? '📌' : '🔖'}
        </button>
      </div>

      {/* Meta */}
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>{localLikes.toLocaleString()} likes</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 4 }}>
          <Link href={`/profile?u=${post.author.username}`} style={{ fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>{post.author.username} </Link>
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>{post.body}</span>
        </div>
        
        {post.comments > 0 && !commentOpen && (
          <button onClick={handleToggleComments} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', padding: 0 }}>
            View all {post.comments} comments
          </button>
        )}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{post.timeAgo} ago</div>
      </div>

      {/* Retention Quiz Panel */}
      {showQuiz && post.quizId && (
        <RetentionQuiz quizId={post.quizId} onComplete={(xpAmt) => addXP(xpAmt)} />
      )}

      {/* Comment Panel */}
      {commentOpen && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          {/* Comments list */}
          <div style={{ maxHeight: 180, overflowY: 'auto', padding: '8px 12px' }}>
            {comments.length === 0 && !commentsLoaded ? (
              <div style={{ padding: '8px 0', fontSize: '12px', color: 'var(--text3)' }}>Loading comments...</div>
            ) : comments.length === 0 ? (
              <div style={{ padding: '8px 0', fontSize: '12px', color: 'var(--text3)' }}>No comments yet. Be the first to explain!</div>
            ) : (
              comments.map((c, i) => (
                <div key={c.id || i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${c.author?.username || 'default'}`} alt="" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text)', marginRight: 6 }}>{c.author?.username}</span>
                    <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)' }}>{c.body}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Input */}
          <form onSubmit={submitComment} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
            <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${authUser?.username || 'default'}`} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13.5 }} />
            <button type="submit" disabled={!commentText.trim()} style={{ background: 'none', border: 'none', color: commentText.trim() ? '#3B82F6' : 'rgba(59,130,246,0.4)', fontWeight: 700, fontSize: 13, cursor: commentText.trim() ? 'pointer' : 'default' }}>Post</button>
          </form>
        </div>
      )}
    </article>
  );
}

export default function FeedPage() {
  const { notifications, markAllNotificationsRead, addXP, followedUsers } = useStore();
  const { currentUser: authUser, accountList, switchAccount } = useAuthStore();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [feedTab, setFeedTab] = useState(0); // 0 = For You, 1 = Following, 2 = Subjects
  const [showNotifs, setShowNotifs] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const switcherRef = useRef<HTMLDivElement>(null);
  const unreadNotifs = notifications.filter(n => !n.read).length;

  // Fetch feed posts dynamically from API
  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch('/posts/feed')
      .then((res: any) => {
        if (!active) return;
        const mapped = (res.data || []).map((p: any) => {
          let bodyText = p.body || '';
          let quizId: string | undefined = undefined;

          // Parse JSON bodies (used in seeded video quiz post)
          if (bodyText.startsWith('{')) {
            try {
              const parsed = JSON.parse(bodyText);
              bodyText = parsed.text || bodyText;
              quizId = parsed.quizId;
            } catch {
              // Ignore
            }
          }

          const authorName = p.author?.profile?.displayName || p.author?.profile?.username || 'Unknown';
          const authorUsername = p.author?.profile?.username || 'unknown';
          const authorSeed = authorUsername.split('.')[0] || 'default';

          let mediaUrl: string | undefined = undefined;
          if (p.media && p.media.length > 0) {
            mediaUrl = p.media[0].url;
          } else if (p.video?.thumbnailUrl) {
            mediaUrl = p.video.thumbnailUrl;
          }

          // Format time ago
          const createdDate = new Date(p.createdAt);
          const diffMs = Date.now() - createdDate.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);
          
          let timeAgo = 'now';
          if (diffDays > 0) {
            timeAgo = `${diffDays}d`;
          } else if (diffHours > 0) {
            timeAgo = `${diffHours}h`;
          } else if (diffMins > 0) {
            timeAgo = `${diffMins}m`;
          }

          return {
            id: p.id,
            author: {
              name: authorName,
              username: authorUsername,
              seed: authorSeed,
              verified: p.author?.profile?.curriculum === 'KCSE' && (p.author?.profile?.level === 'ALL' || authorUsername === 'sci.with.sam'),
            },
            subject: p.subject?.nameEn || p.level || 'General',
            body: bodyText,
            mediaUrl,
            likes: p._count?.reactions || 0,
            comments: p._count?.comments || 0,
            timeAgo,
            quizId,
          };
        });

        setPosts(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load feed:', err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authUser]); // Re-fetch on active account switch

  // Close switcher on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setSwitcherOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loggedInUserSeed = authUser?.username?.split('.')[0] || 'default';

  const DAILY_BITES = [
    { id: 's0', name: 'Your Bite', seed: loggedInUserSeed, isYou: true },
    { id: 's1', name: 'sci.with.sam', seed: 'sci', hasNew: true },
    { id: 's2', name: 'brian.codes', seed: 'brian', hasNew: true },
    { id: 's3', name: 'kevin.creates', seed: 'kevin', hasNew: false },
  ];

  // Filter posts based on active tab
  let displayedPosts = posts;
  if (feedTab === 1) {
    // Following filter
    displayedPosts = posts.filter(p => followedUsers.has(p.author.username) || p.author.username === 'sci.with.sam');
  }

  return (
    <div>
      {/* ── Top Bar — centered Learnix + account switcher ── */}
      <div className="top-bar" style={{ justifyContent: 'space-between' }}>

        {/* Account Switcher */}
        <div ref={switcherRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setSwitcherOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
          >
            <span style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#18D6C8,#3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Learnix
            </span>
            <span style={{ color: 'white', fontSize: 12, marginTop: 2 }}>▾</span>
          </button>

          {switcherOpen && (
            <div style={{ position: 'absolute', top: '110%', left: 0, background: '#1A1A1A', border: '1px solid var(--border)', borderRadius: 14, width: 220, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', padding: 8 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, padding: '4px 8px 8px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Switch accounts</div>
              {accountList.map(acc => {
                const isActive = acc.username === authUser?.username;
                const seed = acc.username.split('.')[0] || 'default';
                return (
                  <button
                    key={acc.username}
                    onClick={() => {
                      switchAccount(acc.username);
                      setSwitcherOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      background: isActive ? 'rgba(59,130,246,0.12)' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '10px',
                      borderRadius: 10,
                      color: 'white',
                      textAlign: 'left'
                    }}
                  >
                    <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${seed}`} alt="" style={{ width: 36, height: 36, borderRadius: '50%', border: isActive ? '2px solid #3B82F6' : 'none' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{acc.username}</div>
                      {isActive && <div style={{ fontSize: 11, color: '#3B82F6', fontWeight: 600 }}>● Active</div>}
                    </div>
                    {isActive && <span style={{ color: '#22C55E', fontSize: 18 }}>✓</span>}
                  </button>
                );
              })}
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              <button
                onClick={() => {
                  setSwitcherOpen(false);
                  window.location.href = '/login';
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: 10, color: '#3B82F6', fontWeight: 700, fontSize: 14 }}
              >
                + Add account
              </button>
            </div>
          )}
        </div>

        {/* Action Icons */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => { setShowNotifs(o => !o); if (!showNotifs) markAllNotificationsRead(); }} style={{ position: 'relative', color: 'white', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {unreadNotifs > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: '#EF4444', borderRadius: '50%', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadNotifs}</span>
            )}
          </button>
          <Link href="/messages" style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifs && (
        <div style={{ position: 'fixed', top: 52, left: 0, right: 0, maxWidth: 480, margin: '0 auto', zIndex: 100, background: '#1A1A1A', border: '1px solid var(--border)', borderRadius: '0 0 16px 16px', maxHeight: 320, overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications</span>
            <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 18 }}>✕</button>
          </div>
          {notifications.map(n => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', opacity: n.read ? 0.6 : 1 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.read ? 'transparent' : '#3B82F6', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text)' }}>{n.text}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{Math.floor((Date.now() - n.timestamp) / 60000)}m</div>
            </div>
          ))}
        </div>
      )}

      {/* Feed Tabs */}
      <div style={{ display: 'flex', padding: '0 16px', gap: 20, borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        {['For You', 'Following', 'Subjects'].map((tab, i) => (
          <button key={tab} onClick={() => setFeedTab(i)} style={{ padding: '10px 0', fontSize: 14, fontWeight: 600, color: feedTab === i ? 'white' : 'var(--text2)', background: 'none', border: 'none', borderBottom: feedTab === i ? '2px solid white' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Daily Bites */}
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '12px 16px', borderBottom: '1px solid var(--border)', scrollbarWidth: 'none' }}>
        {DAILY_BITES.map(s => (
          <Link key={s.id} href="/stories" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', border: `2.5px solid ${s.hasNew ? '#E1306C' : s.isYou ? '#18D6C8' : 'rgba(255,255,255,0.15)'}`, padding: 2, position: 'relative' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--bg)', overflow: 'hidden' }}>
                <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${s.seed}`} alt={s.name} style={{ width: '100%', height: '100%' }} />
              </div>
              {s.isYou && (
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, background: '#3B82F6', borderRadius: '50%', border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>+</div>
              )}
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: 62, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
          </Link>
        ))}
      </div>

      {/* Posts — filtered by tab */}
      <div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px', fontSize: '20px' }}>🔄</span> Loading feed items...
          </div>
        ) : feedTab === 2 ? (
          <div style={{ padding: '20px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Browse by Subject</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[{ emoji: '🧬', label: 'Biology', color: '#22C55E' }, { emoji: '🧪', label: 'Chemistry', color: '#F59E0B' }, { emoji: '⚛️', label: 'Physics', color: '#3B82F6' }, { emoji: '📐', label: 'Maths', color: '#7C3AED' }].map(s => (
                <Link key={s.label} href={`/subject/${s.label.toLowerCase()}`} style={{ padding: '20px 16px', background: `${s.color}15`, border: `1px solid ${s.color}33`, borderRadius: 14, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 4, transition: 'transform 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                  <span style={{ fontSize: 28 }}>{s.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: s.color }}>{s.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : displayedPosts.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>Your feed is empty</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>Complete onboarding or follow more accounts to see posts!</div>
          </div>
        ) : (
          displayedPosts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}
