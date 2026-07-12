'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const SUBJECT_DATA: Record<string, any> = {
  biology: {
    name: 'Biology', emoji: '🧬', color: '#22C55E', bg: 'rgba(34,197,94,0.12)',
    topics: ['Cell Physiology', 'Nutrition in Plants and Animals', 'Transport in Plants and Animals', 'Respiration', 'Excretion and Homeostasis', 'Reproduction'],
    teachers: [{ name: 'Mr. Omondi', username: 'mr_omondi', seed: 'omondi', followers: '12.4K' }, { name: 'Amina Wanjiku', username: 'amina_learns', seed: 'amina', followers: '901' }],
    videos: [
      { id: 'c1', title: 'Photosynthesis explained in 60s', author: 'mr_omondi', views: '24K' },
      { id: 'v2', title: 'The Heart Structure', author: 'bio_form4', views: '18K' },
    ]
  },
  mathematics: {
    name: 'Mathematics', emoji: '📐', color: '#7C3AED', bg: 'rgba(124,58,237,0.12)',
    description: 'Featuring content powered by Corbett Maths',
    topics: ['Algebraic Expressions', 'Quadratic Equations', 'Trigonometry', 'Vectors', 'Matrices', 'Integration'],
    teachers: [{ name: 'Corbett Maths', username: 'corbett_maths', seed: 'math1', followers: '145K' }, { name: 'MathDaily', username: 'mathwiz_ke', seed: 'math', followers: '8.9K' }],
    videos: [
      { id: 'c2', title: 'Completing the square', author: 'mathwiz_ke', views: '32K' },
      { id: 'v3', title: 'Trig ratios trick', author: 'corbett_maths', views: '89K' },
    ]
  },
  chemistry: {
    name: 'Chemistry', emoji: '🧪', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',
    topics: ['Structure of the Atom', 'Periodic Table', 'Chemical Families', 'Structure and Bonding', 'Salts', 'Organic Chemistry'],
    teachers: [{ name: 'ChemDaily KE', username: 'chemdaily_ke', seed: 'chem', followers: '8.1K' }],
    videos: [
      { id: 'c3', title: 'Alkali metals reaction', author: 'chemdaily_ke', views: '45K' },
    ]
  },
  physics: {
    name: 'Physics', emoji: '⚛️', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',
    topics: ['Mechanics', 'Waves', 'Thermodynamics', 'Electricity and Magnetism', 'Modern Physics'],
    teachers: [{ name: 'Physics Kenya', username: 'physics_ke', seed: 'physics', followers: '7.6K' }],
    videos: [
      { id: 'c4', title: 'Newtons 3rd Law', author: 'physics_ke', views: '15K' },
    ]
  },
  english: {
    name: 'English', emoji: '📝', color: '#EC4899', bg: 'rgba(236,72,153,0.12)',
    topics: ['Grammar', 'Comprehension', 'Poetry', 'Set Books', 'Creative Writing'],
    teachers: [{ name: 'English Lit KE', username: 'eng_lit', seed: 'eng', followers: '5.2K' }],
    videos: [
      { id: 'v5', title: 'Poetry analysis tips', author: 'eng_lit', views: '11K' },
    ]
  }
};

