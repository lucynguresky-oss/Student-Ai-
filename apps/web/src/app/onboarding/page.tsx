'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check, Flame, Star, Globe, Clock, BookOpen, Zap, Target, Award } from 'lucide-react';
import LumiMascot from '@/components/LumiMascot';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { onboardingApi, referenceApi, LearnixApiError } from '@/lib/api';

const TOTAL_STEPS = 10;

/* ─── Step data ───────────────────────────────────────────────── */
const GOALS = [
  { id: 'EXAM', label: 'Prepare for an exam', icon: <BookOpen size={20} />, emoji: '📚' },
  { id: 'CAREER', label: 'Advance my career', icon: <Award size={20} />, emoji: '💼' },
  { id: 'HOBBY', label: 'Learn as a hobby', icon: <Star size={20} />, emoji: '🎨' },
  { id: 'LANGUAGE', label: 'Learn a new language', icon: <Globe size={20} />, emoji: '🌍' },
  { id: 'SKILLS', label: 'Build new skills', icon: <Zap size={20} />, emoji: '⚡' },
  { id: 'SOCIAL', label: 'Connect with others', icon: <Target size={20} />, emoji: '🤝' },
];

const DAILY_GOALS = [
  { value: 5, label: '5 min', sublabel: 'Casual learner' },
  { value: 10, label: '10 min', sublabel: 'Regular practice' },
  { value: 20, label: '20 min', sublabel: 'Dedicated student' },
  { value: 30, label: '30 min', sublabel: 'Intense focus' },
];

const LEVELS = [
  { id: 'BEGINNER', label: 'Beginner', desc: 'Just starting out', emoji: '🌱' },
  { id: 'INTERMEDIATE', label: 'Intermediate', desc: 'Know the basics', emoji: '🌿' },
  { id: 'ADVANCED', label: 'Advanced', desc: 'Looking to master it', emoji: '🌳' },
];

/* ─── Animation variants ──────────────────────────────────────── */
const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [level, setLevel] = useState('BEGINNER');
  const [dailyGoal, setDailyGoal] = useState(10);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [languages, setLanguages] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedLang, setSelectedLang] = useState('en');
  const [tracks, setTracks] = useState<Array<{ id: string; name: string; emoji?: string }>>([]);
  const [quizQuestions, setQuizQuestions] = useState<Array<{ id: string; text: string; options: string[] }>>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [plan, setPlan] = useState<{ trackName: string; weeklyGoal: number } | null>(null);

  // Load reference data
  useEffect(() => {
    referenceApi.languages().then((langs) => setLanguages(langs.slice(0, 40)));
    onboardingApi.state().then((state) => {
      const s = state as { step?: number; name?: string } | null;
      if (s?.step && s.step > 1) setStep(s.step as number);
      if (s?.name) setName(s.name as string);
    }).catch(() => {});
  }, []);

  // Load placement questions when reaching step 9
  useEffect(() => {
    if (step === 9 && selectedSubjects.length > 0) {
      const trackId = selectedSubjects[0];
      onboardingApi.placementQuestions(trackId).then((res) => {
        setQuizQuestions(res.questions.slice(0, 5));
      }).catch(() => {
        setQuizQuestions([
          { id: 'q1', text: 'Which of these topics are you most familiar with?', options: ['None yet', 'Some basics', 'Intermediate', 'Advanced'] },
          { id: 'q2', text: 'How would you rate your confidence?', options: ['Not confident', 'Slightly confident', 'Moderately confident', 'Very confident'] },
        ]);
      });
    }
  }, [step, selectedSubjects]);

  function go(newStep: number) {
    setDir(newStep > step ? 1 : -1);
    setStep(newStep);
  }

  async function complete() {
    setLoading(true);
    try {
      await onboardingApi.advance('goal', { goals: selectedGoals });
      await onboardingApi.advance('subjects', { subjects: selectedSubjects });
      await onboardingApi.advance('level', { level });
      await onboardingApi.advance('daily-goal', { dailyGoalMins: dailyGoal });
      await onboardingApi.advance('reminder', { reminderTime });
      if (quizQuestions.length > 0) {
        await onboardingApi.submitPlacement(
          Object.entries(quizAnswers).map(([questionId, answerIndex]) => ({ questionId, answerIndex })),
        );
      }
      await onboardingApi.complete();
      setPlan({ trackName: selectedSubjects[0] ?? 'General Learning', weeklyGoal: dailyGoal * 7 });
      setDir(1);
      setStep(10);
    } catch {
      // Continue to plan reveal even if API call fails in dev
      setPlan({ trackName: 'General Learning', weeklyGoal: dailyGoal * 7 });
      setDir(1);
      setStep(10);
    } finally {
      setLoading(false);
    }
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-lx-teal/5 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-lx-purple/5 blur-[100px]" />
      </div>

      {/* Header with progress */}
      <header className="relative z-10 flex items-center gap-4 p-4 md:p-6 max-w-lg mx-auto w-full">
        {step > 1 && step < 10 && (
          <button
            id="onboarding-back-btn"
            onClick={() => go(step - 1)}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--bg-surface)] border border-[var(--border)] hover:border-lx-blue transition-colors"
            aria-label="Back"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <div className="flex-1">
          <div className="lx-progress">
            <motion.div
              className="lx-progress-fill"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
        <span className="text-xs text-[var(--text-dim)] whitespace-nowrap">
          {step < 10 ? `${step} / ${TOTAL_STEPS}` : '🎉'}
        </span>
      </header>

      {/* Step content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 1 && <StepWelcome onNext={() => go(2)} />}
              {step === 2 && <StepLanguage languages={languages} selected={selectedLang} setSelected={setSelectedLang} onNext={() => go(3)} />}
              {step === 3 && <StepAge value={age} onChange={setAge} onNext={() => go(4)} />}
              {step === 4 && <StepName value={name} onChange={setName} onNext={() => go(5)} />}
              {step === 5 && <StepGoals selected={selectedGoals} setSelected={setSelectedGoals} onNext={() => go(6)} />}
              {step === 6 && <StepSubjects selected={selectedSubjects} setSelected={setSelectedSubjects} onNext={() => go(7)} />}
              {step === 7 && <StepLevel value={level} onChange={setLevel} onNext={() => go(8)} />}
              {step === 8 && <StepDailyGoal value={dailyGoal} onChange={setDailyGoal} onNext={() => go(9)} />}
              {step === 9 && (
                <StepQuiz
                  questions={quizQuestions}
                  answers={quizAnswers}
                  setAnswers={setQuizAnswers}
                  onFinish={complete}
                  loading={loading}
                />
              )}
              {step === 10 && <StepPlanReveal plan={plan} onStart={() => router.push('/home')} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ─── Individual step components ──────────────────────────────── */

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <LumiMascot size={140} mood="happy" />
      <div>
        <h1 className="text-3xl font-black mb-2">
          <span className="lx-gradient-text">Welcome to Learnix!</span> 👋
        </h1>
        <p className="text-[var(--text-muted)] text-lg">
          Let&apos;s personalize your learning journey. It only takes 2 minutes.
        </p>
      </div>
      <Button id="welcome-next-btn" size="lg" onClick={onNext} className="w-full max-w-xs">
        Get started
      </Button>
    </div>
  );
}

