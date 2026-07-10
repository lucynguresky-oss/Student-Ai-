'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Download, PowerOff, Trash2 } from 'lucide-react';
import { lifecycleApi, LearnixApiError } from '@/lib/api';
import Button from '@/components/ui/Button';

function DangerZoneItem({ id, icon, title, description, buttonLabel, variant, onClick, loading }: {
  id: string; icon: React.ReactNode; title: string; description: string;
  buttonLabel: string; variant: 'ghost' | 'danger'; onClick: () => void; loading?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-[var(--text-muted)]">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
          <p className="text-xs text-[var(--text-dim)] mt-0.5">{description}</p>
        </div>
      </div>
      <Button id={id} variant={variant} size="sm" onClick={onClick} loading={loading} className="flex-shrink-0">
        {buttonLabel}
      </Button>
    </div>
  );
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  async function doAction(key: string, action: () => Promise<unknown>, successMsg: string) {
    setLoading(key); setError(''); setMessage('');
    try {
      await action();
      setMessage(successMsg);
    } catch (e) {
      if (e instanceof LearnixApiError) setError(e.message);
      else setError('Something went wrong. Please try again.');
    } finally { setLoading(null); }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text)]">Account</h1>
        <p className="text-sm text-[var(--text-muted)]">Manage your account lifecycle</p>
      </div>

      {/* Data export */}
      <div className="lx-card p-6">
        <h2 className="font-semibold text-[var(--text)] mb-1">Your Data</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">Download a copy of everything Learnix knows about you.</p>
        <Button id="export-data-btn" variant="outline" size="sm"
          icon={<Download size={14} />}
          loading={loading === 'export'}
          onClick={() => doAction('export', lifecycleApi.requestExport, 'Export requested — we\'ll email you a download link within 24 hours.')}>
          Request data export
        </Button>
      </div>

      {/* Danger zone */}
      <div className="lx-card p-6 border-red-500/20">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-red-400" />
          <h2 className="font-semibold text-red-400">Danger Zone</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          <DangerZoneItem
            id="deactivate-btn"
            icon={<PowerOff size={16} />}
            title="Deactivate account"
            description="Your profile is hidden but data is preserved. You can reactivate by logging in."
            buttonLabel="Deactivate"
            variant="ghost"
            loading={loading === 'deactivate'}
            onClick={() => doAction('deactivate', lifecycleApi.deactivate, 'Account deactivated. Log back in any time to reactivate.')}
          />
          {!deleteConfirm ? (
            <DangerZoneItem
              id="delete-account-btn"
              icon={<Trash2 size={16} />}
              title="Delete account"
              description="Permanently deletes your account after a 30-day grace period. This cannot be undone."
              buttonLabel="Delete account"
              variant="danger"
              onClick={() => setDeleteConfirm(true)}
            />
          ) : (
            <div className="py-4 flex flex-col gap-3">
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                <p className="text-sm font-semibold text-red-400 mb-1">⚠️ Are you sure?</p>
                <p className="text-xs text-red-300">Your account and all data will be scheduled for permanent deletion in 30 days. You can cancel this within the grace period.</p>
              </div>
              <div className="flex gap-2">
                <Button id="confirm-delete-btn" variant="danger" size="sm"
                  loading={loading === 'delete'}
                  onClick={() => doAction('delete', lifecycleApi.requestDelete, 'Account deletion scheduled. You have 30 days to cancel.')}>
                  Yes, delete my account
                </Button>
                <Button id="cancel-delete-btn" variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {message && <div className="rounded-xl bg-lx-teal/10 border border-lx-teal/20 px-4 py-3 text-sm text-lx-teal">{message}</div>}
      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>}
    </div>
  );
}
