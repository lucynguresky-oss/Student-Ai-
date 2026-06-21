'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const QUIZZES: Record<string, any> = {
  q1: {
    id: 'q1',
    title: 'Cell Division Mastery Quiz',
    subject: 'Biology',
    xpReward: 75,
    questions: [
      { id: 1, type: 'MCQ', prompt: 'Which phase of mitosis involves chromosomes aligning at the cell equator?', options: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'], correct: 1, explanation: 'During Metaphase, chromosomes align along the metaphase plate.' },
      { id: 2, type: 'TF', prompt: 'Mitosis produces four genetically identical daughter cells.', options: ['True', 'False'], correct: 1, explanation: 'False. Mitosis produces TWO genetically identical daughter cells.' },
      { id: 3, type: 'SA', prompt: 'What is the process of cytoplasm dividing after nuclear division called?', answer: 'cytokinesis', explanation: 'Cytokinesis is the division of the cytoplasm. Karyokinesis refers to nuclear division.' },
    ],
  },
  q_biology: {
    id: 'q_biology',
    title: 'Biology Foundation Quiz',
    subject: 'Biology',
    xpReward: 80,
    questions: [
      { id: 1, type: 'MCQ', prompt: 'Which organelle is known as the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Apparatus'], correct: 1, explanation: 'Mitochondria generate most of the chemical energy needed to power the cell.' },
      { id: 2, type: 'SA', prompt: 'What pigment gives plants their green color?', answer: 'chlorophyll', explanation: 'Chlorophyll is the green pigment responsible for capturing light energy for photosynthesis.' },
    ],
  },
  q_mathematics: {
    id: 'q_mathematics',
    title: 'Corbett Maths: Integration Mastery',
    subject: 'Mathematics',
    xpReward: 100,
    questions: [
      { id: 1, type: 'MCQ', prompt: 'What is the indefinite integral of 2x?', options: ['x² + C', '2', 'x²', '2x² + C'], correct: 0, explanation: 'Using the power rule, the integral of x^n is (x^(n+1))/(n+1). So integral of 2x is x² + C.' },
      { id: 2, type: 'SA', prompt: 'Evaluate the definite integral of 3x² from x=0 to x=2.', answer: '8', explanation: 'The integral is x³. Evaluating from 0 to 2 gives 2³ - 0³ = 8 - 0 = 8.' },
      { id: 3, type: 'TF', prompt: 'The constant of integration "C" is required when evaluating definite integrals.', options: ['True', 'False'], correct: 1, explanation: 'False. Definite integrals evaluate to a specific numeric value, so the constant "C" cancels out.' },
    ],
  }
};