function StepLanguage({ languages, selected, setSelected, onNext }: {
  languages: Array<{ code: string; name: string; nativeName?: string }>;
  selected: string;
  setSelected: (c: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader emoji="🌍" title="Choose your language" sub="Select the language you'd like to learn in" />
      <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {(languages.length ? languages : [{ code: 'en', name: 'English' }, { code: 'sw', name: 'Swahili' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' }]).map((l) => (
          <SelectCard
            key={l.code}
            id={`lang-${l.code}`}
            selected={selected === l.code}
            onClick={() => setSelected(l.code)}
            label={l.name}
            sub={l.nativeName}
          />
        ))}
      </div>
      <Button id="language-next-btn" size="lg" onClick={onNext} className="w-full">Continue</Button>
    </div>
  );
}

function StepAge({ value, onChange, onNext }: { value: string; onChange: (v: string) => void; onNext: () => void }) {
  const age = parseInt(value);
  const valid = age >= 4 && age <= 120;
  return (
    <div className="flex flex-col gap-6">
      <StepHeader emoji="🎂" title="How old are you?" sub="We use this to personalize your experience" />
      <Input id="age-input" type="number" placeholder="Your age" value={value}
        onChange={(e) => onChange(e.target.value)} min={4} max={120}
        hint="We keep this private. Must be 4+." />
      {age > 0 && age < 13 && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-400">
          👶 For users under 13, Learnix is learning-only mode until a parent approves social features.
        </div>
      )}
      <Button id="age-next-btn" size="lg" onClick={onNext} disabled={!valid} className="w-full">Continue</Button>
      <button id="age-skip-btn" onClick={onNext} className="text-sm text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors text-center">
        Skip for now
      </button>
    </div>
  );
}

function StepName({ value, onChange, onNext }: { value: string; onChange: (v: string) => void; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader emoji="✨" title="What should we call you?" sub="Your display name on Learnix" />
      <Input id="name-input" placeholder="Alex Johnson" value={value}
        onChange={(e) => onChange(e.target.value)} autoFocus />
      <Button id="name-next-btn" size="lg" onClick={onNext} disabled={value.length < 2} className="w-full">
        {value ? `Hi, ${value}! Continue` : 'Continue'}
      </Button>
    </div>
  );
}

function StepGoals({ selected, setSelected, onNext }: {
  selected: string[]; setSelected: (v: string[]) => void; onNext: () => void;
}) {
  const toggle = (id: string) =>
    setSelected(selected.includes(id) ? selected.filter((g) => g !== id) : [...selected, id]);
  return (
    <div className="flex flex-col gap-6">
      <StepHeader emoji="🎯" title="Why are you here?" sub="Pick your main motivation (choose all that apply)" />
      <div className="grid grid-cols-2 gap-2">
        {GOALS.map((g) => (
          <SelectCard key={g.id} id={`goal-${g.id}`} selected={selected.includes(g.id)}
            onClick={() => toggle(g.id)} label={g.label} emoji={g.emoji} />
        ))}
      </div>
      <Button id="goals-next-btn" size="lg" onClick={onNext} disabled={selected.length === 0} className="w-full">Continue</Button>
    </div>
  );
}

const SUBJECT_OPTIONS = [
  { id: 'math', label: 'Mathematics', emoji: '➗' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'english', label: 'English', emoji: '📖' },
  { id: 'spanish', label: 'Spanish', emoji: '🇪🇸' },
  { id: 'french', label: 'French', emoji: '🇫🇷' },
  { id: 'arabic', label: 'Arabic', emoji: '🌙' },
  { id: 'mandarin', label: 'Mandarin', emoji: '🀄' },
  { id: 'kiswahili', label: 'Kiswahili', emoji: '🌍' },
  { id: 'coding', label: 'Coding', emoji: '💻' },
  { id: 'history', label: 'History', emoji: '🏛️' },
  { id: 'art', label: 'Art & Design', emoji: '🎨' },
  { id: 'music', label: 'Music', emoji: '🎵' },
];

function StepSubjects({ selected, setSelected, onNext }: {
  selected: string[]; setSelected: (v: string[]) => void; onNext: () => void;
}) {
  const toggle = (id: string) =>
    setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  return (
    <div className="flex flex-col gap-6">
      <StepHeader emoji="📚" title="What do you want to learn?" sub="Choose topics that excite you" />
      <div className="grid grid-cols-3 gap-2">
        {SUBJECT_OPTIONS.map((s) => (
          <SelectCard key={s.id} id={`subject-${s.id}`} selected={selected.includes(s.id)}
            onClick={() => toggle(s.id)} label={s.label} emoji={s.emoji} compact />
        ))}
      </div>
      <Button id="subjects-next-btn" size="lg" onClick={onNext} disabled={selected.length === 0} className="w-full">Continue</Button>
    </div>
  );
}

function StepLevel({ value, onChange, onNext }: { value: string; onChange: (v: string) => void; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader emoji="📊" title="What's your level?" sub="Be honest — we'll meet you where you are" />
      <div className="flex flex-col gap-3">
        {LEVELS.map((l) => (
          <button key={l.id} id={`level-${l.id}`} onClick={() => onChange(l.id)}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
              value === l.id
                ? 'border-lx-blue bg-lx-blue/5 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]'
                : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-dim)]'
            }`}
          >
            <span className="text-2xl">{l.emoji}</span>
            <div>
              <div className="font-semibold text-[var(--text)]">{l.label}</div>
              <div className="text-xs text-[var(--text-muted)]">{l.desc}</div>
            </div>
            {value === l.id && <Check size={16} className="text-lx-blue ml-auto" />}
          </button>
        ))}
      </div>
      <Button id="level-next-btn" size="lg" onClick={onNext} className="w-full">Continue</Button>
    </div>
  );
}

function StepDailyGoal({ value, onChange, onNext }: { value: number; onChange: (v: number) => void; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-2">
        <span className="text-4xl">🔥</span>
        <h2 className="text-2xl font-bold text-[var(--text)]">Set your daily goal</h2>
        <p className="text-[var(--text-muted)]">Consistency beats intensity</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {DAILY_GOALS.map((g) => (
          <button key={g.value} id={`daily-${g.value}`} onClick={() => onChange(g.value)}
            className={`p-4 rounded-xl border transition-all text-center ${
              value === g.value
                ? 'border-lx-blue bg-lx-blue/5 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]'
                : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-dim)]'
            }`}
          >
            <Flame size={20} className={value === g.value ? 'text-lx-teal mx-auto mb-1' : 'text-[var(--text-dim)] mx-auto mb-1'} />
            <div className="font-bold text-[var(--text)]">{g.label}</div>
            <div className="text-xs text-[var(--text-muted)]">{g.sublabel}</div>
          </button>
        ))}
      </div>
      <Button id="daily-goal-next-btn" size="lg" onClick={onNext} className="w-full">Continue</Button>
    </div>
  );
}

function StepQuiz({ questions, answers, setAnswers, onFinish, loading }: {
  questions: Array<{ id: string; text: string; options: string[] }>;
  answers: Record<string, number>;
  setAnswers: (a: Record<string, number>) => void;
  onFinish: () => void;
  loading: boolean;
}) {
  const allAnswered = questions.length === 0 || questions.every((q) => answers[q.id] !== undefined);
  return (
    <div className="flex flex-col gap-6">
      <StepHeader emoji="🧠" title="Quick placement quiz" sub="5 questions to find your perfect starting point" />
      {questions.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-muted)]">Loading questions…</div>
      ) : (
        <div className="flex flex-col gap-6">
          {questions.map((q, qi) => (
            <div key={q.id} className="flex flex-col gap-3">
              <p className="font-medium text-[var(--text)]">{qi + 1}. {q.text}</p>
              <div className="grid grid-cols-1 gap-2">
                {q.options.map((opt, i) => (
                  <button key={i} id={`q${qi}-opt${i}`}
                    onClick={() => setAnswers({ ...answers, [q.id]: i })}
                    className={`px-4 py-2.5 rounded-xl border text-left text-sm transition-all ${
                      answers[q.id] === i
                        ? 'border-lx-blue bg-lx-blue/5 text-lx-blue font-medium'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--text-dim)]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <Button id="quiz-finish-btn" size="lg" onClick={onFinish} disabled={!allAnswered} loading={loading} className="w-full">
        Build my plan
      </Button>
      <button id="quiz-skip-btn" onClick={onFinish} className="text-sm text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors text-center">
        Skip quiz
      </button>
    </div>
  );
}

