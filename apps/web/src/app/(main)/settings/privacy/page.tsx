'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Users, MessageCircle } from 'lucide-react';
import { privacyApi, LearnixApiError } from '@/lib/api';
import Button from '@/components/ui/Button';

interface PrivacySettings {
  profileVisibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
  whoCanMessage: 'EVERYONE' | 'FOLLOWERS' | 'NOBODY';
  whoCanComment: 'EVERYONE' | 'FOLLOWERS' | 'NOBODY';
}

function RadioGroup({ label, name, options, value, onChange }: {
  label: string; name: string;
  options: Array<{ value: string; label: string }>;
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map((o) => (
          <button key={o.value} id={`${name}-${o.value}`} type="button"
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
              value === o.value
                ? 'border-lx-blue bg-lx-blue/10 text-lx-blue font-medium'
                : 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--bg-surface)] hover:border-[var(--text-dim)]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'PUBLIC',
    whoCanMessage: 'EVERYONE',
    whoCanComment: 'EVERYONE',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    privacyApi.get().then((data: unknown) => {
      if (data && typeof data === 'object') setSettings(data as PrivacySettings);
    }).catch(() => {});
  }, []);

  async function save() {
    setLoading(true); setError('');
    try {
      await privacyApi.update(settings as unknown as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      if (e instanceof LearnixApiError) setError(e.message);
      else setError('Failed to save. Please try again.');
    } finally { setLoading(false); }
  }

  const visibilityOpts = [
    { value: 'PUBLIC', label: '🌍 Public' },
    { value: 'FOLLOWERS', label: '👥 Followers' },
    { value: 'PRIVATE', label: '🔒 Private' },
  ];
  const whoOpts = [
    { value: 'EVERYONE', label: 'Everyone' },
    { value: 'FOLLOWERS', label: 'Followers' },
    { value: 'NOBODY', label: 'Nobody' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text)]">Privacy</h1>
        <p className="text-sm text-[var(--text-muted)]">Control who can see and interact with you</p>
      </div>

      <div className="lx-card p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2 mb-2">
          <Eye size={16} className="text-lx-blue" />
          <h2 className="font-semibold text-[var(--text)]">Visibility</h2>
        </div>

        <RadioGroup label="Profile visibility" name="visibility" options={visibilityOpts}
          value={settings.profileVisibility}
          onChange={(v) => setSettings((s) => ({ ...s, profileVisibility: v as PrivacySettings['profileVisibility'] }))} />

        <div className="h-px bg-[var(--border)]" />

        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-lx-blue" />
          <h2 className="font-semibold text-[var(--text)]">Interactions</h2>
        </div>

        <RadioGroup label="Who can message me" name="message" options={whoOpts}
          value={settings.whoCanMessage}
          onChange={(v) => setSettings((s) => ({ ...s, whoCanMessage: v as PrivacySettings['whoCanMessage'] }))} />

        <RadioGroup label="Who can comment on my posts" name="comment" options={whoOpts}
          value={settings.whoCanComment}
          onChange={(v) => setSettings((s) => ({ ...s, whoCanComment: v as PrivacySettings['whoCanComment'] }))} />

        {error && <p className="text-xs text-red-400">{error}</p>}
        {saved && <p className="text-xs text-lx-teal">✓ Privacy settings saved</p>}

        <Button id="save-privacy-btn" loading={loading} onClick={save} className="self-start">
          Save settings
        </Button>
      </div>
    </div>
  );
}
