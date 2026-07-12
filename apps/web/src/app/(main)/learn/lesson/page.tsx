'use client';
import { useState } from 'react';
import Link from 'next/link';

const LESSON = {
  id: 'l1',
  title: 'Cell Division & Mitosis',
  subject: 'Biology',
  topic: 'Cell Biology',
  durationMin: 5,
  xpReward: 50,
  blocks: [
    { type: 'text', content: 'Cell division is the process by which a parent cell divides into two daughter cells. **Mitosis** produces two genetically identical daughter cells, while **meiosis** produces four genetically unique cells.' },
    { type: 'callout', emoji: '💡', content: 'Key fact: Mitosis occurs in somatic (body) cells, while meiosis occurs in reproductive cells to form gametes.' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&q=80', caption: 'Diagram: Stages of Mitosis' },
    { type: 'text', content: 'The stages of mitosis are:\n\n**1. Prophase** — Chromosomes condense and become visible. The nuclear envelope breaks down.\n\n**2. Metaphase** — Chromosomes align at the cell equator (metaphase plate). Spindle fibers attach to centromeres.\n\n**3. Anaphase** — Sister chromatids separate and are pulled to opposite poles.\n\n**4. Telophase** — Nuclear envelopes reform around each set of chromosomes. Chromosomes begin to decondense.' },
    { type: 'callout', emoji: '📌', content: 'KCSE Tip: You MUST be able to draw and label diagrams of each mitotic stage. Questions frequently ask you to identify stages from diagrams.' },
    { type: 'quiz_preview', question: 'Which phase of mitosis involves chromosomes aligning at the cell equator?', options: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'], correct: 1 },
  ],
};

function renderBlock(block: any, idx: number) {
  if (block.type === 'text') {
    return (
      <div key={idx} style={{ fontSize: '15.5px', lineHeight: 1.7, color: 'var(--text)', marginBottom: '20px' }}>
        {block.content.split('\n').map((line: string, i: number) => (
          <p key={i} style={{ marginBottom: line === '' ? '8px' : '4px' }}>
            {line.split(/\*\*(.*?)\*\*/g).map((part: string, j: number) =>
              j % 2 === 1 ? <strong key={j} style={{ color: 'white' }}>{part}</strong> : part
            )}
          </p>
        ))}
      </div>
    );
  }
  if (block.type === 'callout') {
    return (
      <div key={idx} style={{ display: 'flex', gap: '12px', padding: '14px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '20px', flexShrink: 0 }}>{block.emoji}</span>
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text2)', margin: 0 }}>{block.content}</p>
      </div>
    );
  }
  if (block.type === 'image') {
    return (
      <div key={idx} style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <img src={block.url} alt={block.caption} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
        {block.caption && <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text2)', background: 'var(--surface)', textAlign: 'center' }}>{block.caption}</div>}
      </div>
    );
  }
  if (block.type === 'quiz_preview') {
    return <InlineQuiz key={idx} block={block} />;
  }
  return null;
}

function InlineQuiz({ block }: { block: any }) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  return (
    <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', marginBottom: '20px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--blue)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>🎯</span> Quick Check
      </div>
      <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px', lineHeight: 1.4 }}>{block.question}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {block.options.map((opt: string, i: number) => {
          const isCorrect = i === block.correct;
          const isSelected = selected === i;
          let bg = 'var(--surface2)';
          let border = 'var(--border)';
          let color = 'var(--text)';
          if (answered) {
            if (isCorrect) { bg = 'rgba(34,197,94,0.15)'; border = '#22C55E'; color = '#22C55E'; }
            else if (isSelected) { bg = 'rgba(239,68,68,0.15)'; border = '#EF4444'; color = '#EF4444'; }
          } else if (isSelected) { bg = 'rgba(59,130,246,0.15)'; border = 'var(--blue)'; }

          return (
            <button key={i} onClick={() => !answered && setSelected(i)} style={{ padding: '12px 14px', borderRadius: '10px', background: bg, border: `1.5px solid ${border}`, color, fontSize: '14px', fontWeight: 500, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', cursor: answered ? 'default' : 'pointer' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: isSelected || (answered && isCorrect) ? 'currentColor' : 'transparent', border: `2px solid currentColor`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0, color: (isSelected || (answered && isCorrect)) ? 'var(--bg)' : 'inherit' }}>
                {answered && isCorrect ? '✓' : answered && isSelected ? '✗' : String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div style={{ marginTop: '12px', padding: '10px 14px', background: selected === block.correct ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '8px', fontSize: '13.5px', color: selected === block.correct ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
          {selected === block.correct ? '🎉 Correct! +10 XP' : `❌ The answer is: ${block.options[block.correct]}`}
        </div>
      )}
    </div>
  );
}

export default function LessonPage() {
  const [completed, setCompleted] = useState(false);
  const readTime = Math.ceil(LESSON.durationMin);

  return (
    <div style={{ paddingBottom: '100px', maxWidth: '100%' }}>
      {/* Header */}
      <div className="top-bar">
        <Link href="/learn" style={{ color: 'white', display: 'flex', alignItems: 'center', padding: '4px 8px 4px 0' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '1px' }}>{LESSON.subject} · {LESSON.topic}</div>
          <div style={{ fontSize: '14px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{LESSON.title}</div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text2)', flexShrink: 0 }}>{readTime} min</div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', background: 'var(--surface)' }}>
        <div style={{ height: '100%', width: completed ? '100%' : '60%', background: 'var(--grad)', transition: 'width 0.8s ease' }} />
      </div>

      {/* XP pill */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,0.12)', padding: '4px 10px', borderRadius: '6px' }}>⚡ +{LESSON.xpReward} XP</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text2)', background: 'var(--surface)', padding: '4px 10px', borderRadius: '6px' }}>🕐 {readTime} min read</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px', lineHeight: 1.3 }}>{LESSON.title}</h1>
        {LESSON.blocks.map((block, i) => renderBlock(block, i))}
      </div>

      {/* Complete button */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', padding: '16px', background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)' }}>
        {!completed ? (
          <button
            onClick={() => setCompleted(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span>✅</span> Complete Lesson (+{LESSON.xpReward} XP)
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/learn" className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '15px', fontWeight: 700 }}>
              Back to Learn
            </Link>
            <Link href="/learn/quiz?id=q1" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '10px' }}>
              <span>🎯</span> Take Quiz
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
