'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface OnboardingOption {
  value: string;
  label: string;
  icon?: string;
  sublabel?: string;
  isDefault?: boolean;
}

interface StepConfig {
  id: string;
  kind: 'greeting' | 'single_select' | 'searchable_select' | 'multi_select' | 'date_select' | 'celebration';
  title: string;
  subtitle?: string;
  writesTo: string;
  options?: OnboardingOption[];
  minSelections?: number;
}

interface StepData {
  step: StepConfig;
  totalSteps: number;
  currentStep: number;
}

interface HistoryItem {
  stepData: StepData;
  selectedValue: string | string[] | number;
}

// Subject icon helper
const getSubjectIcon = (key: string): string => {
  switch (key) {
    case 'BIO': return '🌿';
    case 'CHE': return '🧪';
    case 'PHY': return '⚡';
    case 'MAT': return '📐';
    case 'ENG': return '📖';
    default: return '📚';
  }
};

// Subject color accent helper
const getSubjectAccent = (key: string): string => {
  switch (key) {
    case 'BIO': return '#10B981'; // green
    case 'CHE': return '#F59E0B'; // amber
    case 'PHY': return '#3B82F6'; // blue
    case 'MAT': return '#EC4899'; // pink
    case 'ENG': return '#8B5CF6'; // purple
    default: return '#18D6C8';
  }
};

