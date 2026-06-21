'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Card { front: string; back: string; difficulty: 'easy' | 'medium' | 'hard'; }
interface Deck { id: string; name: string; subject: string; emoji: string; color: string; cards: Card[]; }

const DECKS: Deck[] = [
  { id: 'bio', name: 'Biology Basics', subject: 'Biology', emoji: '🧬', color: '#22C55E', cards: [
    { front: 'What is the powerhouse of the cell?', back: 'Mitochondria — it produces ATP through cellular respiration.', difficulty: 'easy' },
    { front: 'What is osmosis?', back: 'The movement of water molecules from a region of high concentration to low concentration through a semi-permeable membrane.', difficulty: 'easy' },
    { front: 'Name the four bases in DNA.', back: 'Adenine (A), Thymine (T), Guanine (G), Cytosine (C). A pairs with T, G pairs with C.', difficulty: 'medium' },
    { front: 'What is photosynthesis?', back: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂. Plants convert light energy to glucose using chlorophyll.', difficulty: 'medium' },
    { front: 'What is the difference between mitosis and meiosis?', back: 'Mitosis: 2 identical daughter cells (somatic). Meiosis: 4 genetically unique cells (gametes) with half the chromosomes.', difficulty: 'hard' },
    { front: 'What is homeostasis?', back: 'The maintenance of a constant internal environment in the body (e.g., temperature, blood sugar, pH).', difficulty: 'medium' },
    { front: 'What is the role of enzymes?', back: 'Biological catalysts that speed up chemical reactions without being used up. They are substrate-specific.', difficulty: 'easy' },
    { front: 'Name 3 types of blood vessels.', back: 'Arteries (carry oxygenated blood away from heart), Veins (carry deoxygenated blood to heart), Capillaries (gas exchange).', difficulty: 'medium' },
    { front: 'What is natural selection?', back: 'The process where organisms with favorable traits are more likely to survive and reproduce. Proposed by Charles Darwin.', difficulty: 'hard' },
    { front: 'What is the function of the kidney?', back: 'Excretion of waste (urea), osmoregulation (water balance), and maintaining blood pH. The functional unit is the nephron.', difficulty: 'hard' },
  ]},
  { id: 'chem', name: 'Chemistry Reactions', subject: 'Chemistry', emoji: '🧪', color: '#F59E0B', cards: [
    { front: 'What is an acid?', back: 'A substance that donates H⁺ ions (protons) in solution. pH < 7. Examples: HCl, H₂SO₄, HNO₃.', difficulty: 'easy' },
    { front: 'What is the pH of pure water?', back: 'pH 7 — neutral. Water is neither acidic nor basic.', difficulty: 'easy' },
    { front: 'Define an exothermic reaction.', back: 'A reaction that releases heat energy to the surroundings. ΔH is negative. Example: combustion, neutralization.', difficulty: 'medium' },
    { front: 'What is an ionic bond?', back: 'A bond formed by the transfer of electrons from a metal to a non-metal, creating oppositely charged ions that attract.', difficulty: 'medium' },
    { front: 'Balance: Fe + O₂ → Fe₂O₃', back: '4Fe + 3O₂ → 2Fe₂O₃. Count atoms: 4Fe on each side, 6O on each side.', difficulty: 'hard' },
    { front: 'What is the mole?', back: 'One mole = 6.022 × 10²³ particles (Avogadro\'s number). It is the amount of substance containing this many entities.', difficulty: 'medium' },
    { front: 'What is electrolysis?', back: 'Using electrical energy to decompose an ionic compound in molten or aqueous form. Cations go to cathode, anions to anode.', difficulty: 'hard' },
    { front: 'What gas turns limewater milky?', back: 'Carbon dioxide (CO₂). CO₂ + Ca(OH)₂ → CaCO₃ + H₂O. The white CaCO₃ precipitate causes milkiness.', difficulty: 'easy' },
    { front: 'Name 3 types of chemical reactions.', back: 'Combination, Decomposition, Displacement, Neutralization, Combustion, Redox.', difficulty: 'medium' },
    { front: 'What is Le Chatelier\'s Principle?', back: 'If a dynamic equilibrium is disturbed, the system adjusts to minimize the disturbance and restore equilibrium.', difficulty: 'hard' },
  ]},
  { id: 'phy', name: 'Physics Laws', subject: 'Physics', emoji: '⚛️', color: '#3B82F6', cards: [
    { front: 'State Newton\'s First Law.', back: 'An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted on by an external force.', difficulty: 'easy' },
    { front: 'What is the formula for speed?', back: 'Speed = Distance / Time (v = d/t). SI unit: metres per second (m/s).', difficulty: 'easy' },
    { front: 'State Ohm\'s Law.', back: 'V = IR. Voltage equals current times resistance. V in volts, I in amperes, R in ohms.', difficulty: 'medium' },
    { front: 'What is the SI unit of energy?', back: 'The Joule (J). 1 J = 1 kg⋅m²/s². Named after James Prescott Joule.', difficulty: 'easy' },
    { front: 'Define acceleration.', back: 'The rate of change of velocity. a = (v - u) / t. SI unit: m/s². Can be positive (speeding up) or negative (deceleration).', difficulty: 'medium' },
    { front: 'What is Hooke\'s Law?', back: 'F = ke. Force is proportional to extension, provided the elastic limit is not exceeded. k = spring constant.', difficulty: 'medium' },
    { front: 'What is electromagnetic induction?', back: 'The generation of an EMF (voltage) when a conductor cuts through magnetic field lines. Basis of generators and transformers.', difficulty: 'hard' },
    { front: 'Define pressure.', back: 'Pressure = Force / Area (P = F/A). SI unit: Pascal (Pa). 1 Pa = 1 N/m².', difficulty: 'easy' },
    { front: 'What is the principle of moments?', back: 'For a body in equilibrium, the sum of clockwise moments equals the sum of anticlockwise moments about any point.', difficulty: 'hard' },
    { front: 'State the law of conservation of energy.', back: 'Energy cannot be created or destroyed, only transformed from one form to another. Total energy in a closed system is constant.', difficulty: 'medium' },
  ]},
  { id: 'math', name: 'Math Formulas', subject: 'Mathematics', emoji: '📐', color: '#7C3AED', cards: [
    { front: 'Area of a circle?', back: 'A = πr². Where r is the radius. For KCSE, use π = 22/7 or 3.142.', difficulty: 'easy' },
    { front: 'Quadratic formula?', back: 'x = [-b ± √(b² - 4ac)] / 2a. Used to solve ax² + bx + c = 0.', difficulty: 'medium' },
    { front: 'What is the Pythagorean theorem?', back: 'a² + b² = c². In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.', difficulty: 'easy' },
    { front: 'Sin, Cos, Tan ratios?', back: 'SOH-CAH-TOA: Sin = Opposite/Hypotenuse, Cos = Adjacent/Hypotenuse, Tan = Opposite/Adjacent.', difficulty: 'medium' },
    { front: 'What is the gradient of a straight line?', back: 'm = (y₂ - y₁) / (x₂ - x₁). Also equals "rise over run". In y = mx + c, m is the gradient.', difficulty: 'easy' },
    { front: 'Volume of a cylinder?', back: 'V = πr²h. Where r = radius, h = height. Surface area = 2πr² + 2πrh.', difficulty: 'medium' },
    { front: 'What is the sum of angles in a triangle?', back: '180°. In any triangle, the three interior angles always add up to 180 degrees.', difficulty: 'easy' },
    { front: 'Differentiate y = xⁿ', back: 'dy/dx = nxⁿ⁻¹. The power rule: bring the power down and reduce it by 1.', difficulty: 'hard' },
    { front: 'What is compound interest formula?', back: 'A = P(1 + r/n)^(nt). P = principal, r = rate, n = times compounded per year, t = years.', difficulty: 'hard' },
    { front: 'Laws of indices: aᵐ × aⁿ = ?', back: 'aᵐ × aⁿ = aᵐ⁺ⁿ. When multiplying same base, add the powers. aᵐ ÷ aⁿ = aᵐ⁻ⁿ.', difficulty: 'medium' },
  ]},
  { id: 'eng', name: 'English Grammar', subject: 'English', emoji: '📝', color: '#EC4899', cards: [
    { front: 'What is a noun?', back: 'A word that names a person, place, thing, or idea. Types: proper, common, abstract, collective, compound.', difficulty: 'easy' },
    { front: 'What is a simile?', back: 'A figure of speech comparing two unlike things using "like" or "as". Example: "She runs like the wind."', difficulty: 'easy' },
    { front: 'Define personification.', back: 'Giving human qualities to non-human things or abstract ideas. Example: "The wind whispered through the trees."', difficulty: 'medium' },
    { front: 'Active vs Passive voice?', back: 'Active: Subject performs action ("She wrote the essay"). Passive: Subject receives action ("The essay was written by her").', difficulty: 'medium' },
    { front: 'What are the 8 parts of speech?', back: 'Noun, Pronoun, Verb, Adjective, Adverb, Preposition, Conjunction, Interjection.', difficulty: 'hard' },
    { front: 'What is an oxymoron?', back: 'A figure of speech combining contradictory terms. Examples: "bittersweet", "deafening silence", "living dead".', difficulty: 'medium' },
    { front: 'What is a thesis statement?', back: 'The main argument or claim of an essay, usually stated in the introduction. It guides the entire essay\'s direction.', difficulty: 'medium' },
    { front: 'Difference: "affect" vs "effect"?', back: 'Affect = verb (to influence). Effect = noun (result). "The rain affected the game. The effect was a delayed start."', difficulty: 'hard' },
    { front: 'What is irony?', back: 'When the opposite of what is expected happens or is stated. Types: dramatic, situational, verbal.', difficulty: 'medium' },
    { front: 'What is an alliteration?', back: 'Repetition of initial consonant sounds in closely connected words. Example: "Peter Piper picked a peck of pickled peppers."', difficulty: 'easy' },
  ]},
];

const DIFF_COLORS = { easy: '#22C55E', medium: '#F59E0B', hard: '#EF4444' };

/* ─── Deck Selector ─── */
function DeckSelector({ onSelect }: { onSelect: (deck: Deck) => void }) {
  return (
    <div style={{ paddingBottom: '80px' }}>
      <div className="top-bar">
        <Link href="/learn" style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <span style={{ fontWeight: 800, fontSize: '18px' }}>Flashcards</span>
        <div style={{ width: '22px' }} />
      </div>

      <div style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>Choose a Deck</h2>
        <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '20px' }}>Select a subject to start studying</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {DECKS.map(deck => (
            <button key={deck.id} onClick={() => onSelect(deck)} style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: '16px', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.15s', width: '100%',
            }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${deck.color}18`, border: `1px solid ${deck.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>{deck.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'white', marginBottom: '2px' }}>{deck.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{deck.cards.length} cards · ~{Math.ceil(deck.cards.length * 0.8)} min</div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                  {(['easy', 'medium', 'hard'] as const).map(d => {
                    const count = deck.cards.filter(c => c.difficulty === d).length;
                    return count > 0 ? (
                      <span key={d} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: `${DIFF_COLORS[d]}18`, color: DIFF_COLORS[d], fontWeight: 700 }}>{count} {d}</span>
                    ) : null;
                  })}
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Card Study Session ─── */
function StudySession({ deck, onExit }: { deck: Deck; onExit: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<('knew' | 'learning')[]>([]);
  const [completed, setCompleted] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewCards, setReviewCards] = useState<Card[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewFlipped, setReviewFlipped] = useState(false);

  const cards = reviewMode ? reviewCards : deck.cards;
  const idx = reviewMode ? reviewIndex : currentIndex;
  const card = cards[idx];
  const isFlipped = reviewMode ? reviewFlipped : flipped;

  const handleResult = (result: 'knew' | 'learning') => {
    if (!reviewMode) {
      setResults(r => [...r, result]);
      if (currentIndex < deck.cards.length - 1) {
        setFlipped(false);
        setTimeout(() => setCurrentIndex(i => i + 1), 200);
      } else {
        setCompleted(true);
      }
    } else {
      setReviewFlipped(false);
      if (reviewIndex < reviewCards.length - 1) {
        setTimeout(() => setReviewIndex(i => i + 1), 200);
      } else {
        setReviewMode(false);
        setCompleted(true);
      }
    }
  };

  const startReview = () => {
    const missed = deck.cards.filter((_, i) => results[i] === 'learning');
    if (missed.length === 0) return;
    setReviewCards(missed);
    setReviewIndex(0);
    setReviewFlipped(false);
    setReviewMode(true);
    setCompleted(false);
  };

  if (completed) {
    const knew = results.filter(r => r === 'knew').length;
    const learning = results.filter(r => r === 'learning').length;
    const pct = Math.round((knew / deck.cards.length) * 100);
    const xpEarned = knew * 10 + learning * 3;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📚'}</div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>Deck Complete!</h2>
        <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '24px' }}>{deck.name}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', width: '100%', maxWidth: '360px', marginBottom: '32px' }}>
          <div style={{ padding: '14px', background: 'rgba(34,197,94,0.1)', borderRadius: '14px', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#22C55E' }}>{knew}</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>Mastered</div>
          </div>
          <div style={{ padding: '14px', background: 'rgba(239,68,68,0.1)', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#EF4444' }}>{learning}</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>Learning</div>
          </div>
          <div style={{ padding: '14px', background: 'rgba(245,158,11,0.1)', borderRadius: '14px', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#F59E0B' }}>+{xpEarned}</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>XP</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '360px' }}>
          {learning > 0 && (
            <button onClick={startReview} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
              🔄 Review {learning} Missed Cards
            </button>
          )}
          <button onClick={onExit} style={{ padding: '14px', borderRadius: '12px', background: 'var(--grad)', color: 'white', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer' }}>
            Try Another Deck
          </button>
        </div>
      </div>
    );
  }

  if (!card) return null;

  const totalCards = reviewMode ? reviewCards.length : deck.cards.length;
  const currentNum = idx + 1;
  const diffColor = DIFF_COLORS[card.difficulty];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={onExit} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{reviewMode ? '🔄 Review Mode' : deck.name}</div>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>{currentNum} of {totalCards}</div>
        </div>
        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: `${diffColor}18`, color: diffColor, fontWeight: 700 }}>{card.difficulty}</span>
      </div>

      {/* Progress */}
      <div style={{ height: '3px', background: 'var(--surface)' }}>
        <div style={{ height: '100%', width: `${(currentNum / totalCards) * 100}%`, background: deck.color, transition: 'width 0.4s ease', borderRadius: '0 2px 2px 0' }} />
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div onClick={() => setFlipped(f => !f)} style={{ perspective: '1000px', width: '100%', maxWidth: '380px', height: '300px', cursor: 'pointer' }}>
          <div style={{
            width: '100%', height: '100%', position: 'relative',
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {/* Front */}
            <div style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              background: `linear-gradient(135deg, ${deck.color}12, ${deck.color}06)`,
              border: `1.5px solid ${deck.color}30`, borderRadius: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '32px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.6 }}>{deck.emoji}</div>
              <p style={{ fontSize: '18px', fontWeight: 600, lineHeight: 1.5, color: 'white' }}>{card.front}</p>
              <div style={{ position: 'absolute', bottom: '16px', fontSize: '12px', color: 'var(--text3)' }}>Tap to reveal answer</div>
            </div>

            {/* Back */}
            <div style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(135deg, rgba(24,214,200,0.08), rgba(59,130,246,0.06))',
              border: '1.5px solid rgba(24,214,200,0.3)', borderRadius: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '32px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#18D6C8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Answer</div>
              <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--text)' }}>{card.back}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {isFlipped && (
        <div style={{ padding: '16px', display: 'flex', gap: '12px', flexShrink: 0 }}>
          <button onClick={() => { reviewMode ? setReviewFlipped(false) : setFlipped(false); handleResult('learning'); }} style={{
            flex: 1, padding: '16px', borderRadius: '14px',
            background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)',
            color: '#EF4444', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
          }}>
            ❌ Still Learning
          </button>
          <button onClick={() => { reviewMode ? setReviewFlipped(false) : setFlipped(false); handleResult('knew'); }} style={{
            flex: 1, padding: '16px', borderRadius: '14px',
            background: 'rgba(34,197,94,0.1)', border: '1.5px solid rgba(34,197,94,0.3)',
            color: '#22C55E', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
          }}>
            ✅ I Knew It!
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main ─── */
export default function FlashcardsPage() {
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  if (selectedDeck) {
    return <StudySession deck={selectedDeck} onExit={() => setSelectedDeck(null)} />;
  }

  return <DeckSelector onSelect={setSelectedDeck} />;
}
