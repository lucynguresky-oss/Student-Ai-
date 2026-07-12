'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

/* ─── Paper + Question data ─── */
interface Paper {
  id: string; title: string; subject: string; year: number; session: string;
  marks: number; duration: number; accessType: string; verified: boolean;
  topics: string[];
}

interface Question {
  id: number; prompt: string; options: string[]; correct: number; explanation: string;
}

const PAPERS: Paper[] = [
  { id: 'p1', title: 'KCSE Biology Paper 1 2023', subject: 'Biology', year: 2023, session: 'Nov/Dec', marks: 80, duration: 120, accessType: 'FREE', verified: true, topics: ['Cell Biology', 'Ecology', 'Genetics'] },
  { id: 'p2', title: 'KCSE Mathematics Paper 2 2023', subject: 'Mathematics', year: 2023, session: 'Nov/Dec', marks: 100, duration: 150, accessType: 'FREE', verified: true, topics: ['Algebra', 'Calculus', 'Statistics'] },
  { id: 'p3', title: 'KCSE Chemistry Paper 1 2023', subject: 'Chemistry', year: 2023, session: 'Nov/Dec', marks: 80, duration: 120, accessType: 'FREE', verified: true, topics: ['Organic Chemistry', 'Electrochemistry', 'Acids & Bases'] },
  { id: 'p4', title: 'KCSE Physics Paper 2 2022', subject: 'Physics', year: 2022, session: 'Nov/Dec', marks: 80, duration: 120, accessType: 'FREE', verified: true, topics: ['Waves', 'Electricity', 'Nuclear Physics'] },
  { id: 'p5', title: 'KCSE Biology Paper 2 2022', subject: 'Biology', year: 2022, session: 'Nov/Dec', marks: 80, duration: 120, accessType: 'FREE', verified: true, topics: ['Nutrition', 'Reproduction', 'Homeostasis'] },
  { id: 'p6', title: 'KCSE Mathematics Paper 1 2021', subject: 'Mathematics', year: 2021, session: 'Nov/Dec', marks: 100, duration: 150, accessType: 'FREE', verified: false, topics: ['Geometry', 'Trigonometry', 'Probability'] },
  { id: 'p7', title: 'KCSE English Paper 1 2023', subject: 'English', year: 2023, session: 'Nov/Dec', marks: 60, duration: 120, accessType: 'FREE', verified: true, topics: ['Composition', 'Comprehension', 'Grammar'] },
  { id: 'p8', title: 'KCSE Physics Paper 1 2023', subject: 'Physics', year: 2023, session: 'Nov/Dec', marks: 80, duration: 120, accessType: 'FREE', verified: true, topics: ['Mechanics', 'Heat', 'Optics'] },
  { id: 'p9', title: 'KCSE Chemistry Paper 2 2022', subject: 'Chemistry', year: 2022, session: 'Nov/Dec', marks: 80, duration: 120, accessType: 'FREE', verified: true, topics: ['Metals', 'Energy Changes', 'Radioactivity'] },
  { id: 'p10', title: 'KCSE Biology Paper 1 2021', subject: 'Biology', year: 2021, session: 'Nov/Dec', marks: 80, duration: 120, accessType: 'FREE', verified: false, topics: ['Classification', 'Respiration', 'Transport'] },
  { id: 'p11', title: 'KCSE Mathematics Paper 2 2020', subject: 'Mathematics', year: 2020, session: 'Nov/Dec', marks: 100, duration: 150, accessType: 'FREE', verified: true, topics: ['Vectors', 'Matrices', 'Integration'] },
  { id: 'p12', title: 'KCSE Physics Paper 1 2019', subject: 'Physics', year: 2019, session: 'Nov/Dec', marks: 80, duration: 120, accessType: 'FREE', verified: false, topics: ['Pressure', 'Force', 'Turning Effect'] },
  { id: 'p13', title: 'KCSE Chemistry Paper 1 2020', subject: 'Chemistry', year: 2020, session: 'Nov/Dec', marks: 80, duration: 120, accessType: 'FREE', verified: true, topics: ['Atomic Structure', 'Bonding', 'Periodic Table'] },
  { id: 'p14', title: 'KCSE English Paper 2 2022', subject: 'English', year: 2022, session: 'Nov/Dec', marks: 80, duration: 150, accessType: 'FREE', verified: true, topics: ['Set Books', 'Poetry', 'Oral Literature'] },
  { id: 'p15', title: 'KCSE Biology Paper 2 2019', subject: 'Biology', year: 2019, session: 'Nov/Dec', marks: 80, duration: 120, accessType: 'FREE', verified: false, topics: ['Evolution', 'Ecology', 'Genetics'] },
  { id: 'p16', title: 'KCSE Mathematics Paper 1 2018', subject: 'Mathematics', year: 2018, session: 'Nov/Dec', marks: 100, duration: 150, accessType: 'FREE', verified: true, topics: ['Number Theory', 'Algebra', 'Mensuration'] },
];

