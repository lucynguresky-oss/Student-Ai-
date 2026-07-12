'use client';
import { useState } from 'react';

const STORIES = [
  { id: 'you', label: 'Your Story', seed: 'you', hasNew: false, isYou: true },
  { id: 's1', label: 'Mr. Omondi', seed: 'omondi', hasNew: true },
  { id: 's2', label: 'amina_w', seed: 'amina', hasNew: true },
  { id: 's3', label: 'BioForm4', seed: 'bio', hasNew: true },
  { id: 's4', label: 'MathDaily', seed: 'math', hasNew: false },
  { id: 's5', label: 'ChemKE', seed: 'chem', hasNew: false },
  { id: 's6', label: 'PhysicsHub', seed: 'physics', hasNew: true },
];

export function StoriesBar() {
  return (
    <div style={{ display:'flex', gap:'14px', padding:'12px 14px', overflowX:'auto', scrollbarWidth:'none', borderBottom:'1px solid var(--border)' }}>
      {STORIES.map(s => (
        <button key={s.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', flexShrink:0, background:'none', border:'none', cursor:'pointer' }}>
          <div style={{ position:'relative' }}>
            <div style={{
              width:'62px', height:'62px', borderRadius:'50%',
              background: s.hasNew ? 'var(--grad-ig)' : (s.isYou ? 'var(--grad)' : 'var(--surface2)'),
              padding:'2px',
            }}>
              <div style={{ width:'100%', height:'100%', borderRadius:'50%', border:'2px solid var(--bg)', overflow:'hidden', background:'var(--surface)' }}>
                <img
                  src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${s.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                  alt={s.label} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                />
              </div>
            </div>
            {s.isYou && (
              <div style={{ position:'absolute', bottom:0, right:0, width:'20px', height:'20px', background:'var(--blue)', borderRadius:'50%', border:'2px solid var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'bold', color:'white' }}>+</div>
            )}
          </div>
          <span style={{ fontSize:'11px', color:'var(--text2)', maxWidth:'62px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.label}</span>
        </button>
      ))}
    </div>
  );
}
