'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, Lock, CheckCircle, PlayCircle, ChevronRight, Trophy } from 'lucide-react';
import LumiMascot from '@/components/LumiMascot';
import Button from '@/components/ui/Button';
import { tracksApi } from '@/lib/api';

interface Track { id: string; name: string; description?: string; lessonCount?: number; }
interface Lesson { id: string; title: string; durationMins?: number; completed?: boolean; locked?: boolean; }

const MOCK_LESSONS: Lesson[] = [
  { id: 'l1', title: 'Introduction', durationMins: 5, completed: false, locked: false },
  { id: 'l2', title: 'Core Concepts', durationMins: 8, completed: false, locked: true },
  { id: 'l3', title: 'Practice Exercises', durationMins: 10, completed: false, locked: true },
  { id: 'l4', title: 'Quiz & Review', durationMins: 7, completed: false, locked: true },
];

export default function LearnPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [dailyGoalMins] = useState(10);
  const [doneMins] = useState(0);
  const progress = Math.min(100, (doneMins / dailyGoalMins) * 100);

  useEffect(() => {
    tracksApi.list().then((data: unknown) => {
      if (Array.isArray(data)) {
        const list = data as Track[];
        setTracks(list);
        if (list.length > 0) setActiveTrack(list[0]);
      }
    }).catch(() => {
      setTracks([{ id: 'demo', name: 'General Learning', description: 'Start your journey' }]);
      setActiveTrack({ id: 'demo', name: 'General Learning' });
    });
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text)]">Your Path</h1>
          <p className="text-sm text-[var(--text-muted)]">Keep going — every lesson counts</p>
        </div>
        <LumiMascot size={56} mood="thinking" />
      </motion.div>

      {/* Daily Goal */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="lx-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-orange-400" />
            <span className="font-semibold text-[var(--text)]">Daily Goal</span>
          </div>
          <span className="text-sm text-[var(--text-muted)]">{doneMins}/{dailyGoalMins} min</span>
        </div>
        <div className="lx-progress mb-2">
          <motion.div className="lx-progress-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <Flame size={14} className="text-orange-400" />
            <span className="text-xs text-[var(--text-muted)]">0 day streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-lx-blue" />
            <span className="text-xs text-[var(--text-muted)]">0 XP today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy size={14} className="text-lx-purple" />
            <span className="text-xs text-[var(--text-muted)]">0 badges</span>
          </div>
        </div>
      </motion.div>

      {/* Track selector */}
      {tracks.length > 1 && (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Your Tracks</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tracks.map((t) => (
              <button key={t.id} id={`track-btn-${t.id}`}
                onClick={() => setActiveTrack(t)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  activeTrack?.id === t.id
                    ? 'bg-lx-blue/10 border-lx-blue text-lx-blue'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--bg-surface)]'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </motion.section>
      )}

      {/* Lessons */}
      {activeTrack && (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-[var(--text)]">{activeTrack.name}</h2>
            <span className="lx-badge lx-badge-blue">0% complete</span>
          </div>
          <div className="flex flex-col gap-3">
            {MOCK_LESSONS.map((lesson, i) => (
              <motion.div key={lesson.id}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                className={`lx-card p-4 flex items-center gap-4 transition-all ${
                  lesson.locked ? 'opacity-50' : 'hover:bg-[var(--bg-surface)] cursor-pointer'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  lesson.completed ? 'bg-lx-teal/10' : lesson.locked ? 'bg-[var(--bg-surface)]' : 'lx-gradient-bg'
                }`}>
                  {lesson.completed ? (
                    <CheckCircle size={20} className="text-lx-teal" />
                  ) : lesson.locked ? (
                    <Lock size={18} className="text-[var(--text-dim)]" />
                  ) : (
                    <PlayCircle size={20} className="text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${lesson.locked ? 'text-[var(--text-dim)]' : 'text-[var(--text)]'}`}>
                    {lesson.title}
                  </p>
                  {lesson.durationMins && (
                    <p className="text-xs text-[var(--text-dim)] mt-0.5">{lesson.durationMins} min</p>
                  )}
                </div>
                {!lesson.locked && (
                  <ChevronRight size={16} className="text-[var(--text-dim)] flex-shrink-0" />
                )}
              </motion.div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button id="start-lesson-btn" size="lg" className="px-10">
              Start lesson 1
            </Button>
          </div>
        </motion.section>
      )}
    </div>
  );
}