function StepPlanReveal({ plan, onStart }: { plan: { trackName: string; weeklyGoal: number } | null; onStart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
        <LumiMascot size={160} mood="celebrating" />
      </motion.div>
      <div>
        <h1 className="text-3xl font-black mb-3">
          <span className="lx-gradient-text">Your plan is ready!</span> 🎉
        </h1>
        <p className="text-[var(--text-muted)] text-lg mb-6">
          Lumi has crafted a personalized learning path just for you
        </p>
        {plan && (
          <div className="lx-card p-6 text-left mb-6 lx-gradient-border">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full lx-gradient-bg flex items-center justify-center">
                  <BookOpen size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-dim)]">Your track</div>
                  <div className="font-semibold text-[var(--text)] capitalize">{plan.trackName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-lx-teal/10 flex items-center justify-center">
                  <Flame size={18} className="text-lx-teal" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-dim)]">Weekly goal</div>
                  <div className="font-semibold text-[var(--text)]">{plan.weeklyGoal} min / week</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-lx-purple/10 flex items-center justify-center">
                  <Star size={18} className="text-lx-purple" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-dim)]">Starting XP</div>
                  <div className="font-semibold text-[var(--text)]">0 XP — let&apos;s earn some!</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Button id="start-learning-btn" size="lg" onClick={onStart} className="w-full max-w-xs">
        🚀 Start learning
      </Button>
    </div>
  );
}