// Simple CSS Confetti Component
function ConfettiEffect() {
  const [pieces, setPieces] = useState<any[]>([]);

  useEffect(() => {
    const colors = ['#18D6C8', '#3B82F6', '#7C3AED', '#EC4899', '#22C55E', '#F59E0B'];
    const newPieces = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 4,
      duration: Math.random() * 2.5 + 2,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 360,
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 10 }}>
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-5vh) rotate(0deg); }
          100% { transform: translateY(105vh) rotate(720deg); }
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: -20,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.5,
            backgroundColor: p.color,
            opacity: 0.8,
            borderRadius: '2px',
            transform: `rotate(${p.tilt}deg)`,
            animation: `fall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// Lumi Mascot component with interactive expressions
function LumiMascot({ expression }: { expression: 'greeting' | 'thinking' | 'happy' | 'excited' | 'standard' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0 16px', position: 'relative' }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-6px) scale(1.02); }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 12px rgba(24, 214, 200, 0.4)); }
          50% { filter: drop-shadow(0 0 24px rgba(24, 214, 200, 0.75)); }
        }
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        .lumi-float {
          animation: float 3s ease-in-out infinite;
        }
        .lumi-spark {
          animation: pulse-glow 2.5s ease-in-out infinite;
        }
        .lumi-eye {
          transform-origin: center;
          animation: blink 4s infinite;
        }
      `}</style>

      <div className="lumi-float" style={{ width: '120px', height: '120px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 100 100" className="lumi-spark" style={{ width: '100%', height: '100%' }}>
          <path
            d="M50,5 C55,30 70,45 95,50 C70,55 55,70 50,95 C45,70 30,55 5,50 C30,45 45,30 50,5 Z"
            fill="url(#lumiGrad)"
          />
          <defs>
            <linearGradient id="lumiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#18D6C8" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>

          {expression === 'happy' && (
            <>
              <path d="M34,48 Q40,42 46,48" stroke="white" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <path d="M54,48 Q60,42 66,48" stroke="white" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            </>
          )}

          {expression === 'excited' && (
            <>
              <polygon points="40,38 42,43 47,43 43,46 45,51 40,48 35,51 37,46 33,43 38,43" fill="white" />
              <polygon points="60,38 62,43 67,43 63,46 65,51 60,48 55,51 57,46 53,43 58,43" fill="white" />
            </>
          )}

          {expression === 'thinking' && (
            <>
              <circle cx="40" cy="46" r="5" fill="white" />
              <circle cx="39" cy="44" r="2.5" fill="#111" />
              <circle cx="60" cy="46" r="5" fill="white" />
              <circle cx="59" cy="44" r="2.5" fill="#111" />
              <path d="M34,38 Q40,35 46,39" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M54,39 Q60,36 66,37" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </>
          )}

          {(expression === 'standard' || expression === 'greeting') && (
            <>
              <circle cx="40" cy="48" r="5.5" fill="white" className="lumi-eye" />
              <circle cx="40" cy="48" r="2.5" fill="#111" className="lumi-eye" />
              <circle cx="60" cy="48" r="5.5" fill="white" className="lumi-eye" />
              <circle cx="60" cy="48" r="2.5" fill="#111" className="lumi-eye" />
            </>
          )}

          {expression === 'happy' || expression === 'excited' || expression === 'greeting' ? (
            <path d="M44,59 Q50,66 56,59" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
          ) : expression === 'thinking' ? (
            <path d="M46,60 Q50,57 54,60" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M46,59 Q50,63 54,59" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}

          <circle cx="30" cy="54" r="4" fill="#EC4899" opacity="0.6" />
          <circle cx="70" cy="54" r="4" fill="#EC4899" opacity="0.6" />
        </svg>

        <div style={{ position: 'absolute', top: 5, left: 5, fontSize: 16 }}>✨</div>
        <div style={{ position: 'absolute', bottom: 10, right: 5, fontSize: 12 }}>✨</div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stepData, setStepData] = useState<StepData | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | string[] | number>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [animationKey, setAnimationKey] = useState(0);

  const addAccount = useAuthStore((state) => state.addAccount);

  // Fetch the first or next step config
  const fetchStep = async (currentStepId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = currentStepId ? `/onboarding/steps?currentStepId=${currentStepId}` : '/onboarding/steps';
      const res = await apiFetch(url);
      
      if (res.data) {
        setStepData(res.data);
        setAnimationKey((k) => k + 1);
        
        const step = res.data.step as StepConfig;
        if (step.kind === 'multi_select') {
          const defaults = step.options?.filter((o) => o.isDefault).map((o) => o.value) || [];
          setSelectedValue(defaults);
        } else if (step.kind === 'single_select' || step.kind === 'searchable_select') {
          const defaultOpt = step.options?.find((o) => o.isDefault);
          setSelectedValue(defaultOpt ? defaultOpt.value : '');
        } else {
          setSelectedValue('');
        }
      } else {
        await handleCompletion();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load onboarding steps.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStep();
  }, []);

  const handleOptionSelect = (val: string) => {
    if (!stepData) return;
    const { step } = stepData;

    if (step.kind === 'multi_select') {
      const currentArr = Array.isArray(selectedValue) ? (selectedValue as string[]) : [];
      if (currentArr.includes(val)) {
        const updated = currentArr.filter((item) => item !== val);
        const minSel = step.minSelections ?? 1;
        if (updated.length >= minSel) {
          setSelectedValue(updated);
        }
      } else {
        setSelectedValue([...currentArr, val]);
      }
    } else {
      setSelectedValue(val);
    }
  };

  const handleBack = () => {
    if (history.length === 0) return;
    
    const prevHistory = [...history];
    const prevItem = prevHistory.pop()!;
    setHistory(prevHistory);
    
    setStepData(prevItem.stepData);
    setSelectedValue(prevItem.selectedValue);
    setSearchQuery('');
    setAnimationKey((k) => k + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepData || submitting) return;

    const { step } = stepData;
    
    if (step.kind === 'single_select' || step.kind === 'searchable_select') {
      if (!selectedValue) {
        setError('Please select an option to continue.');
        return;
      }
    }
    if (step.kind === 'multi_select') {
      const arr = selectedValue as string[];
      const minSel = step.minSelections ?? 1;
      if (arr.length < minSel) {
        setError(`Please select at least ${minSel} subject${minSel > 1 ? 's' : ''}.`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiFetch('/onboarding/answer', {
        method: 'POST',
        body: JSON.stringify({
          stepId: step.id,
          value: selectedValue,
        }),
      });

      setHistory((prev) => [...prev, { stepData, selectedValue }]);
      await fetchStep(step.id);
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompletion = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/onboarding/complete', { method: 'POST' });

      const meRes = await apiFetch('/auth/me');
      const me = meRes.data;

      const accessToken = localStorage.getItem('learnix_access_token') || '';
      const refreshToken = localStorage.getItem('learnix_refresh_token') || '';

      addAccount({
        id: me.id,
        username: me.profile?.username || '',
        displayName: me.profile?.displayName || '',
        email: me.email,
        accessToken,
        refreshToken,
        avatarUrl: me.profile?.avatarUrl,
      });

      window.location.href = '/feed';
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding.');
      setSubmitting(false);
    }
  };

  if (loading && !stepData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: 'var(--bg)', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid var(--border)', borderTopColor: '#18D6C8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text2)', fontSize: '14px', fontWeight: 500 }}>Lumi is preparing your path...</p>
      </div>
    );
  }

  if (!stepData) return null;

  const { step, totalSteps, currentStep } = stepData;
  const progressPercent = (currentStep / totalSteps) * 100;

  // Determine Lumi's expression
  let lumiExpression: 'greeting' | 'thinking' | 'happy' | 'excited' | 'standard' = 'standard';
  if (step.kind === 'greeting') lumiExpression = 'greeting';
  else if (step.kind === 'celebration') lumiExpression = 'excited';
  else if (step.id === 'daily_goal') lumiExpression = 'happy';
  else if (step.id === 'stage' || step.id === 'curriculum' || step.id === 'level') lumiExpression = 'thinking';

  // Filter options for country select
  const filteredOptions = step.options?.filter((o) =>
    o.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.sublabel && o.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', padding: '16px', background: 'var(--bg)', position: 'relative' }}>
      {step.kind === 'celebration' && <ConfettiEffect />}

      <style>{`
        /* Progress shimming glow */
        .progress-glow {
          position: relative;
        }
        .progress-glow::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 8px;
          background: #FFF;
          border-radius: 50%;
          filter: drop-shadow(0 0 8px #18D6C8);
          box-shadow: 0 0 10px 3px #18D6C8;
        }
        /* Custom animated step switch */
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .step-container {
          animation: stepIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        /* Hover glow effects */
        .premium-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.3) !important;
        }
        .premium-card:active {
          transform: translateY(0) scale(0.98);
        }
      `}</style>

      {/* Top Navigation & Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginBottom: '20px', position: 'relative', zIndex: 20 }}>
        {history.length > 0 && step.kind !== 'celebration' ? (
          <button
            onClick={handleBack}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'white', fontSize: '18px', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            ←
          </button>
        ) : (
          <div style={{ width: '36px' }} />
        )}

        {/* Progress Bar Container */}
        <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden', position: 'relative' }}>
          <div 
            className="progress-glow"
            style={{ 
              width: `${progressPercent}%`, 
              height: '100%', 
              background: 'var(--grad)', 
              borderRadius: '99px', 
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' 
            }} 
          />
        </div>

        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text2)', width: '36px', textAlign: 'right', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {currentStep}/{totalSteps}
        </span>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '420px', width: '100%', margin: '0 auto', position: 'relative', zIndex: 20 }}>
        
        {/* Lumi Mascot & Speech Bubble */}
        <LumiMascot expression={lumiExpression} />
        
        {/* Speech Bubble */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '16px 20px',
          marginBottom: '20px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          {/* Bubble Arrow pointing to Lumi (top) */}
          <div style={{
            position: 'absolute',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '12px',
            height: '12px',
            background: '#0a0a0a', 
            borderLeft: '1px solid var(--border)',
            borderTop: '1px solid var(--border)',
          }} />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'white', lineHeight: 1.3, letterSpacing: '-0.01em' }}>{step.title}</h2>
          {step.subtitle && (
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '6px', fontWeight: 500, lineHeight: 1.4 }}>{step.subtitle}</p>
          )}
        </div>

        {error && (
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', fontSize: '13px', fontWeight: 500, marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Options Content */}
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div key={animationKey} className="step-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* STEP: Greeting */}
            {step.kind === 'greeting' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '20px 0' }}>
                <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: '14.5px', maxWidth: '320px', lineHeight: 1.6, marginBottom: '24px', fontWeight: 500 }}>
                  We will customize your learning experience based on your specific curriculum, subjects, and personal goals.
                </div>
              </div>
            )}

            {/* STEP: Stage Selector (Grid format for stage selection) */}
            {step.id === 'stage' && step.options && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                {step.options.map((opt) => {
                  const isSelected = selectedValue === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleOptionSelect(opt.value)}
                      className="premium-card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px 12px',
                        background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '2px solid #3B82F6' : '1px solid var(--border)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        gap: '8px',
                        boxShadow: isSelected ? '0 0 16px rgba(59,130,246,0.1)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '28px' }}>{opt.icon}</span>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: isSelected ? '#3B82F6' : 'white' }}>{opt.label}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* STEP: Single Select standard (e.g. curriculum, level) */}
            {step.kind === 'single_select' && step.id !== 'stage' && step.id !== 'daily_goal' && step.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {step.options.map((opt) => {
                  const isSelected = selectedValue === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleOptionSelect(opt.value)}
                      className="premium-card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 18px',
                        background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '2px solid #3B82F6' : '1px solid var(--border)',
                        borderRadius: '14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        position: 'relative',
                        boxShadow: isSelected ? '0 0 12px rgba(59,130,246,0.08)' : 'none',
                      }}
                    >
                      {opt.icon && <span style={{ fontSize: '22px' }}>{opt.icon}</span>}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '14.5px', color: isSelected ? '#3B82F6' : 'white' }}>{opt.label}</div>
                        {opt.sublabel && <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{opt.sublabel}</div>}
                      </div>
                      {isSelected && (
                        <span style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: '16px' }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* STEP: Searchable Country Selector */}
            {step.kind === 'searchable_select' && step.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Search Input */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '16px', color: 'var(--text3)' }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '14px', flex: 1 }}
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} style={{ color: 'var(--text2)', fontSize: '14px' }}>✕</button>
                  )}
                </div>

                {/* Country List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt) => {
                      const isSelected = selectedValue === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleOptionSelect(opt.value)}
                          className="premium-card"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            padding: '12px 16px',
                            background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.01)',
                            border: isSelected ? '1px solid #3B82F6' : '1px solid var(--border)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          {opt.icon && (
                            <span style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '50%', 
                              background: 'rgba(255,255,255,0.05)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '20px'
                            }}>
                              {opt.icon}
                            </span>
                          )}
                          <span style={{ fontWeight: 600, fontSize: '14px', color: isSelected ? '#3B82F6' : 'white', flex: 1 }}>{opt.label}</span>
                          {isSelected && <span style={{ color: '#3B82F6', fontWeight: 'bold' }}>✓</span>}
                        </button>
                      );
                    })
                  ) : (
                    <div style={{ padding: '24px', color: 'var(--text2)', fontSize: '13px', textAlign: 'center' }}>
                      No matching countries found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP: Multi-Select Subject Selector (Grid of cards with subject accents) */}
            {step.kind === 'multi_select' && step.options && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {step.options.map((opt) => {
                  const arr = Array.isArray(selectedValue) ? (selectedValue as string[]) : [];
                  const isSelected = arr.includes(opt.value);
                  const accentColor = getSubjectAccent(opt.value);
                  const subjectIcon = getSubjectIcon(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleOptionSelect(opt.value)}
                      className="premium-card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '16px 14px',
                        background: isSelected ? `rgba(${isSelected ? '24, 214, 200' : '255, 255, 255'}, 0.05)` : 'rgba(255,255,255,0.02)',
                        border: isSelected ? `1.5px solid ${accentColor}` : '1px solid var(--border)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        gap: '6px',
                        boxShadow: isSelected ? `0 0 12px ${accentColor}1C` : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '24px' }}>{subjectIcon}</span>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '6px',
                          border: isSelected ? 'none' : '1.5px solid var(--border)',
                          background: isSelected ? accentColor : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          color: 'black',
                          fontWeight: 900,
                        }}>
                          {isSelected && '✓'}
                        </div>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <div style={{ fontWeight: 800, fontSize: '13.5px', color: isSelected ? accentColor : 'white' }}>{opt.label}</div>
                        {opt.sublabel && <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '1px' }}>{opt.sublabel}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* STEP: Daily Goal Selector (Custom commits layout) */}
            {step.id === 'daily_goal' && step.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {step.options.map((opt) => {
                  const isSelected = selectedValue === opt.value;
                  const progressWidth = opt.value === '5' ? '20%' : opt.value === '10' ? '40%' : opt.value === '20' ? '70%' : '100%';
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleOptionSelect(opt.value)}
                      className="premium-card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        padding: '16px',
                        background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '2px solid #3B82F6' : '1px solid var(--border)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: isSelected ? '#3B82F6' : 'white' }}>{opt.sublabel}</span>
                            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{opt.label}</div>
                          </div>
                        </div>
                        {isSelected && <span style={{ color: '#3B82F6', fontWeight: 'bold' }}>✓</span>}
                      </div>
                      
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                        <div style={{ width: progressWidth, height: '100%', background: isSelected ? '#3B82F6' : 'var(--text3)', borderRadius: '2px' }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* STEP: Celebration */}
            {step.kind === 'celebration' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '20px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px', filter: 'drop-shadow(0 0 16px rgba(24, 214, 200, 0.3))' }}>🏆</div>
                <div style={{ fontWeight: 900, fontSize: '22px', color: 'white', marginBottom: '8px', letterSpacing: '-0.02em' }}>Onboarding Complete!</div>
                <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.6, maxWidth: '300px', fontWeight: 500 }}>
                  You've unlocked **+10 XP** and your first profile badge: **"First Steps"**!
                </p>
              </div>
            )}

          </div>

          {/* Footer Action Button */}
          <div style={{ marginTop: 'auto', padding: '20px 0 env(safe-area-inset-bottom)', position: 'relative', zIndex: 30 }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{
                background: step.kind === 'celebration' ? 'linear-gradient(135deg, #18D6C8 0%, #3B82F6 100%)' : 'var(--grad)',
                boxShadow: step.kind === 'celebration' 
                  ? '0 6px 24px rgba(24, 214, 200, 0.35)' 
                  : '0 6px 24px rgba(59, 130, 246, 0.3)',
                fontWeight: 800,
                fontSize: '15.5px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
              }}
            >
              {submitting ? (
                <>
                  <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  Saving...
                </>
              ) : step.kind === 'celebration' ? (
                'Start Learning'
              ) : step.kind === 'greeting' ? (
                "Let's Go!"
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
