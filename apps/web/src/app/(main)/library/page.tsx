'use client';
import { useState } from 'react';

const BOOKS = [
  { id: 'b1', title: 'Biology Form 4', authors: ['Kenya Institute', 'Dr. A. Kiptoo'], subject: 'Biology', level: 'Form 4', cover: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=300&q=80', pages: 348, accessType: 'FREE', license: 'OER', rating: 4.8, progress: 45 },
  { id: 'b2', title: 'Mathematics Form 4', authors: ['KLB Publishers'], subject: 'Mathematics', level: 'Form 4', cover: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=300&q=80', pages: 412, accessType: 'FREE', license: 'OER', rating: 4.6, progress: 20 },
  { id: 'b3', title: 'Chemistry Form 3 & 4', authors: ['Oxford Press Kenya'], subject: 'Chemistry', level: 'Form 3-4', cover: 'https://images.unsplash.com/photo-1603126859738-1631624b4c10?w=300&q=80', pages: 290, accessType: 'FREE', license: 'OER', rating: 4.5, progress: 0 },
  { id: 'b4', title: 'Physics for KCSE', authors: ['Longhorn Publishers'], subject: 'Physics', level: 'Form 4', cover: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=300&q=80', pages: 380, accessType: 'PLUS', license: 'LICENSED_PUBLISHER', rating: 4.9, progress: 0 },
  { id: 'b5', title: 'English Language & Literature', authors: ['Macmillan Kenya'], subject: 'English', level: 'Form 1-4', cover: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&q=80', pages: 310, accessType: 'FREE', license: 'OER', rating: 4.3, progress: 65 },
  { id: 'b6', title: 'KCSE Revision Biology', authors: ['Dr. E. Mwangi', 'Prof. K. Otieno'], subject: 'Biology', level: 'Form 4', cover: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=300&q=80', pages: 220, accessType: 'FREE', license: 'OER', rating: 4.7, progress: 80 },
];

const SUBJECTS = ['All', 'Biology', 'Chemistry', 'Physics', 'Mathematics', 'English'];

export default function LibraryPage() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filtered = BOOKS.filter(b =>
    (filter === 'All' || b.subject === filter) &&
    (b.title.toLowerCase().includes(search.toLowerCase()) || b.authors.join(' ').toLowerCase().includes(search.toLowerCase()))
  );

  const reading = BOOKS.filter(b => b.progress > 0 && b.progress < 100);

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div className="top-bar">
        <span style={{ fontWeight: 800, fontSize: '20px' }}>Library</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')} style={{ color: 'var(--text2)', padding: '6px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {view === 'grid' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px' }}>
        <div className="search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search books, authors..." />
        </div>
      </div>

      {/* Subject filter */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 16px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {SUBJECTS.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`chip${filter === s ? ' active' : ''}`}>{s}</button>
        ))}
      </div>

      {/* Project Gutenberg External Library Link */}
      <div style={{ padding: '0 16px 16px' }}>
        <a 
          href="https://www.gutenberg.org/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(59, 130, 246, 0.12))',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            borderRadius: '16px',
            textDecoration: 'none',
            color: 'white',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.5)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(124, 58, 237, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.25)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.25)';
          }}
        >
          <span style={{ fontSize: '32px', flexShrink: 0 }}>🌐</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#A78BFA', background: 'rgba(124, 58, 237, 0.15)', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                External Library
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '14.5px', color: 'white', marginBottom: '2px' }}>
              Project Gutenberg
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.4' }}>
              Access over 70,000 free, classic, open-curriculum digital books in the public domain.
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
            <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
          </svg>
        </a>
      </div>

      {/* Continue Reading */}
      {reading.length > 0 && !search && filter === 'All' && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Continue Reading</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reading.map(b => (
              <div key={b.id} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)' }}>
                <img src={b.cover} alt={b.title} style={{ width: '52px', height: '70px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>{b.authors[0]}</div>
                  <div style={{ height: '4px', background: 'var(--surface2)', borderRadius: '999px', marginBottom: '4px' }}>
                    <div style={{ height: '100%', width: `${b.progress}%`, background: 'var(--teal)', borderRadius: '999px' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{b.progress}% complete</div>
                </div>
                <button style={{ padding: '8px 14px', background: 'var(--blue)', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 700, alignSelf: 'center', flexShrink: 0 }}>Read</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Books */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
          {filter === 'All' ? 'All Books' : filter} <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: '13px' }}>({filtered.length})</span>
        </div>
        {view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {filtered.map(b => (
              <div key={b.id} style={{ background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ position: 'relative' }}>
                  <img src={b.cover} alt={b.title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
                  {b.accessType !== 'FREE' && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#F59E0B', color: 'black', fontSize: '10px', fontWeight: 800, padding: '3px 7px', borderRadius: '6px' }}>{b.accessType}</div>
                  )}
                  {b.progress > 0 && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(0,0,0,0.3)' }}>
                      <div style={{ height: '100%', width: `${b.progress}%`, background: 'var(--teal)' }} />
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{b.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '6px' }}>{b.authors[0]}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#F59E0B' }}>{'⭐'.repeat(Math.round(b.rating))} {b.rating}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{b.pages}p</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(b => (
              <div key={b.id} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)' }}>
                <img src={b.cover} alt={b.title} style={{ width: '52px', height: '70px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{b.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>{b.authors.join(', ')}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', padding: '2px 6px', background: 'rgba(34,197,94,0.1)', color: '#22C55E', borderRadius: '4px' }}>{b.accessType}</span>
                    <span style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--surface2)', color: 'var(--text3)', borderRadius: '4px' }}>{b.level}</span>
                  </div>
                </div>
                <button style={{ padding: '8px 14px', background: 'var(--surface2)', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 700, alignSelf: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>Open</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
