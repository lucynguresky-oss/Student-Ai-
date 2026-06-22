'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

const MODES = [
  { key: 'explain', label: 'Explain', emoji: '💡' },
  { key: 'quiz', label: 'Quiz Me', emoji: '🎯' },
  { key: 'paper', label: 'Past Paper', emoji: '📄' },
  { key: 'planner', label: 'Study Plan', emoji: '📅' },
];

const SUGGESTED = [
  'Explain photosynthesis in simple terms',
  'What is the difference between mitosis and meiosis?',
  'Help me solve x² + 5x + 6 = 0',
  "Summarise Newton's three laws of motion",
  'What topics appear most in KCSE Biology?',
  'Create a 2-week KCSE revision plan for me',
];

interface Source { label: string; type: 'book' | 'paper'; }
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  loading?: boolean;
}

// reads the SSE body and yields {type:'meta'|'delta'|'done'|'error', ...}
async function* readSSE(res: Response) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let i;
    while ((i = buffer.indexOf('\n\n')) >= 0) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 2);
      if (line.startsWith('data:')) {
        try { yield JSON.parse(line.slice(5).trim()); } catch {}
      }
    }
  }
}

function SourcePill({ source }: { source: Source }) {
  const isBook = source.type === 'book';
  return (
    <Link
      href={isBook ? '/library' : '/papers'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
        background: isBook ? 'rgba(59,130,246,0.12)' : 'rgba(124,58,237,0.12)',
        border: `1px solid ${isBook ? 'rgba(59,130,246,0.3)' : 'rgba(124,58,237,0.3)'}`,
        color: isBook ? '#60a5fa' : '#a78bfa',
        textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.2s',
      }}
    >
      {isBook ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l-8 4v12l8 4 8-4V6z"/></svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
      )}
      {source.label}
    </Link>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';

  if (msg.loading) {
    return (
      <div style={{ display: 'flex', gap: '12px', padding: '0 16px', marginBottom: '24px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🤖</div>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '14px 16px', background: 'var(--surface)', borderRadius: '18px 18px 18px 4px' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text2)', animation: `bounce 1.4s ${i * 0.2}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px', marginBottom: '24px' }}>
        <div style={{
          maxWidth: '75%', padding: '12px 16px',
          background: 'var(--grad)',
          borderRadius: '20px 20px 4px 20px',
          fontSize: '15px', lineHeight: 1.5, color: 'white',
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  // Parse bold text and newlines
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => (
      <p key={i} style={{ marginBottom: line === '' ? '8px' : '2px', lineHeight: 1.65 }}>
        {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j} style={{ color: 'white' }}>{part}</strong> : part
        )}
      </p>
    ));
  };

  return (
    <div style={{ display: 'flex', gap: '12px', padding: '0 16px', marginBottom: '24px', maxWidth: '100%' }}>
      {/* AI Avatar */}
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, alignSelf: 'flex-end' }}>🤖</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '15px', color: 'var(--text)', lineHeight: 1.65 }}>
          {renderContent(msg.content)}
        </div>

        {/* Source pills */}
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
            {msg.sources.map((s, i) => <SourcePill key={i} source={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}

const FREE_LIMIT = 15;

export default function AiTutorPage() {
  const [mode, setMode] = useState('explain');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [isPremium] = useState(false); // TODO: replace with real auth
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conversationId = useRef<string | null>(null);

  // In a real app we'd get a token from auth context
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const limitHit = !isPremium && msgCount >= FREE_LIMIT;
  const msgsLeft = Math.max(0, FREE_LIMIT - msgCount);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const send = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading || limitHit) return;
    setInput('');
    if (!isPremium) setMsgCount(c => c + 1);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    // Optimistic loading message
    const loadingMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', loading: true };

    setMessages(m => [...m, userMsg, loadingMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ai/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: content, conversationId: conversationId.current, subject: mode }),
      });

      if (!res.ok) throw new Error('API error');
      
      let isFirstDelta = true;
      for await (const evt of readSSE(res)) {
        if (evt.type === 'meta') {
          conversationId.current = evt.conversationId;
        } else if (evt.type === 'delta') {
          setMessages(m => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last) {
              if (isFirstDelta) {
                last.loading = false;
                isFirstDelta = false;
              }
              last.content += evt.text;
            }
            return copy;
          });
        } else if (evt.type === 'error') {
          setMessages(m => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last) {
              last.loading = false;
              last.content = `⚠️ ${evt.message}`;
            }
            return copy;
          });
        }
      }
    } catch (e) {
      setMessages(m => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last) {
          last.loading = false;
          last.content = `⚠️ Failed to connect to AI Tutor.`;
        }
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  const currentMode = MODES.find(m => m.key === mode)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#000', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* ChatGPT-style logo */}
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Learnix AI
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '2px 7px', borderRadius: '4px' }}>GPT-4o</span>
            </div>
            <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              KCSE Tutor · Online
            </div>
          </div>
        </div>

        {/* Mode selector */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowModeMenu(m => !m)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', background: 'var(--surface)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--text2)', border: '1px solid var(--border)' }}>
            <span>{currentMode.emoji}</span>
            {currentMode.label}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {showModeMenu && (
            <div style={{ position: 'absolute', right: 0, top: '42px', background: '#111', border: '1px solid var(--border)', borderRadius: '12px', padding: '6px', zIndex: 50, minWidth: '180px', boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }}>
              {MODES.map(m => (
                <button key={m.key} onClick={() => { setMode(m.key); setShowModeMenu(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: mode === m.key ? 'rgba(59,130,246,0.15)' : 'transparent', borderRadius: '8px', color: mode === m.key ? 'white' : 'var(--text2)', fontSize: '14px', fontWeight: 600, textAlign: 'left' }}>
                  <span>{m.emoji}</span> {m.label}
                  {mode === m.key && <span style={{ marginLeft: 'auto', color: 'var(--blue)' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: '24px' }}>
        {messages.length === 0 ? (
          <div style={{ padding: '0 16px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px', boxShadow: '0 0 40px rgba(59,130,246,0.3)' }}>🤖</div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>Learnix AI Tutor</h2>
              <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Powered by GPT-4o · Grounded in your KCSE curriculum</p>
            </div>

            {/* Quick access cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
              <Link href="/library" style={{ padding: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '6px', textDecoration: 'none' }}>
                <div style={{ fontSize: '24px' }}>📚</div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'white' }}>Library</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Browse textbooks</div>
              </Link>
              <Link href="/papers" style={{ padding: '14px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '6px', textDecoration: 'none' }}>
                <div style={{ fontSize: '24px' }}>📄</div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'white' }}>Past Papers</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>KCSE 2015–2024</div>
              </Link>
            </div>

            {/* Suggestions */}
            <p style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Try asking...</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {SUGGESTED.map(s => (
                <button key={s} onClick={() => send(s)} style={{ padding: '11px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text2)', fontSize: '14px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s' }}>
                  {s}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.4 }}><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '20px' }}>
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input — ChatGPT style */}
      <div style={{ padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '16px', padding: '10px 12px', transition: 'border-color 0.2s' }}>
            {/* Attachment/+ button like ChatGPT */}
            <button style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface2)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text2)', marginBottom: '2px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`Ask about ${currentMode.label.toLowerCase()}...`}
              rows={1}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: '15px', resize: 'none', lineHeight: 1.5, maxHeight: '120px', paddingTop: '4px', fontFamily: 'inherit' }}
            />

            {/* Voice button */}
            <button style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface2)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text2)', marginBottom: '2px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>

            {/* Send button */}
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: input.trim() && !loading ? 'var(--grad)' : 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s', marginBottom: '2px',
                boxShadow: input.trim() && !loading ? '0 4px 16px rgba(59,130,246,0.4)' : 'none',
              }}
            >
              {loading ? (
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              )}
            </button>
          </div>

          {/* Usage bar */}
          {!isPremium && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>AI may make mistakes. Verify with your teacher.</span>
                <Link href="/upgrade" style={{ fontSize: '11px', color: msgsLeft <= 3 ? '#EF4444' : 'var(--text3)', fontWeight: 700, textDecoration: 'none', background: 'var(--surface)', padding: '2px 8px', borderRadius: '4px' }}>
                  {msgsLeft}/{FREE_LIMIT} msgs left
                </Link>
              </div>
              <div style={{ height: '3px', background: 'var(--surface)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(msgsLeft / FREE_LIMIT) * 100}%`, background: msgsLeft <= 3 ? '#EF4444' : 'var(--grad)', borderRadius: '999px', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}

          {/* Upgrade wall — shows when limit hit */}
          {limitHit && (
            <div style={{ marginTop: '12px', padding: '16px', background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(59,130,246,0.1))', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>⭐</div>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Daily limit reached</div>
              <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '12px' }}>Upgrade to Plus for unlimited AI messages</p>
              <Link href="/upgrade" style={{ display: 'inline-block', padding: '9px 22px', background: 'var(--grad)', color: 'white', borderRadius: '10px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>Upgrade to Plus →</Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
