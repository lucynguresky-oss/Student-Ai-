'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';

/* ─────────────────────────────────────────────────────────────────────────────
   SEARCH / EXPLORE PAGE
   - Live search with 300 ms debounce → GET /v1/search?q=TERM
   - Results displayed in categories: Subjects, Topics, People
   - Subject cards route to /subject/[id]
   - Trending hashtags are clickable filters
   - Follow buttons wired to global store
───────────────────────────────────────────────────────────────────────────── */

const API = 'http://localhost:4000/v1';

const SUBJECTS = [
  { id: 'biology',     label: 'Biology',     emoji: '🧬', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 'chemistry',   label: 'Chemistry',   emoji: '🧪', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 'physics',     label: 'Physics',     emoji: '⚛️',  color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  { id: 'mathematics', label: 'Mathematics', emoji: '📐', color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  { id: 'english',     label: 'English',     emoji: '📝', color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
];

const TRENDING = [
  { tag: 'KCSE2026',      posts: '18.4K', rank: 1 },
  { tag: 'BiologyNotes',  posts: '9.2K',  rank: 2 },
  { tag: 'MathTricks',    posts: '7.8K',  rank: 3 },
  { tag: 'ChemRevision',  posts: '6.1K',  rank: 4 },
  { tag: 'PhysicsForm4',  posts: '4.5K',  rank: 5 },
];

/* Fallback search data used when API is unreachable */
const FALLBACK_DATA = [
  { type: 'teacher' as const, name: 'Mr. Omondi', username: 'mr_omondi', seed: 'omondi', sub: 'Biology · Form 4', followers: '12.4K' },
  { type: 'teacher' as const, name: 'ChemDaily KE', username: 'chemdaily_ke', seed: 'chem', sub: 'Chemistry', followers: '8.1K' },
  { type: 'topic' as const, name: 'Cell Division & Mitosis', sub: 'Biology · Lesson 4.2', emoji: '🧬' },
  { type: 'topic' as const, name: 'Quadratic Equations', sub: 'Mathematics · Algebra', emoji: '📐' },
  { type: 'topic' as const, name: "Newton's Laws of Motion", sub: 'Physics · Mechanics', emoji: '⚛️' },
  { type: 'topic' as const, name: 'Electrochemistry', sub: 'Chemistry · Periodic Trends', emoji: '🧪' },
];

interface SearchResult {
  type: 'subject' | 'topic' | 'person';
  id?: string;
  name: string;
  description?: string;
  key?: string;
  username?: string;
  avatarSeed?: string;
  followers?: number | string;
  emoji?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  const { followedUsers, toggleFollow } = useStore();
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'subjects' | 'topics' | 'people'>('all');
  const [apiResults, setApiResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);
  const debouncedQuery = useDebounce(query, 300);
  const abortRef = useRef<AbortController | null>(null);

  // Fire API search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setApiResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    setLoading(true);

    fetch(`${API}/search?q=${encodeURIComponent(debouncedQuery.trim())}`, {
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then((data: any) => {
        // Normalize API response — could be { subjects:[], topics:[], people:[] } or flat array
        const results: SearchResult[] = [];

        if (data.subjects) {
          data.subjects.forEach((s: any) => results.push({
            type: 'subject', id: s.id, name: s.name ?? s.label, key: s.key ?? s.id,
            description: s.description, emoji: s.emoji,
          }));
        }
        if (data.topics) {
          data.topics.forEach((t: any) => results.push({
            type: 'topic', id: t.id, name: t.name ?? t.title,
            description: t.subject ?? t.description, emoji: t.emoji ?? '📖',
          }));
        }
        if (data.people) {
          data.people.forEach((p: any) => results.push({
            type: 'person', id: p.id, name: p.displayName ?? p.name,
            username: p.username, avatarSeed: p.avatarSeed ?? p.username,
            followers: p.followers,
          }));
        }

        // If flat array
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            results.push({
              type: item.type ?? 'topic',
              id: item.id,
              name: item.name ?? item.displayName ?? item.title,
              description: item.description ?? item.sub,
              key: item.key,
              username: item.username,
              avatarSeed: item.avatarSeed ?? item.seed ?? item.username,
              followers: item.followers,
              emoji: item.emoji,
            });
          });
        }

        setApiResults(results);
        setApiAvailable(true);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.warn('Search API unavailable, using fallback data', err);
        setApiAvailable(false);
        setLoading(false);
        // Use fallback data filtered client-side
        const q = debouncedQuery.toLowerCase();
        const fallback: SearchResult[] = FALLBACK_DATA
          .filter(item => item.name.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q))
          .map(item => ({
            type: item.type === 'teacher' ? 'person' as const : 'topic' as const,
            name: item.name,
            description: item.sub,
            username: (item as any).username,
            avatarSeed: (item as any).seed,
            followers: (item as any).followers,
            emoji: (item as any).emoji,
          }));
        setApiResults(fallback);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  // Filter results by category
  const filteredResults = apiResults.filter(r => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'subjects') return r.type === 'subject';
    if (activeFilter === 'topics') return r.type === 'topic';
    if (activeFilter === 'people') return r.type === 'person';
    return true;
  });

  // Group results by type for display
  const subjects = filteredResults.filter(r => r.type === 'subject');
  const topics = filteredResults.filter(r => r.type === 'topic');
  const people = filteredResults.filter(r => r.type === 'person');

  const isSearching = debouncedQuery.length > 0;

  const handleTagSearch = (tag: string) => {
    setActiveTag(tag);
    setQuery(tag);
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Top Bar */}
      <div className="top-bar">
        <span style={{ fontWeight: 700, fontSize: 20 }}>Explore</span>
      </div>

      {/* Search Input */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 52, background: 'var(--bg)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', borderRadius: 14, padding: '10px 14px', border: '1px solid var(--border)', transition: 'border-color 0.2s' }}>
          <span style={{ fontSize: 17, color: 'var(--text2)' }}>🔍</span>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveTag(null); }}
            placeholder="Search topics, teachers, subjects..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 15 }}
            autoComplete="off"
          />
          {loading && (
            <div style={{ width: 18, height: 18, border: '2px solid var(--text2)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', flexShrink: 0 }} />
          )}
          {query && !loading && (
            <button onClick={() => { setQuery(''); setActiveTag(null); setActiveFilter('all'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 18, padding: 0, lineHeight: 1 }}>✕</button>
          )}
        </div>
      </div>

      {/* Spinner keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Filter chips (shown when searching) */}
      {isSearching && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {(['all', 'subjects', 'topics', 'people'] as const).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: activeFilter === f ? 'var(--blue)' : 'var(--surface)',
              color: activeFilter === f ? 'white' : 'var(--text2)',
              transition: 'all 0.2s',
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Search Results */}
      {isSearching ? (
        <div>
          {!apiAvailable && (
            <div style={{ padding: '6px 16px', fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⚠️</span> Showing offline results — API unavailable
            </div>
          )}

          {filteredResults.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text2)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔭</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No results found</div>
              <div style={{ fontSize: 13 }}>Try a different search term or subject</div>
            </div>
          ) : (
            <>
              {/* Subjects section */}
              {subjects.length > 0 && (
                <div style={{ padding: '8px 0' }}>
                  <div style={{ padding: '0 16px 8px', fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Subjects</div>
                  {subjects.map((item, i) => (
                    <Link key={`s-${i}`} href={`/subject/${item.key ?? item.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', textDecoration: 'none', color: 'inherit', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                        {item.emoji ?? '📚'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{item.name}</div>
                        {item.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{item.description}</div>}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  ))}
                </div>
              )}

              {/* Topics section */}
              {topics.length > 0 && (
                <div style={{ padding: '8px 0' }}>
                  <div style={{ padding: '0 16px 8px', fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Topics</div>
                  {topics.map((item, i) => (
                    <div key={`t-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => {
                        if (item.key) window.location.href = `/subject/${item.key}`;
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                        {item.emoji ?? '📖'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{item.name}</div>
                        {item.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{item.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* People section */}
              {people.length > 0 && (
                <div style={{ padding: '8px 0' }}>
                  <div style={{ padding: '0 16px 8px', fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>People</div>
                  {people.map((item, i) => (
                    <div key={`p-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => { if (item.username) window.location.href = `/profile?u=${item.username}`; }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${item.avatarSeed ?? item.username ?? item.name}`} alt="" style={{ width: 46, height: 46, borderRadius: '50%', border: '2px solid var(--border)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                          {item.username && `@${item.username}`}
                          {item.followers && ` · ${typeof item.followers === 'number' ? `${(item.followers / 1000).toFixed(1)}K` : item.followers} followers`}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); toggleFollow(item.id ?? item.username ?? item.name); }}
                        style={{
                          padding: '6px 14px', borderRadius: 8, border: 'none', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                          background: followedUsers.has(item.id ?? item.username ?? item.name) ? 'var(--surface)' : 'var(--blue)',
                        }}>
                        {followedUsers.has(item.id ?? item.username ?? item.name) ? 'Following ✓' : 'Follow'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Default explore view */
        <div style={{ padding: '12px 0' }}>
          {/* Active tag filter */}
          {activeTag && (
            <div style={{ padding: '0 12px 12px' }}>
              <button onClick={() => { setActiveTag(null); setQuery(''); }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 20, padding: '6px 12px', color: '#3B82F6', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                #{activeTag} ✕
              </button>
            </div>
          )}

          {/* Subject Grid */}
          <div style={{ padding: '0 12px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Browse Subjects</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {SUBJECTS.map(s => (
                <Link key={s.id} href={`/subject/${s.id}`}
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '20px 16px', borderRadius: 16, background: s.bg, border: `1px solid ${s.color}33`, textDecoration: 'none', minHeight: 90, gap: 4, transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = `0 4px 20px ${s.color}33`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <span style={{ fontSize: 28 }}>{s.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: s.color }}>{s.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div style={{ padding: '0 12px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🔥 Trending</h2>
            {TRENDING.map(t => (
              <button key={t.tag} onClick={() => handleTagSearch(t.tag)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)' }}>#{t.tag}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{t.posts} posts</div>
                </div>
                <div style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', borderRadius: 8, padding: '4px 10px', fontWeight: 800, fontSize: 13 }}>
                  #{t.rank}
                </div>
              </button>
            ))}
          </div>

          {/* Suggested Teachers */}
          <div style={{ padding: '16px 12px 0' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>👨‍🏫 Suggested Teachers</h2>
            {FALLBACK_DATA.filter(d => d.type === 'teacher').map((t, i) => {
              const userId = (t as any).username ?? t.name;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <Link href={`/profile?u=${(t as any).username}`}>
                    <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${(t as any).seed}`} alt="" style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--border)' }} />
                  </Link>
                  <div style={{ flex: 1 }}>
                    <Link href={`/profile?u=${(t as any).username}`} style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', textDecoration: 'none', display: 'block' }}>{t.name}</Link>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{t.sub} · {(t as any).followers} followers</div>
                  </div>
                  <button
                    onClick={() => toggleFollow(userId)}
                    style={{
                      padding: '7px 16px', borderRadius: 10, border: 'none', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                      background: followedUsers.has(userId) ? 'var(--surface)' : 'var(--blue)',
                    }}>
                    {followedUsers.has(userId) ? 'Following ✓' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
