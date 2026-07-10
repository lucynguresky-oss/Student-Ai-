'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notifApi, LearnixApiError } from '@/lib/api';
import Button from '@/components/ui/Button';

interface NotifPrefs {
  emailLearningReminders: boolean;
  emailProductUpdates: boolean;
  emailWeeklySummary: boolean;
  smsLearningReminders: boolean;
  pushLearningReminders: boolean;
  pushSocialActivity: boolean;
}

function Toggle({ id, label, sub, checked, onChange }: {
  id: string; label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
        {sub && <p className="text-xs text-[var(--text-dim)] mt-0.5">{sub}</p>}
      </div>
      <button
        id={id} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-lx-blue' : 'bg-[var(--bg-surface)] border border-[var(--border)]'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>({
    emailLearningReminders: true,
    emailProductUpdates: false,
    emailWeeklySummary: true,
    smsLearningReminders: false,
    pushLearningReminders: true,
    pushSocialActivity: true,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    notifApi.get().then((data: unknown) => {
      if (data && typeof data === 'object') setPrefs((p) => ({ ...p, ...(data as Partial<NotifPrefs>) }));
    }).catch(() => {});
  }, []);

  async function save() {
    setLoading(true); setError('');
    try {
      await notifApi.update(prefs as unknown as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      if (e instanceof LearnixApiError) setError(e.message);
      else setError('Failed to save.');
    } finally { setLoading(false); }
  }

  const set = (key: keyof NotifPrefs) => (v: boolean) => setPrefs((p) => ({ ...p, [key]: v }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text)]">Notifications</h1>
        <p className="text-sm text-[var(--text-muted)]">Choose how Lumi keeps in touch</p>
      </div>

      <div className="lx-card p-6 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} className="text-lx-blue" />
          <h2 className="font-semibold text-[var(--text)]">Email</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          <Toggle id="email-reminders" label="Learning reminders" sub="Daily nudges to keep your streak" checked={prefs.emailLearningReminders} onChange={set('emailLearningReminders')} />
          <Toggle id="email-summary" label="Weekly summary" sub="Progress recap every Monday" checked={prefs.emailWeeklySummary} onChange={set('emailWeeklySummary')} />
          <Toggle id="email-updates" label="Product updates" sub="New features and announcements" checked={prefs.emailProductUpdates} onChange={set('emailProductUpdates')} />
        </div>

        <div className="flex items-center gap-2 mt-5 mb-3">
          <span className="text-base">📱</span>
          <h2 className="font-semibold text-[var(--text)]">SMS</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          <Toggle id="sms-reminders" label="Learning reminders" sub="Texts to your phone (standard rates apply)" checked={prefs.smsLearningReminders} onChange={set('smsLearningReminders')} />
        </div>

        <div className="flex items-center gap-2 mt-5 mb-3">
          <span className="text-base">🔔</span>
          <h2 className="font-semibold text-[var(--text)]">Push</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          <Toggle id="push-reminders" label="Learning reminders" checked={prefs.pushLearningReminders} onChange={set('pushLearningReminders')} />
          <Toggle id="push-social" label="Social activity" sub="Likes, comments, new followers" checked={prefs.pushSocialActivity} onChange={set('pushSocialActivity')} />
        </div>

        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        {saved && <p className="text-xs text-lx-teal mt-2">✓ Preferences saved</p>}

        <Button id="save-notifications-btn" loading={loading} onClick={save} className="self-start mt-4">
          Save preferences
        </Button>
      </div>
    </div>
  );
}
