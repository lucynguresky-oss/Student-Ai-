'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useStore, type Conversation, type Message } from '@/store/useStore';

/* ─────────────────────────────────────────────────────────────────────────────
   MESSAGES PAGE
   - Conversation list + active chat view
   - AI bot FAB is pushed LEFT of the input — never overlaps it
   - Real send/receive via global store
───────────────────────────────────────────────────────────────────────────── */

function timeFmt(ts: number) {
  const d = Date.now() - ts;
  if (d < 60_000) return 'now';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`;
  return `${Math.floor(d / 86_400_000)}d`;
}

function MessageBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
      {!isMe && (
        <img src="https://api.dicebear.com/8.x/avataaars/svg?seed=omondi" alt="" style={{ width: 28, height: 28, borderRadius: '50%', marginRight: 8, alignSelf: 'flex-end', flexShrink: 0 }} />
      )}
      <div style={{
        maxWidth: '72%',
        padding: '10px 14px',
        borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
        background: isMe ? 'linear-gradient(135deg,#3B82F6,#18D6C8)' : 'var(--surface)',
        color: isMe ? 'white' : 'var(--text)',
        fontSize: 14.5,
        lineHeight: 1.4,
        border: isMe ? 'none' : '1px solid var(--border)',
      }}>
        {msg.text}
        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6, textAlign: isMe ? 'right' : 'left' }}>
          {timeFmt(msg.timestamp)} {isMe && (msg.read ? '✓✓' : '✓')}
        </div>
      </div>
    </div>
  );
}

function ConvItem({ conv, onClick, active }: { conv: Conversation; onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', width: '100%', textAlign: 'left',
        background: active ? 'rgba(59,130,246,0.08)' : 'none', border: 'none', cursor: 'pointer',
        borderBottom: '1px solid var(--border)', borderLeft: active ? '3px solid #3B82F6' : '3px solid transparent',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${conv.participantSeed}`} alt="" style={{ width: 48, height: 48, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, background: '#22C55E', borderRadius: '50%', border: '2px solid var(--bg)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{conv.participantName}</span>
          <span style={{ fontSize: 11, color: 'var(--text2)' }}>{timeFmt(conv.lastTimestamp)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{conv.lastMessage}</span>
          {conv.unreadCount > 0 && (
            <span style={{ background: '#3B82F6', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{conv.unreadCount}</span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function MessagesPage() {
  const { conversations, messages, sendMessage, markConversationRead, currentUser } = useStore();
  const [activeConvId, setActiveConvId] = useState<string | null>(conversations[0]?.id ?? null);
  const [inputText, setInputText] = useState('');
  const [showCallUI, setShowCallUI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const myId = currentUser?.id ?? '';
  const activeConv = conversations.find(c => c.id === activeConvId);
  const activeMessages = activeConvId ? (messages[activeConvId] ?? []) : [];

  useEffect(() => {
    if (activeConvId) markConversationRead(activeConvId);
  }, [activeConvId, markConversationRead]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !inputText.trim()) return;
    sendMessage(activeConvId, inputText.trim());
    setInputText('');
    inputRef.current?.focus();
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <Link href="/feed" style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Messages</span>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: 20 }}>✏️</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Conversation List */}
        <div style={{ width: activeConvId ? 0 : '100%', flex: activeConvId ? '0 0 0' : '0 0 100%', overflowY: 'auto', borderRight: '1px solid var(--border)', transition: 'all 0.2s' }}>
          {/* Study Hubs Link */}
          <Link href="/study-hubs" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(59,130,246,0.1)', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'white' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤝</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Study Hubs</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Join public group chats</div>
            </div>
            <div style={{ marginLeft: 'auto', color: '#3B82F6' }}>→</div>
          </Link>

          {/* Search bar */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', borderRadius: 12, padding: '8px 12px', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text2)', fontSize: 16 }}>🔍</span>
              <input placeholder="Search messages..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14 }} />
            </div>
          </div>
          {conversations.map(conv => (
            <ConvItem key={conv.id} conv={conv} active={conv.id === activeConvId}
              onClick={() => setActiveConvId(conv.id)} />
          ))}
        </div>

        {/* Chat Panel */}
        {activeConvId && activeConv && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Chat header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              <button onClick={() => setActiveConvId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: 22, padding: 0, display: 'flex', alignItems: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${activeConv.participantSeed}`} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{activeConv.participantName}</div>
                <div style={{ fontSize: 11, color: '#22C55E' }}>● Active now</div>
              </div>
              {/* Call buttons */}
              <button onClick={() => setShowCallUI(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: 20, padding: 4 }}>📞</button>
              <button onClick={() => setShowCallUI(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: 20, padding: 4 }}>📹</button>
            </div>

            {/* Messages scroll area */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
              {activeMessages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} isMe={msg.senderId === currentUser?.id} />
              ))}
            </div>

            {/* ──────────────────────────────────────────────────────────────
                INPUT AREA — AI bot FAB is positioned LEFT of the text field
                so it NEVER overlaps the typing input (fixes the reported bug)
            ─────────────────────────────────────────────────────────────── */}
            <form onSubmit={handleSend} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
              /* Bottom nav padding so it clears the nav bar */
              paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
            }}>
              {/* Camera */}
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 22, padding: 4, flexShrink: 0 }}>📷</button>

              {/* Text input */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 22, border: '1px solid var(--border)', padding: '8px 14px', gap: 8 }}>
                <input
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Message..."
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14.5 }}
                />
                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0 }}>😊</button>
              </div>

              {/* AI Tutor button (LEFT side inline, NOT floating-right to avoid overlap) */}
              <Link href="/ai-tutor" style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0, textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
              }}>🤖</Link>

              {/* Send / Mic */}
              {inputText.trim() ? (
                <button type="submit" style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#18D6C8)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>↑</button>
              ) : (
                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 22, padding: 4, flexShrink: 0 }}>🎤</button>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Voice/Video Call UI overlay */}
      {showCallUI && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <img src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${activeConv?.participantSeed}`} alt="" style={{ width: 100, height: 100, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)' }} />
          <div style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>{activeConv?.participantName}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Calling…</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
            <button onClick={() => setShowCallUI(false)} style={{ width: 64, height: 64, borderRadius: '50%', background: '#EF4444', border: 'none', cursor: 'pointer', fontSize: 28 }}>📵</button>
            <button style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 28 }}>🔇</button>
            <button style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 28 }}>🔊</button>
          </div>
        </div>
      )}
    </div>
  );
}
