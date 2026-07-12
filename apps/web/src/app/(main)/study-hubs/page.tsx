'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface StudyHub {
  id: string;
  title: string;
  description: string;
  participantCount: number;
  emoji: string;
}

export default function StudyHubsPage() {
  const [hubs, setHubs] = useState<StudyHub[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuthStore();

  useEffect(() => {
    // In a real scenario, this would fetch from an API like /conversations/hubs
    // For now, we mock some public study rooms
    const mockHubs: StudyHub[] = [
      { id: 'hub-math', title: 'Mathematics Masters', description: 'KCSE Math paper 1 & 2 discussion. Join to solve complex problems together!', participantCount: 142, emoji: '📐' },
      { id: 'hub-bio', title: 'Biology Revision', description: 'Deep dive into genetics, ecology, and human anatomy.', participantCount: 89, emoji: '🧬' },
      { id: 'hub-chem', title: 'Chemistry Lab', description: 'Organic chemistry, moles, and balancing equations.', participantCount: 110, emoji: '🧪' },
      { id: 'hub-eng', title: 'English Literature', description: 'Discussing set books, poetry, and essay writing techniques.', participantCount: 65, emoji: '📚' },
      { id: 'hub-phy', title: 'Physics Formulae', description: 'Mechanics, electricity, and magnetism discussions.', participantCount: 78, emoji: '⚛️' },
    ];
    setHubs(mockHubs);
    setLoading(false);
  }, []);

  const handleJoinHub = async (hubId: string) => {
    try {
      // In a real app, call API to join conversation and get Conversation ID
      // await apiFetch(`/conversations/${hubId}/join`, { method: 'POST' });
      alert(`Joined ${hubId}! Redirecting to chat...`);
      // router.push(`/messages/${conversationId}`)
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: 20 }}>Loading Study Hubs...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', color: 'white', paddingBottom: '80px' }}>
      <div className="top-bar" style={{ marginBottom: '24px' }}>
        <Link href="/messages" style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Study Hubs</h1>
        <div style={{ width: '22px' }} />
      </div>

      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤝</div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Collaborative Learning</h2>
        <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.5, maxWidth: '400px', margin: '0 auto' }}>
          Join public study rooms to discuss subjects, solve past papers, and learn together with students across the country.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {hubs.map((hub) => (
          <div key={hub.id} style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', flexShrink: 0 }}>
                {hub.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{hub.title}</h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text2)', lineHeight: 1.5 }}>{hub.description}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text2)', fontWeight: 600 }}>
                <span style={{ color: '#10b981' }}>●</span> {hub.participantCount} online
              </div>
              <button 
                onClick={() => handleJoinHub(hub.id)}
                style={{ padding: '8px 24px', borderRadius: '12px', background: 'var(--grad)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '14px' }}
              >
                Join Hub
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