function SubjectContent() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [dbTopics, setDbTopics] = useState<string[]>([]);
  
  const searchParams = useSearchParams();
  const subjectId = (searchParams.get('id') || 'biology').toLowerCase();
  
  useEffect(() => {
    const keyMap: Record<string, string> = {
      biology: 'BIO',
      chemistry: 'CHE',
      physics: 'PHY',
      mathematics: 'MAT',
      english: 'ENG',
    };
    const key = keyMap[subjectId];
    if (key) {
      fetch(`http://localhost:4000/v1/learn/subjects/${key}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.data && Array.isArray(res.data.topics)) {
            const topicNames = res.data.topics.map((t: any) => t.nameEn);
            setDbTopics(topicNames);
          }
        })
        .catch(() => { /* API down - fallback to mock */ });
    }
  }, [subjectId]);

  const data = SUBJECT_DATA[subjectId] || { name: subjectId, emoji: '📚', color: '#888', bg: 'rgba(136,136,136,0.12)', topics: [], teachers: [], videos: [] };
  const topicsToDisplay = dbTopics.length > 0 ? dbTopics : data.topics;

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="top-bar">
        <Link href="/search" style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <span style={{ fontWeight: 700, fontSize: 18 }}>{data.emoji} {data.name}</span>
        <div style={{ width: 22 }} />
      </div>

      {/* Hero Banner */}
      <div style={{ background: data.bg, padding: '30px 20px', borderBottom: `1px solid ${data.color}44`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 10, filter: `drop-shadow(0 0 20px ${data.color}88)` }}>{data.emoji}</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: data.color, marginBottom: 8 }}>{data.name} Hub</h1>
        {data.description && <p style={{ fontSize: 14, color: 'var(--text2)', maxWidth: '80%' }}>{data.description}</p>}
        
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, width: '100%', maxWidth: 400 }}>
          <Link href={`/learn/quiz?id=q_${subjectId}`} style={{ flex: 1, padding: '12px 0', background: data.color, borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Take a Quiz</Link>
          <Link href={`/flashcards?subject=${subjectId}`} style={{ flex: 1, padding: '12px 0', background: 'var(--surface)', border: `1px solid ${data.color}44`, borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Flashcards</Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg)', position: 'sticky', top: 52, zIndex: 10 }}>
        {['Overview', 'Topics', 'Teachers'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '14px 0', fontSize: 14, fontWeight: 600, color: activeTab === tab ? data.color : 'var(--text2)', background: 'none', border: 'none', borderBottom: activeTab === tab ? `2px solid ${data.color}` : '2px solid transparent', cursor: 'pointer' }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '20px 16px' }}>
        {activeTab === 'Overview' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Trending in {data.name}</h2>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', margin: '0 -16px', paddingLeft: 16, paddingRight: 16 }}>
              {data.videos.map((v: any) => (
                <Link key={v.id} href={`/clips/${v.id}`} style={{ flexShrink: 0, width: 140, textDecoration: 'none' }}>
                  <div style={{ width: '100%', aspectRatio: '9/16', background: 'var(--surface)', borderRadius: 12, marginBottom: 8, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${data.color}22, ${data.color}11)` }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 32 }}>▶️</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, marginBottom: 2 }}>{v.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>@{v.author} • {v.views} views</div>
                </Link>
              ))}
            </div>

            {subjectId === 'mathematics' && (
              <div style={{ marginTop: 24, padding: 16, background: 'rgba(124,58,237,0.1)', borderRadius: 16, border: '1px solid rgba(124,58,237,0.3)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#7C3AED', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img src="https://corbettmaths.com/wp-content/uploads/2018/12/corbettmaths-logo-1.png" alt="Corbett Maths" style={{ height: 20 }} />
                  Integration
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.4 }}>Access thousands of free videos, worksheets, and practice papers directly from Corbett Maths.</p>
                <Link href="https://corbettmaths.com/" target="_blank" style={{ display: 'inline-block', padding: '8px 16px', background: '#7C3AED', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Browse Resources ↗</Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Topics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topicsToDisplay.map((t: string, i: number) => (
              <div key={i} style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{t}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>12 lessons • 3 quizzes</div>
                </div>
                <button style={{ width: 32, height: 32, borderRadius: '50%', background: `${data.color}22`, color: data.color, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>›</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Teachers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.teachers.map((t: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <Link href={`/profile?u=${t.username}`}>
                  <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${t.seed}`} alt="" style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid var(--border)' }} />
                </Link>
                <div style={{ flex: 1 }}>
                  <Link href={`/profile?u=${t.username}`} style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', textDecoration: 'none', display: 'block' }}>{t.name}</Link>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{t.followers} followers</div>
                </div>
                <button style={{ padding: '8px 16px', borderRadius: 10, background: 'var(--blue)', border: 'none', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Follow</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubjectPage() {
  return (
    <Suspense fallback={<div style={{ color: 'white', padding: 20 }}>Loading subject...</div>}>
      <SubjectContent />
    </Suspense>
  );
}
