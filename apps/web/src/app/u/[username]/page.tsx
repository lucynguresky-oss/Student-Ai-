import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Flame, Zap, Lock, Users } from 'lucide-react';
import { formatCompact, getInitials } from '@/lib/utils';

interface Props { params: Promise<{ username: string }>; }

async function getProfile(username: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/users/${username}`,
      { next: { revalidate: 60 } },
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: 'User not found' };
  return {
    title: `${profile.displayName ?? username} (@${username})`,
    description: profile.bio ?? `${username}'s profile on Learnix`,
    openGraph: {
      type: 'profile',
      title: `${profile.displayName ?? username} on Learnix`,
      description: profile.bio,
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const data = await getProfile(username);

  if (!data) notFound();

  const { profile, isMinor, streak, xp } = data as {
    profile: { displayName?: string; bio?: string; avatarUrl?: string; visibility: string };
    isMinor?: boolean;
    streak?: { current: number };
    xp?: number;
  };

  // Private account or minor lock
  if (profile.visibility === 'PRIVATE') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center">
          <Lock size={24} className="text-[var(--text-dim)]" />
        </div>
        <h1 className="text-xl font-bold text-[var(--text)]">This account is private</h1>
        <p className="text-sm text-[var(--text-muted)]">Follow @{username} to see their profile</p>
      </div>
    );
  }

  if (isMinor) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-2xl">🔒</div>
        <h1 className="text-xl font-bold text-[var(--text)]">Content restricted</h1>
        <p className="text-sm text-[var(--text-muted)]">This profile is protected by Learnix minor safety settings.</p>
      </div>
    );
  }

  const initials = getInitials(profile.displayName ?? username);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Hero */}
      <div className="flex items-start gap-5">
        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full lx-gradient-bg flex items-center justify-center text-3xl font-bold text-white flex-shrink-0 overflow-hidden">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt={`${username} avatar`} className="w-full h-full object-cover" />
          ) : initials}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h1 className="text-2xl font-black text-[var(--text)]">{profile.displayName ?? username}</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">@{username}</p>
          {profile.bio && <p className="text-sm text-[var(--text)] mt-2 leading-relaxed">{profile.bio}</p>}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <Flame size={14} className="text-orange-400" />
              <span className="text-sm font-semibold text-[var(--text)]">{streak?.current ?? 0}</span>
              <span className="text-xs text-[var(--text-dim)]">streak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-lx-blue" />
              <span className="text-sm font-semibold text-[var(--text)]">{formatCompact(xp ?? 0)}</span>
              <span className="text-xs text-[var(--text-dim)]">XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Follow CTA */}
      <div className="flex gap-3">
        <button id="follow-btn" className="lx-btn lx-btn-primary flex-1 text-sm">Follow</button>
        <button id="message-btn" className="lx-btn lx-btn-ghost px-4 text-sm">Message</button>
      </div>

      {/* Activity placeholder */}
      <div className="lx-card p-6 flex flex-col items-center gap-3 text-center">
        <span className="text-3xl">📚</span>
        <p className="font-semibold text-[var(--text)]">Learning activity</p>
        <p className="text-sm text-[var(--text-muted)]">{profile.displayName ?? username}&apos;s courses and achievements will appear here.</p>
      </div>
    </div>
  );
}
