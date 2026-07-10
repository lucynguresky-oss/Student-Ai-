'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, BookOpen, TrendingUp, Users, Star, ChevronRight } from 'lucide-react';
import LumiMascot from '@/components/LumiMascot';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { tracksApi } from '@/lib/api';
import { formatCompact } from '@/lib/utils';

export default function HomePage() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const displayName = user?.profile?.displayName ?? user?.username ?? 'Learner';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    tracksApi.list().then((data: unknown) => {
      if (Array.isArray(data)) setTracks((data as Array<{ id: string; name: string; description?: string }>).slice(0, 4));
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-8">
      {/* ── Hero greeting ───────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">{greeting},</p>
          <h1 className="text-2xl font-black text-[var(--text)]">{displayName} 👋</h1>
        </div>
        <LumiMascot size={64} mood="happy" />
      </motion.div>

      {/* ── Stats strip ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3">
        {[
          { icon: <Flame size={18} className="text-orange-400" />, label: 'Streak', value: '0 days', id: 'streak-stat' },
          { icon: <Zap size={18} className="text-lx-blue" />, label: 'XP Today', value: '0 XP', id: 'xp-stat' },
          { icon: <Star size={18} className="text-lx-purple" />, label: 'Level', value: '1', id: 'level-stat' },
        ].map((s) => (
          <div key={s.id} id={s.id} className="lx-card p-3 flex flex-col items-center gap-1 text-center">
            {s.icon}
            <span className="text-base font-bold text-[var(--text)]">{s.value}</span>
            <span className="text-[10px] text-[var(--text-dim)]">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Continue learning ────────────────────────────── */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Continue Learning</h2>
        <Link href="/learn" id="continue-learning-card" className="lx-card lx-gradient-border p-5 flex items-center gap-4 hover:bg-[var(--bg-surface)] transition-colors group">
          <div className="w-12 h-12 rounded-xl lx-gradient-bg flex items-center justify-center flex-shrink-0">
            <BookOpen size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text)]">Your learning path</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Ready to build a streak?</p>
            <div className="mt-2 lx-progress">
              <div className="lx-progress-fill" style={{ width: '0%' }} />
            </div>
          </div>
          <ChevronRight size={18} className="text-[var(--text-dim)] group-hover:text-lx-blue transition-colors flex-shrink-0" />
        </Link>
      </motion.section>

      {/* ── Explore tracks ───────────────────────────────── */}
      {tracks.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Explore Tracks</h2>
            <Link href="/learn" className="text-xs text-lx-blue hover:text-lx-purple transition-colors">See all</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tracks.map((t, i) => (
              <Link key={t.id} href={`/learn?track=${t.id}`} id={`track-${t.id}`}
                className="lx-card p-4 hover:bg-[var(--bg-surface)] transition-colors group">
                <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-lg ${
                  ['bg-lx-teal/10', 'bg-lx-blue/10', 'bg-lx-purple/10', 'bg-orange-500/10'][i % 4]
                }`}>
                  {['📖', '🔬', '🌍', '💻'][i % 4]}
                </div>
                <p className="font-semibold text-sm text-[var(--text)] group-hover:text-lx-blue transition-colors">{t.name}</p>
                {t.description && <p className="text-xs text-[var(--text-dim)] mt-1 line-clamp-2">{t.description}</p>}
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Feed placeholder ─────────────────────────────── */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Community</h2>
        <div className="flex flex-col gap-3">
          {[
            { name: 'Amira K.', action: 'completed Spanish Level 1', time: '2 min ago', emoji: '🇪🇸', xp: '+50 XP' },
            { name: 'Tariq M.', action: 'hit a 7-day streak!', time: '15 min ago', emoji: '🔥', xp: '+100 XP' },
            { name: 'Sophie L.', action: 'earned the Fast Learner badge', time: '1 hr ago', emoji: '⭐', xp: '+25 XP' },
          ].map((post, i) => (
            <div key={i} className="lx-card p-4 flex items-center gap-3 animate-fade-in">
              <div className="w-10 h-10 rounded-full lx-gradient-bg flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {post.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text)]">
                  <span className="font-semibold">{post.name}</span>{' '}
                  <span className="text-[var(--text-muted)]">{post.action}</span>{' '}
                  {post.emoji}
                </p>
                <p className="text-[10px] text-[var(--text-dim)] mt-0.5">{post.time}</p>
              </div>
              <span className="lx-badge lx-badge-teal text-[10px]">{post.xp}</span>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
