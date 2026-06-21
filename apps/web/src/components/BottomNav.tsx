'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';

const navItems = [
  {
    href: '/feed', label: 'Home',
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" fill={a ? 'white' : 'none'} stroke="currentColor" strokeWidth={a ? 2.5 : 1.8}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/search', label: 'Search',
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 1.8}>
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    href: '/clips', label: 'Clips',
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" fill={a ? 'white' : 'none'} stroke="currentColor" strokeWidth={a ? 2.5 : 1.8}>
        <rect x="2" y="3" width="20" height="18" rx="3"/>
        <polygon points="10 8 16 12 10 16 10 8" fill={a ? 'black' : 'currentColor'}/>
      </svg>
    ),
  },
  {
    href: '/library', label: 'Books',
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" fill={a ? 'white' : 'none'} stroke="currentColor" strokeWidth={a ? 2.5 : 1.8}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    href: '/learn', label: 'Learn',
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 1.8}>
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    href: '/profile', label: 'Profile',
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" fill={a ? 'white' : 'none'} stroke="currentColor" strokeWidth={a ? 2.5 : 1.8}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { currentUser } = useStore();
  const isClips = pathname.startsWith('/clips');

  return (
    <>
      {/* Floating Notification bell */}
      <Link
        href="/notifications"
        title="Notifications"
        style={{
          position: 'fixed',
          bottom: '136px',
          right: 'max(16px, calc(50% - 240px + 16px))',
          width: '42px', height: '42px',
          borderRadius: '50%',
          background: 'rgba(30,30,30,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          zIndex: 99,
          transition: 'transform 0.2s',
          border: '1px solid rgba(255,255,255,0.12)',
          textDecoration: 'none',
        }}
      >
        🔔
        <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%', background: '#EF4444', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: 'white' }}>3</span>
      </Link>

      {/* Floating AI Tutor button */}
      <Link
        href="/ai-tutor"
        title="AI Tutor"
        style={{
          position: 'fixed',
          bottom: '76px',
          right: 'max(16px, calc(50% - 240px + 16px))',
          width: '50px', height: '50px',
          borderRadius: '50%',
          background: 'var(--grad)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px',
          boxShadow: '0 6px 24px rgba(59,130,246,0.55)',
          zIndex: 99,
          transition: 'transform 0.2s, box-shadow 0.2s',
          border: '2px solid rgba(255,255,255,0.15)',
        }}
      >
        🤖
      </Link>

      {/* Bottom nav — 6 items */}
      <nav
        className="bottom-nav"
        style={{
          background: isClips ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.97)',
          gap: '2px',
        }}
      >
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const href = item.href === '/profile' ? `/profile?u=${currentUser?.username || 'amara.otieno'}` : item.href;

          return (
            <Link key={item.href} href={href} className={`nav-btn${active ? ' active' : ''}`} style={{ minWidth: '44px', padding: '6px 6px' }}>
              {item.icon(active)}
              <span style={{ fontSize: '9px' }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