/* ─── Shared sub-components ───────────────────────────────────── */
function StepHeader({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <div className="text-center flex flex-col items-center gap-2 mb-2">
      <span className="text-4xl">{emoji}</span>
      <h2 className="text-2xl font-bold text-[var(--text)]">{title}</h2>
      <p className="text-[var(--text-muted)] text-sm">{sub}</p>
    </div>
  );
}

function SelectCard({ id, selected, onClick, label, sub, emoji, compact }: {
  id: string; selected: boolean; onClick: () => void;
  label: string; sub?: string; emoji?: string; compact?: boolean;
}) {
  return (
    <button id={id} type="button" onClick={onClick}
      className={`flex ${compact ? 'flex-col items-center' : 'items-center gap-3'} ${compact ? 'p-3 text-center' : 'p-3'} rounded-xl border transition-all ${
        selected
          ? 'border-lx-blue bg-lx-blue/5 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]'
          : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-dim)]'
      }`}
    >
      {emoji && <span className={compact ? 'text-xl mb-1' : 'text-xl'}>{emoji}</span>}
      <div className={compact ? '' : 'flex-1 text-left'}>
        <div className={`font-medium text-[var(--text)] ${compact ? 'text-xs' : 'text-sm'}`}>{label}</div>
        {sub && <div className="text-xs text-[var(--text-dim)] mt-0.5">{sub}</div>}
      </div>
      {selected && !compact && <Check size={14} className="text-lx-blue ml-auto flex-shrink-0" />}
    </button>
  );
}
