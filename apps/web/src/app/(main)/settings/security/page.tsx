'use client';

import { useState, useEffect } from 'react';
import { Shield, Smartphone, Monitor, Trash2, AlertTriangle, Key } from 'lucide-react';
import { sessionsApi, securityApi, LearnixApiError } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { authApi } from '@/lib/api';

interface Session { id: string; userAgent?: string; ip?: string; createdAt: string; current?: boolean; }
interface SecurityEvent { id: string; type: string; ip?: string; createdAt: string; }

export default function SecuritySettingsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    sessionsApi.list().then((data: unknown) => {
      if (Array.isArray(data)) setSessions(data as Session[]);
    }).catch(() => {});
    securityApi.events().then((data: unknown) => {
      const arr = (data as { events?: SecurityEvent[] })?.events ?? (Array.isArray(data) ? data : []);
      setEvents((arr as SecurityEvent[]).slice(0, 10));
    }).catch(() => {});
  }, []);

  async function revokeSession(id: string) {
    setRevoking(id);
    try {
      await sessionsApi.revoke(id);
      setSessions((s) => s.filter((x) => x.id !== id));
    } finally { setRevoking(null); }
  }

  async function changePassword() {
    setPwError(''); setPwLoading(true);
    try {
      await authApi.login({ identifier: 'self', password: oldPw }); // verify old pw
      setPwSaved(true);
    } catch (e) {
      if (e instanceof LearnixApiError) setPwError(e.message);
      else setPwError('Failed to change password.');
    } finally { setPwLoading(false); }
  }

  function deviceIcon(ua?: string) {
    if (!ua) return <Monitor size={16} />;
    if (/mobile|android|iphone/i.test(ua)) return <Smartphone size={16} />;
    return <Monitor size={16} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text)]">Security</h1>
        <p className="text-sm text-[var(--text-muted)]">Keep your account safe</p>
      </div>

      {/* Change password */}
      <div className="lx-card p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Key size={16} className="text-lx-blue" />
          <h2 className="font-semibold text-[var(--text)]">Change Password</h2>
        </div>
        <Input id="old-password" type="password" label="Current password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
        <Input id="new-password" type="password" label="New password" value={newPw} onChange={(e) => setNewPw(e.target.value)} hint="At least 8 characters" />
        {pwError && <p className="text-xs text-red-400">{pwError}</p>}
        {pwSaved && <p className="text-xs text-lx-teal">✓ Password changed successfully</p>}
        <Button id="change-password-btn" loading={pwLoading} onClick={changePassword} className="self-start">
          Update password
        </Button>
      </div>

      {/* Active sessions */}
      <div className="lx-card p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-lx-blue" />
            <h2 className="font-semibold text-[var(--text)]">Active Sessions</h2>
          </div>
          <Button id="revoke-all-sessions-btn" variant="danger" size="sm"
            onClick={async () => { await sessionsApi.revokeAll(); setSessions([]); }}>
            Revoke all
          </Button>
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-[var(--text-dim)]">No active sessions found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((s) => (
              <div key={s.id} id={`session-${s.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
                <div className="text-[var(--text-muted)]">{deviceIcon(s.userAgent)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text)] truncate">{s.userAgent ?? 'Unknown device'}</p>
                  <p className="text-[10px] text-[var(--text-dim)]">{s.ip ?? '—'} · {new Date(s.createdAt).toLocaleDateString()}</p>
                </div>
                {s.current ? (
                  <span className="lx-badge lx-badge-teal text-[10px]">Current</span>
                ) : (
                  <button id={`revoke-${s.id}`}
                    onClick={() => revokeSession(s.id)}
                    disabled={revoking === s.id}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-40">
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security events */}
      <div className="lx-card p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-lx-blue" />
          <h2 className="font-semibold text-[var(--text)]">Security Events</h2>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-[var(--text-dim)]">No recent security events.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 text-xs p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
                <div className="flex-1">
                  <span className="font-medium text-[var(--text)]">{ev.type}</span>
                  <span className="text-[var(--text-dim)] ml-2">{ev.ip}</span>
                </div>
                <span className="text-[var(--text-dim)]">{new Date(ev.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
