import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield, Eye, Bell, Trash2 } from 'lucide-react';

const SETTINGS_NAV = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/security', label: 'Security', icon: Shield },
  { href: '/settings/privacy', label: 'Privacy', icon: Eye },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings/account', label: 'Account', icon: Trash2 },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex gap-6">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-52 flex-shrink-0 gap-1">
        <h2 className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider px-3 mb-2">Settings</h2>
        {SETTINGS_NAV.map(({ href, label, icon: Icon }) => (
          <SettingsNavItem key={href} href={href} label={label} Icon={Icon} />
        ))}
      </aside>

      {/* Mobile tabs */}
      <div className="md:hidden flex gap-1 overflow-x-auto mb-4 pb-2 w-full">
        {SETTINGS_NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--bg-surface)]">
            <Icon size={13} />{label}
          </Link>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function SettingsNavItem({ href, label, Icon }: { href: string; label: string; Icon: React.ElementType }) {
  // We can't use usePathname in a Server Component layout, so use client wrapper
  return (
    <Link href={href} id={`settings-nav-${label.toLowerCase()}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)] transition-colors">
      <Icon size={15} />{label}
    </Link>
  );
}
