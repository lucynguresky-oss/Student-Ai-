'use client';

import { Bell } from 'lucide-react';

const MOCK_NOTIFS = [
  { id: '1', emoji: '🔥', text: 'Keep your streak going! You\'re on day 1.', time: '2 min ago', read: false },
  { id: '2', emoji: '⭐', text: 'You\'ve earned 50 XP today. Keep it up!', time: '1 hr ago', read: false },
  { id: '3', emoji: '🎉', text: 'Welcome to Learnix! Lumi is here to guide you.', time: 'Just now', read: true },
];

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--text)]">Notifications</h1>
        <button id="mark-all-read-btn" className="text-xs text-lx-blue hover:text-lx-purple transition-colors">Mark all read</button>
      </div>
      <div className="flex flex-col gap-2">
        {MOCK_NOTIFS.map((n) => (
          <div key={n.id} id={`notif-${n.id}`}
            className={`lx-card p-4 flex items-start gap-3 transition-all ${!n.read ? 'border-lx-blue/30 bg-lx-blue/3' : ''}`}>
            <span className="text-xl flex-shrink-0 mt-0.5">{n.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text)]">{n.text}</p>
              <p className="text-xs text-[var(--text-dim)] mt-1">{n.time}</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full bg-lx-blue mt-1.5 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}
