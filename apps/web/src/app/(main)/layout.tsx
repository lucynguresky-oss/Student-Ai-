'use client';

import { AuthProvider } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Search, Bell, User, Zap, Settings, LogOut } from 'lucide-react';
import LumiMascot from '@/components/LumiMascot';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/notifications', label: 'Alerts', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
];

function NavItem({ href, label, icon: Icon }: (typeof NAV)[number]) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      id={`nav-${label.toLowerCase()}`}
      className={cn(
        'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all group',
        active ? 'text-lx-blue' : 'text-[var(--text-dim)] hover:text-[var(--text-muted)]',
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
        active ? 'bg-lx-blue/10 shadow-[0_0_12px_rgba(59,130,246,0.2)]' : 'group-hover:bg-[var(--bg-surface)]',
      )}>
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <AuthProvider>
    <div className="min-h-dvh flex">
      {/* ── Sidebar (desktop) ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 h-dvh sticky top-0 border-r border-[var(--border)] bg-[var(--bg-card)] p-4 gap-2">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-3 px-2 py-3 mb-4">
          <LumiMascot size={36} animate={false} />
          <span className="text-xl font-black lx-gradient-text">Learnix</span>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map((item) => (
            <SidebarNavItem key={item.href} {...item} />
          ))}
        </nav>

        {/* XP / Streak strip */}
        {user && (
          <div className="lx-card p-3 flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-orange-400">🔥</span>
              <span className="text-xs font-semibold text-[var(--text)]">0</span>
              <span className="text-xs text-[var(--text-dim)]">streak</span>
            </div>
            <div className="w-px h-4 bg-[var(--border)]" />
            <div className="flex items-center gap-1.5">
              <Zap size={13} className="text-lx-blue" />
              <span className="text-xs font-semibold text-[var(--text)]">0 XP</span>
            </div>
          </div>
        )}

        {/* User + settings */}
        <div className="border-t border-[var(--border)] pt-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full lx-gradient-bg flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.profile?.displayName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text)] truncate">
              {user?.profile?.displayName ?? user?.username ?? 'Guest'}
            </p>
            <p className="text-[10px] text-[var(--text-dim)] truncate">{user?.email ?? ''}</p>
          </div>
          <div className="flex gap-1">
            <Link href="/settings/profile" id="sidebar-settings-link" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-dim)] hover:text-[var(--text)]">
              <Settings size={14} />
            </Link>
            <button id="sidebar-logout-btn" onClick={logout} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 transition-colors text-[var(--text-dim)] hover:text-red-400">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-dvh">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* ── Bottom nav (mobile) ────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 lx-glass border-t border-[var(--border)] flex items-center justify-around px-2 py-1 safe-area-pb">
        {NAV.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>
    </div>
    </AuthProvider>
  );
}

function SidebarNavItem({ href, label, icon: Icon }: (typeof NAV)[number]) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      id={`sidebar-${label.toLowerCase()}`}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm',
        active
          ? 'bg-lx-blue/10 text-lx-blue shadow-[0_0_0_1px_rgba(59,130,246,0.15)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]',
      )}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
      {label}
    </Link>
  );
}
