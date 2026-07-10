'use client';

import { useAuth } from '@/lib/auth';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import { Settings, Flame, Zap, BookOpen, Edit } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const displayName = user?.profile?.displayName ?? user?.username ?? 'Learner';
  const initials = getInitials(displayName);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full lx-gradient-bg flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
            {user?.profile?.avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={user.profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              : initials}
          </div>
          <div>
            <h1 className="text-xl font-black text-[var(--text)]">{displayName}</h1>
            <p className="text-sm text-[var(--text-muted)]">@{user?.username ?? 'guest'}</p>
          </div>
        </div>
        <Link href="/settings/profile" id="edit-profile-btn"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)] transition-all">
          <Edit size={13} /> Edit
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Flame size={16} className="text-orange-400" />, label: 'Streak', value: '0' },
          { icon: <Zap size={16} className="text-lx-blue" />, label: 'XP', value: '0' },
          { icon: <BookOpen size={16} className="text-lx-purple" />, label: 'Courses', value: '0' },
        ].map((s) => (
          <div key={s.label} className="lx-card p-3 flex flex-col items-center gap-1 text-center">
            {s.icon}
            <span className="text-lg font-bold text-[var(--text)]">{s.value}</span>
            <span className="text-[10px] text-[var(--text-dim)]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-col gap-2">
        {[
          { href: '/settings/profile', label: 'Edit profile', icon: Edit },
          { href: '/settings/security', label: 'Security settings', icon: Settings },
          { href: '/settings/privacy', label: 'Privacy settings', icon: Settings },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} id={`profile-action-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className="lx-card p-4 flex items-center gap-3 hover:bg-[var(--bg-surface)] transition-colors">
            <Icon size={16} className="text-lx-blue" />
            <span className="text-sm font-medium text-[var(--text)]">{label}</span>
          </Link>
        ))}
      </div>

      {/* View public profile */}
      {user?.username && (
        <Link href={`/u/${user.username}`} id="view-public-profile-link"
          className="text-sm text-center text-lx-blue hover:text-lx-purple transition-colors">
          View public profile →
        </Link>
      )}
    </div>
  );
}