export default function QuizPage({ params }: { params: { id: string } }) {
  const quizId = params.id.toLowerCase();
  const QUIZ = QUIZZES[quizId] || QUIZZES['q1'];

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [shortAnswerText, setShortAnswerText] = useState('');
  const [answers, setAnswers] = useState<(number | string | null)[]>(new Array(QUIZ.questions.length).fill(null));
  const [showExplanation, setShowExplanation] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setTimeLeft(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [finished]);

  const q = QUIZ.questions[currentQ]!;
  const isSA = q.type === 'SA';
  const answered = answers[currentQ] !== null;

  const getScore = () => {
    return answers.filter((a, i) => {
      const question = QUIZ.questions[i];
      if (a === null) return false;
      if (question.type === 'SA') return String(a).toLowerCase().trim() === String(question.answer).toLowerCase().trim();
      return a === question.correct;
    }).length;
  };

  const score = getScore();
  const pct = Math.round((score / QUIZ.questions.length) * 100);
  const xpEarned = Math.round((pct / 100) * QUIZ.xpReward);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const isCurrentCorrect = () => {
    if (!answered) return false;
    if (isSA) return String(answers[currentQ]).toLowerCase().trim() === String(q.answer).toLowerCase().trim();
    return answers[currentQ] === q.correct;
  };

  const handleSelectMCQ = (i: number) => {
    if (answered) return;
    setSelected(i);
    const newAnswers = [...answers];
    newAnswers[currentQ] = i;
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleSubmitSA = (e: React.FormEvent) => {
    e.preventDefault();
    if (answered || !shortAnswerText.trim()) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = shortAnswerText;
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const next = () => {
    if (currentQ + 1 >= QUIZ.questions.length) { setFinished(true); return; }
    setCurrentQ(c => c + 1);
    setSelected(null);
    setShortAnswerText('');
    setShowExplanation(false);
  };

  if (finished) {
    const grade = pct >= 80 ? '🏆 Excellent!' : pct >= 60 ? '👍 Good job!' : '📚 Keep practicing!';
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '📚'}</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Quiz Complete!</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 32 }}>{grade}</p>

        <div style={{ width: 140, height: 140, borderRadius: '50%', background: 'var(--surface)', border: `6px solid ${pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444' }}>{pct}%</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{score}/{QUIZ.questions.length} correct</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, width: '100%', marginBottom: 32 }}>
          {[
            { label: 'XP Earned', value: `+${xpEarned}`, color: '#F59E0B' },
            { label: 'Correct', value: String(score), color: '#22C55E' },
            { label: 'Wrong', value: String(QUIZ.questions.length - score), color: '#EF4444' },
          ].map(s => (
            <div key={s.label} style={{ padding: 14, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <Link href={`/subject/${QUIZ.subject.toLowerCase()}`} className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none', padding: 16 }}>Back to Hub</Link>
          <button onClick={() => { setCurrentQ(0); setSelected(null); setShortAnswerText(''); setAnswers(new Array(QUIZ.questions.length).fill(null)); setShowExplanation(false); setFinished(false); setTimeLeft(300); }} className="btn-primary" style={{ flex: 1, borderRadius: 10 }}>Try Again</button>
        </div>
      </div>
    );
  }

  const ansCorrect = isCurrentCorrect();

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div className="top-bar">
        <Link href={`/subject/${QUIZ.subject.toLowerCase()}`} style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{QUIZ.subject} Quiz</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: timeLeft < 60 ? '#EF4444' : 'var(--text2)', fontWeight: 700, fontSize: 14, background: 'var(--surface)', padding: '4px 10px', borderRadius: 8 }}>
          ⏱ {fmt(timeLeft)}
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
          <span>Question {currentQ + 1} of {QUIZ.questions.length}</span>
          <span style={{ color: '#F59E0B', fontWeight: 700 }}>⚡ +{QUIZ.xpReward} XP</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {QUIZ.questions.map((_: any, i: number) => {
            let color = 'var(--surface)';
            if (i < currentQ) {
              const prevQ = QUIZ.questions[i];
              const prevA = answers[i];
              if (prevQ.type === 'SA') {
                color = String(prevA).toLowerCase().trim() === String(prevQ.answer).toLowerCase().trim() ? '#22C55E' : '#EF4444';
              } else {
                color = prevA === prevQ.correct ? '#22C55E' : '#EF4444';
              }
            } else if (i === currentQ) {
              color = 'var(--blue)';
            }
            return <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: color }} />;
          })}
        </div>
      </div>

      {/* Question */}
      <div style={{ padding: '20px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', marginBottom: 10 }}>
          {q.type === 'TF' ? 'TRUE OR FALSE' : q.type === 'SA' ? 'SHORT ANSWER' : 'MULTIPLE CHOICE'}
        </div>
        {quizId === 'q_mathematics' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, background: 'rgba(124,58,237,0.1)', padding: '4px 10px', borderRadius: 6, width: 'max-content' }}>
            <img src="https://corbettmaths.com/wp-content/uploads/2018/12/corbettmaths-logo-1.png" alt="Corbett Maths" style={{ height: 16 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>Powered by Corbett Maths</span>
          </div>
        )}
        <h2 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.45, marginBottom: 24 }}>{q.prompt}</h2>

        {isSA ? (
          <form onSubmit={handleSubmitSA} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input 
              value={answered ? String(answers[currentQ]) : shortAnswerText} 
              onChange={e => setShortAnswerText(e.target.value)} 
              disabled={answered}
              placeholder="Type your answer here..."
              style={{ padding: 16, borderRadius: 12, background: 'var(--surface)', border: `1.5px solid ${answered ? (ansCorrect ? '#22C55E' : '#EF4444') : 'var(--blue)'}`, color: 'var(--text)', fontSize: 16, outline: 'none' }} 
            />
            {!answered && (
              <button type="submit" className="btn-primary" style={{ padding: 16, borderRadius: 12, marginTop: 10 }}>Submit Answer</button>
            )}
            {answered && !ansCorrect && (
              <div style={{ fontSize: 14, color: '#22C55E', fontWeight: 600, marginTop: 8 }}>Correct Answer: {q.answer}</div>
            )}
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt: string, i: number) => {
              const isCorrect = i === q.correct;
              const isSelected = selected === i || answers[currentQ] === i;
              let bg = 'var(--surface)', border = 'var(--border)', color = 'var(--text)';
              if (answered) {
                if (isCorrect) { bg = 'rgba(34,197,94,0.12)'; border = '#22C55E'; color = '#22C55E'; }
                else if (isSelected) { bg = 'rgba(239,68,68,0.12)'; border = '#EF4444'; color = '#EF4444'; }
              } else if (isSelected) { bg = 'rgba(59,130,246,0.12)'; border = 'var(--blue)'; }

              return (
                <button key={i} onClick={() => handleSelectMCQ(i)} disabled={answered} style={{ padding: '14px 16px', borderRadius: 12, background: bg, border: `1.5px solid ${border}`, color, fontSize: 15, fontWeight: 500, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s', cursor: answered ? 'default' : 'pointer' }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: (answered && isCorrect) || (!answered && isSelected) ? color : 'transparent', border: `2px solid ${answered ? color : isSelected ? 'var(--blue)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, color: (answered && isCorrect) ? 'var(--bg)' : 'inherit' }}>
                    {answered && isCorrect ? '✓' : answered && isSelected && !isCorrect ? '✗' : String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {showExplanation && (
          <div style={{ marginTop: 16, padding: '14px 16px', background: ansCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${ansCorrect ? '#22C55E' : '#EF4444'}33`, borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: ansCorrect ? '#22C55E' : '#EF4444', marginBottom: 6 }}>
              {ansCorrect ? '✅ Correct!' : '❌ Incorrect'}
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.55, margin: 0 }}>{q.explanation}</p>
          </div>
        )}
      </div>

      {/* Next button */}
      {answered && (
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: 16, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)' }}>
          <button onClick={next} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, width: '100%' }}>
            {currentQ + 1 >= QUIZ.questions.length ? '📊 See Results' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  );
}