const PAPER_QUESTIONS: Record<string, Question[]> = {
  Biology: [
    { id: 1, prompt: 'Which organelle is responsible for protein synthesis in cells?', options: ['Mitochondria', 'Ribosome', 'Golgi apparatus', 'Lysosome'], correct: 1, explanation: 'Ribosomes are the cellular organelles responsible for protein synthesis. They translate mRNA into polypeptide chains.' },
    { id: 2, prompt: 'What is the role of haemoglobin in blood?', options: ['Clotting', 'Transport of oxygen', 'Fighting infections', 'Producing hormones'], correct: 1, explanation: 'Haemoglobin is a protein in red blood cells that binds to oxygen in the lungs and transports it to body tissues.' },
    { id: 3, prompt: 'Which of the following is NOT a function of the liver?', options: ['Detoxification', 'Bile production', 'Insulin production', 'Glycogen storage'], correct: 2, explanation: 'Insulin is produced by the beta cells of the Islets of Langerhans in the pancreas, not the liver.' },
    { id: 4, prompt: 'In which phase of mitosis do chromosomes line up at the cell equator?', options: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'], correct: 1, explanation: 'During metaphase, chromosomes align along the metaphase plate (cell equator) before being separated.' },
    { id: 5, prompt: 'What is the basic unit of classification in taxonomy?', options: ['Genus', 'Family', 'Species', 'Order'], correct: 2, explanation: 'Species is the basic (smallest) unit of classification. Organisms of the same species can interbreed to produce fertile offspring.' },
  ],
  Chemistry: [
    { id: 1, prompt: 'What is the chemical formula of sulphuric acid?', options: ['HCl', 'HNO₃', 'H₂SO₄', 'H₃PO₄'], correct: 2, explanation: 'Sulphuric acid has the chemical formula H₂SO₄. It is a strong diprotic acid.' },
    { id: 2, prompt: 'Which type of bonding occurs in sodium chloride (NaCl)?', options: ['Covalent bonding', 'Ionic bonding', 'Metallic bonding', 'Hydrogen bonding'], correct: 1, explanation: 'NaCl is formed by ionic bonding — sodium donates an electron to chlorine, forming Na⁺ and Cl⁻ ions.' },
    { id: 3, prompt: 'What gas is produced when zinc reacts with dilute hydrochloric acid?', options: ['Oxygen', 'Carbon dioxide', 'Hydrogen', 'Chlorine'], correct: 2, explanation: 'Zn + 2HCl → ZnCl₂ + H₂. Hydrogen gas is produced when a metal reacts with a dilute acid.' },
    { id: 4, prompt: 'Which of the following is an alkali metal?', options: ['Calcium', 'Potassium', 'Aluminium', 'Iron'], correct: 1, explanation: 'Potassium (K) belongs to Group 1 — the alkali metals. They have one electron in the outer shell.' },
    { id: 5, prompt: 'What is the pH of a neutral solution?', options: ['0', '7', '14', '1'], correct: 1, explanation: 'A neutral solution has a pH of 7. Below 7 is acidic and above 7 is alkaline.' },
  ],
  Physics: [
    { id: 1, prompt: 'What is the SI unit of force?', options: ['Joule', 'Watt', 'Newton', 'Pascal'], correct: 2, explanation: 'The SI unit of force is the Newton (N), named after Sir Isaac Newton. 1 N = 1 kg⋅m/s².' },
    { id: 2, prompt: 'Which law states that for every action there is an equal and opposite reaction?', options: ["Newton's 1st Law", "Newton's 2nd Law", "Newton's 3rd Law", "Law of Gravitation"], correct: 2, explanation: "Newton's Third Law of Motion states that for every action, there is an equal and opposite reaction." },
    { id: 3, prompt: 'What type of wave is sound?', options: ['Transverse', 'Longitudinal', 'Electromagnetic', 'Surface'], correct: 1, explanation: 'Sound is a longitudinal wave — the particles vibrate parallel to the direction of energy transfer.' },
    { id: 4, prompt: 'What is the formula for calculating pressure?', options: ['P = F × A', 'P = F / A', 'P = m × a', 'P = W / t'], correct: 1, explanation: 'Pressure = Force / Area (P = F/A). The SI unit of pressure is the Pascal (Pa).' },
    { id: 5, prompt: 'A car travels 150 km in 3 hours. What is its average speed?', options: ['45 km/h', '50 km/h', '450 km/h', '30 km/h'], correct: 1, explanation: 'Average speed = distance / time = 150 km / 3 h = 50 km/h.' },
  ],
  Mathematics: [
    { id: 1, prompt: 'Solve for x: 2x + 6 = 18', options: ['x = 4', 'x = 6', 'x = 8', 'x = 12'], correct: 1, explanation: '2x + 6 = 18 → 2x = 12 → x = 6.' },
    { id: 2, prompt: 'What is the value of sin 30°?', options: ['0', '0.5', '1', '√3/2'], correct: 1, explanation: 'sin 30° = 1/2 = 0.5. This is one of the standard trigonometric ratios.' },
    { id: 3, prompt: 'What is the gradient of the line y = 3x - 7?', options: ['-7', '3', '-3', '7'], correct: 1, explanation: 'In y = mx + c form, the gradient m = 3. The y-intercept c = -7.' },
    { id: 4, prompt: 'Find the area of a circle with radius 7 cm (use π = 22/7)', options: ['44 cm²', '154 cm²', '22 cm²', '308 cm²'], correct: 1, explanation: 'A = πr² = (22/7) × 7² = (22/7) × 49 = 22 × 7 = 154 cm².' },
    { id: 5, prompt: 'Simplify: 3(2x - 4) + 5x', options: ['11x - 12', '6x - 12', '11x + 12', '6x + 12'], correct: 0, explanation: '3(2x - 4) + 5x = 6x - 12 + 5x = 11x - 12.' },
  ],
  English: [
    { id: 1, prompt: 'Which of the following is a compound sentence?', options: ['She ran fast.', 'She ran fast, and she won the race.', 'Running fast, she won.', 'The fast runner.'], correct: 1, explanation: 'A compound sentence has two independent clauses joined by a coordinating conjunction (and, but, or).' },
    { id: 2, prompt: 'Identify the noun in: "The teacher explained the lesson clearly."', options: ['explained', 'clearly', 'teacher', 'the'], correct: 2, explanation: '"Teacher" and "lesson" are nouns. "Teacher" is the subject noun in this sentence.' },
    { id: 3, prompt: 'What figure of speech is: "The wind whispered through the trees"?', options: ['Simile', 'Metaphor', 'Personification', 'Hyperbole'], correct: 2, explanation: 'Personification gives human qualities to non-human things. The wind cannot literally whisper.' },
    { id: 4, prompt: 'Choose the correct spelling:', options: ['Accomodation', 'Accommodation', 'Acomodation', 'Acommodation'], correct: 1, explanation: 'The correct spelling is "accommodation" — double c and double m.' },
    { id: 5, prompt: 'What tense is: "She had been studying for hours"?', options: ['Past perfect', 'Past perfect continuous', 'Present perfect', 'Past continuous'], correct: 1, explanation: 'Past perfect continuous: had + been + present participle (-ing). It shows duration before a past event.' },
  ],
};

const SUBJECTS = ['All', 'Biology', 'Chemistry', 'Physics', 'Mathematics', 'English'];
const YEARS = ['All Years', '2023', '2022', '2021', '2020', '2019', '2018'];
const SUBJECT_COLORS: Record<string, string> = { Biology: '#22C55E', Chemistry: '#F59E0B', Physics: '#3B82F6', Mathematics: '#7C3AED', English: '#EC4899' };

/* ─── PDF Viewer Overlay ─── */
function PdfViewer({ paper, onClose }: { paper: Paper; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const questions = (PAPER_QUESTIONS[paper.subject] || PAPER_QUESTIONS['Biology'] || []) as Question[];
  const totalPages = questions.length;
  const q = (questions[page - 1] || questions[0] || { id: 0, prompt: '', options: [], correct: 0, explanation: '' }) as Question;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.95)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{paper.title}</div>
          <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Page {page} of {totalPages}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setZoom(z => Math.max(80, z - 10))} style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'white', fontSize: '16px', cursor: 'pointer' }}>−</button>
          <span style={{ fontSize: '11px', color: 'var(--text2)', minWidth: '36px', textAlign: 'center' }}>{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(150, z + 10))} style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'white', fontSize: '16px', cursor: 'pointer' }}>+</button>
        </div>
      </div>

      {/* PDF Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', fontSize: `${zoom}%` }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Kenya National Examinations Council</div>
              <div style={{ fontSize: '16px', fontWeight: 800 }}>{paper.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>{paper.session} · {paper.duration} minutes · {paper.marks} marks</div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question {page}</div>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text)', marginBottom: '16px' }}>{q.prompt}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {q.options.map((opt, i) => (
                <div key={i} style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', color: 'var(--text2)' }}>
                  {String.fromCharCode(65 + i)}. {opt}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '16px', textAlign: 'right' }}>({Math.floor(paper.marks / totalPages)} marks)</div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.95)', borderTop: '1px solid var(--border)', flexShrink: 0, gap: '10px' }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '10px 18px', borderRadius: '10px', background: page === 1 ? 'var(--surface)' : 'rgba(59,130,246,0.15)', border: '1px solid var(--border)', color: page === 1 ? 'var(--text3)' : 'white', fontWeight: 700, fontSize: '13px', cursor: page === 1 ? 'default' : 'pointer' }}>← Prev</button>
        <Link href={`/ai-tutor?context=${encodeURIComponent(q.prompt)}&mode=explain`} style={{ padding: '10px 16px', borderRadius: '10px', background: 'linear-gradient(135deg,#7C3AED,#3B82F6)', color: 'white', fontWeight: 700, fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>🤖 Ask AI</Link>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '10px 18px', borderRadius: '10px', background: page === totalPages ? 'var(--surface)' : 'rgba(59,130,246,0.15)', border: '1px solid var(--border)', color: page === totalPages ? 'var(--text3)' : 'white', fontWeight: 700, fontSize: '13px', cursor: page === totalPages ? 'default' : 'pointer' }}>Next →</button>
      </div>
    </div>
  );
}

/* ─── Practice Mode ─── */
function PracticeMode({ paper, onClose }: { paper: Paper; onClose: () => void }) {
  const questions = (PAPER_QUESTIONS[paper.subject] || PAPER_QUESTIONS['Biology'] || []) as Question[];
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = (questions[current] || questions[0] || { id: 0, prompt: '', options: [], correct: 0, explanation: '' }) as Question;

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const xpEarned = score * 15;
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📚'}</div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Practice Complete!</h2>
        <p style={{ fontSize: '16px', color: 'var(--text2)', marginBottom: '24px' }}>{paper.title}</p>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: pct >= 80 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444' }}>{pct}%</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Score</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#3B82F6' }}>{score}/{questions.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Correct</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#F59E0B' }}>+{xpEarned}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>XP Earned</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '400px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>Back to Papers</button>
          <Link href="/ai-tutor" style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--grad)', color: 'white', fontWeight: 700, fontSize: '14px', textDecoration: 'none', textAlign: 'center' }}>Review with AI</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Practice Mode</div>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>Q{current + 1} of {questions.length}</div>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#22C55E' }}>{score}/{current + (answered ? 1 : 0)}</div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', background: 'var(--surface)' }}>
        <div style={{ height: '100%', width: `${((current + (answered ? 1 : 0)) / questions.length) * 100}%`, background: 'var(--grad)', transition: 'width 0.4s ease' }} />
      </div>

      {/* Question */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ fontSize: '17px', fontWeight: 600, lineHeight: 1.6, marginBottom: '24px' }}>{q.prompt}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {q.options.map((opt, i) => {
              const isCorrect = i === q.correct;
              const isSelected = selected === i;
              let bg = 'var(--surface)';
              let border = 'var(--border)';
              let color = 'var(--text)';
              if (answered) {
                if (isCorrect) { bg = 'rgba(34,197,94,0.15)'; border = '#22C55E'; color = '#22C55E'; }
                else if (isSelected) { bg = 'rgba(239,68,68,0.15)'; border = '#EF4444'; color = '#EF4444'; }
              }
              return (
                <button key={i} onClick={() => handleAnswer(i)} style={{ padding: '14px 16px', borderRadius: '12px', background: bg, border: `1.5px solid ${border}`, color, fontSize: '15px', fontWeight: 500, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', cursor: answered ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid ${answered && isCorrect ? '#22C55E' : answered && isSelected ? '#EF4444' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0, background: (isSelected || (answered && isCorrect)) ? 'currentColor' : 'transparent', color: (isSelected || (answered && isCorrect)) ? '#000' : 'inherit' }}>
                    {answered && isCorrect ? '✓' : answered && isSelected ? '✗' : String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {answered && (
            <div style={{ marginTop: '20px', padding: '14px 16px', background: selected === q.correct ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${selected === q.correct ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: selected === q.correct ? '#22C55E' : '#EF4444', marginBottom: '6px' }}>
                {selected === q.correct ? '🎉 Correct!' : '❌ Incorrect'}
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{q.explanation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom */}
      {answered && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button onClick={handleNext} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--grad)', color: 'white', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer' }}>
            {current < questions.length - 1 ? 'Next Question →' : 'See Results 🎯'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Timed Exam Mode ─── */
function TimedExam({ paper, onClose }: { paper: Paper; onClose: () => void }) {
  const questions = (PAPER_QUESTIONS[paper.subject] || PAPER_QUESTIONS['Biology'] || []) as Question[];
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(paper.duration * 60);
  const [finished, setFinished] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setTimeLeft(s => { if (s <= 1) { setFinished(true); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [finished]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const urgent = timeLeft < 300;

  const handleSelect = (idx: number) => {
    const newAns = [...answers];
    newAns[current] = idx;
    setAnswers(newAns);
  };

  const handleSubmit = () => setFinished(true);

  const score = answers.reduce((acc: number, a, i) => {
    const qItem = questions[i];
    return qItem && a === qItem.correct ? acc + 1 : acc;
  }, 0);

  if (finished && !reviewing) {
    const pct = Math.round((score / questions.length) * 100);
    const xpEarned = score * 20;
    const timeUsed = (paper.duration * 60) - timeLeft;
    const tMins = Math.floor(timeUsed / 60);
    const tSecs = timeUsed % 60;
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{pct >= 80 ? '🏆' : pct >= 50 ? '⏱️' : '📖'}</div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>Exam Complete!</h2>
        <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '24px' }}>Time used: {tMins}m {tSecs}s</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '300px', marginBottom: '32px' }}>
          {[
            { label: 'Score', value: `${pct}%`, color: pct >= 80 ? '#22C55E' : '#F59E0B' },
            { label: 'Correct', value: `${score}/${questions.length}`, color: '#3B82F6' },
            { label: 'XP Earned', value: `+${xpEarned}`, color: '#F59E0B' },
            { label: 'Grade', value: pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D', color: pct >= 80 ? '#22C55E' : '#EF4444' },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '400px' }}>
          <button onClick={() => setReviewing(true)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>Review Answers</button>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--grad)', color: 'white', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    );
  }

  if (finished && reviewing) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button onClick={() => setReviewing(false)} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '15px' }}>Review Answers</span>
          <span style={{ fontSize: '13px', color: '#22C55E', fontWeight: 700 }}>{score}/{questions.length}</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {questions.map((q, i) => {
            const userAns = answers[i] ?? null;
            const isCorrect = userAns === q.correct;
            return (
              <div key={i} style={{ marginBottom: '16px', padding: '14px', background: 'var(--surface)', borderRadius: '12px', border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{isCorrect ? '✅' : '❌'}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text2)' }}>Q{i + 1}</span>
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '8px' }}>{q.prompt}</p>
                <div style={{ fontSize: '13px', color: isCorrect ? '#22C55E' : '#EF4444', marginBottom: '4px' }}>
                  Your answer: {userAns !== null && userAns !== undefined ? q.options[userAns] : 'Not answered'} {!isCorrect && <span style={{ color: '#22C55E' }}>→ Correct: {q.options[q.correct]}</span>}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>{q.explanation}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const q = (questions[current] || questions[0] || { id: 0, prompt: '', options: [], correct: 0, explanation: '' }) as Question;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      {/* Header with timer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: urgent ? 'rgba(239,68,68,0.15)' : 'var(--surface)', border: `1px solid ${urgent ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`, borderRadius: '10px', animation: urgent ? 'pulse 1s infinite' : 'none' }}>
          <span style={{ fontSize: '14px' }}>⏱️</span>
          <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: urgent ? '#EF4444' : 'white' }}>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
        </div>
        <button onClick={handleSubmit} style={{ padding: '6px 14px', background: '#EF4444', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '12px', border: 'none', cursor: 'pointer' }}>Submit</button>
      </div>

      {/* Question dots */}
      <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', justifyContent: 'center', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === current ? 'var(--grad)' : answers[i] !== null ? 'rgba(34,197,94,0.3)' : 'var(--surface)', border: `1.5px solid ${i === current ? 'transparent' : answers[i] !== null ? 'rgba(34,197,94,0.5)' : 'var(--border)'}`, color: 'white', fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>{i + 1}</button>
        ))}
      </div>

      {/* Question */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ fontSize: '17px', fontWeight: 600, lineHeight: 1.6, marginBottom: '24px' }}>{q.prompt}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => handleSelect(i)} style={{ padding: '14px 16px', borderRadius: '12px', background: answers[current] === i ? 'rgba(59,130,246,0.15)' : 'var(--surface)', border: `1.5px solid ${answers[current] === i ? '#3B82F6' : 'var(--border)'}`, color: answers[current] === i ? 'white' : 'var(--text)', fontSize: '15px', fontWeight: 500, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid ${answers[current] === i ? '#3B82F6' : 'var(--border)'}`, background: answers[current] === i ? '#3B82F6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0, color: answers[current] === i ? 'white' : 'var(--text2)' }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: current === 0 ? 'var(--text3)' : 'white', fontWeight: 700, fontSize: '14px', cursor: current === 0 ? 'default' : 'pointer' }}>← Prev</button>
        <button onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))} disabled={current === questions.length - 1} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: current === questions.length - 1 ? 'var(--surface)' : 'var(--grad)', border: current === questions.length - 1 ? '1px solid var(--border)' : 'none', color: current === questions.length - 1 ? 'var(--text3)' : 'white', fontWeight: 700, fontSize: '14px', cursor: current === questions.length - 1 ? 'default' : 'pointer' }}>Next →</button>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }`}</style>
    </div>
  );
}

/* ─── Download Button ─── */
function DownloadBtn() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const handleDownload = () => {
    if (downloading || done) return;
    setDownloading(true);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) { p = 100; clearInterval(iv); setDone(true); setDownloading(false); }
      setProgress(p);
    }, 200);
  };

  return (
    <button onClick={handleDownload} style={{ padding: '6px 10px', background: done ? 'rgba(34,197,94,0.15)' : 'var(--surface2)', border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`, borderRadius: '8px', color: done ? '#22C55E' : 'var(--text2)', fontSize: '11px', fontWeight: 700, cursor: downloading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', position: 'relative', overflow: 'hidden', minWidth: '65px', justifyContent: 'center' }}>
      {downloading && <div style={{ position: 'absolute', left: 0, bottom: 0, height: '3px', width: `${progress}%`, background: 'var(--grad)', transition: 'width 0.2s', borderRadius: '0 0 8px 8px' }} />}
      {done ? '✓ Saved' : downloading ? `${Math.round(progress)}%` : '⬇ Save'}
    </button>
  );
}

/* ─── Main Page ─── */
export default function PastPapersPage() {
  const [subject, setSubject] = useState('All');
  const [year, setYear] = useState('All Years');
  const [mode, setMode] = useState<Record<string, string>>({});
  const [activeOverlay, setActiveOverlay] = useState<{ type: string; paper: Paper } | null>(null);

  const filtered = PAPERS.filter(p =>
    (subject === 'All' || p.subject === subject) &&
    (year === 'All Years' || p.year.toString() === year)
  );

  const handleAction = (paper: Paper, actionMode: string) => {
    setActiveOverlay({ type: actionMode, paper });
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Overlays */}
      {activeOverlay?.type === 'view' && <PdfViewer paper={activeOverlay.paper} onClose={() => setActiveOverlay(null)} />}
      {activeOverlay?.type === 'practice' && <PracticeMode paper={activeOverlay.paper} onClose={() => setActiveOverlay(null)} />}
      {activeOverlay?.type === 'timed' && <TimedExam paper={activeOverlay.paper} onClose={() => setActiveOverlay(null)} />}

      <div className="top-bar">
        <span style={{ fontWeight: 800, fontSize: '20px' }}>Past Papers</span>
        <span style={{ fontSize: '12px', color: 'var(--text2)', background: 'var(--surface)', padding: '4px 10px', borderRadius: '8px' }}>KCSE 2018–2023</span>
      </div>

      {/* Subject Filter */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto', scrollbarWidth: 'none', borderBottom: '1px solid var(--border)' }}>
        {SUBJECTS.map(s => (
          <button key={s} onClick={() => setSubject(s)} className={`chip${subject === s ? ' active' : ''}`}>{s}</button>
        ))}
      </div>

      {/* Year filter */}
      <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', overflowX: 'auto', scrollbarWidth: 'none', borderBottom: '1px solid var(--border)' }}>
        {YEARS.map(y => (
          <button key={y} onClick={() => setYear(y)} style={{ padding: '5px 12px', background: year === y ? 'rgba(59,130,246,0.2)' : 'var(--surface)', border: `1px solid ${year === y ? 'var(--blue)' : 'var(--border)'}`, borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: year === y ? 'white' : 'var(--text2)', whiteSpace: 'nowrap', flexShrink: 0 }}>{y}</button>
        ))}
      </div>

      {/* Papers */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{filtered.length} papers found</div>
        {filtered.map(p => {
          const color = SUBJECT_COLORS[p.subject] || '#3B82F6';
          return (
            <div key={p.id} style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ height: '4px', background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
              <div style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color, background: `${color}18`, padding: '2px 8px', borderRadius: '6px' }}>{p.subject}</span>
                      {p.verified && <span style={{ fontSize: '11px', color: '#22C55E', background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: '6px' }}>✓ Verified</span>}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '15px', lineHeight: 1.3, marginBottom: '4px' }}>{p.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{p.session} · {p.duration} min · {p.marks} marks</div>
                  </div>
                  <DownloadBtn />
                </div>

                {/* Topics */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {p.topics.map(t => (
                    <span key={t} style={{ fontSize: '11px', padding: '3px 8px', background: 'var(--surface2)', borderRadius: '6px', color: 'var(--text2)' }}>{t}</span>
                  ))}
                </div>

                {/* Mode selector */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {[
                    { key: 'view', label: '👁 View PDF', color: 'var(--surface2)' },
                    { key: 'practice', label: '✏️ Practice', color: 'rgba(59,130,246,0.15)' },
                    { key: 'timed', label: '⏱ Timed', color: 'rgba(239,68,68,0.12)' },
                  ].map(m => (
                    <button key={m.key} onClick={() => setMode(prev => ({ ...prev, [p.id]: m.key }))} style={{ padding: '8px 4px', background: mode[p.id] === m.key ? m.color : 'var(--surface2)', border: `1px solid ${mode[p.id] === m.key ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`, borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: 'white' }}>
                      {m.label}
                    </button>
                  ))}
                </div>
                {(() => {
                  const action = mode[p.id];
                  if (!action) return null;
                  return (
                    <button onClick={() => handleAction(p, action)} style={{ marginTop: '10px', width: '100%', padding: '10px', background: 'var(--grad)', color: 'white', borderRadius: '10px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                      {action === 'view' ? 'Open PDF →' : action === 'practice' ? 'Start Practice Mode →' : 'Start Timed Exam →'}
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
