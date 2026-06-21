'use client';
import Link from 'next/link';

interface PremiumGateProps {
  /** If true, renders children normally. If false, shows upgrade wall. */
  isPremium?: boolean;
  feature: string;
  description?: string;
  /** 'blur' = blurs content, 'lock' = shows lock icon only, 'banner' = inline banner */
  variant?: 'blur' | 'lock' | 'banner';
  children?: React.ReactNode;
}

export function PremiumGate({ isPremium = false, feature, description, variant = 'blur', children }: PremiumGateProps) {
  if (isPremium) return <>{children}</>;

  if (variant === 'banner') {
    return (
      <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px', flexShrink: 0 }}>⭐</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '2px' }}>{feature} — Plus Feature</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{description || 'Upgrade to unlock this feature'}</div>
        </div>
        <Link href="/upgrade" style={{ padding: '8px 14px', background: 'var(--grad)', color: 'white', borderRadius: '8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, textDecoration: 'none' }}>
          Upgrade
        </Link>
      </div>
    );
  }

  if (variant === 'lock') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '32px 16px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>🔒</div>
        <div style={{ fontWeight: 700, fontSize: '16px' }}>{feature}</div>
        <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{description || 'This feature requires a Plus or Premium plan.'}</div>
        <Link href="/upgrade" className="btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '10px 24px', marginTop: '4px', borderRadius: '10px', fontSize: '14px' }}>
          ⭐ Upgrade to Plus
        </Link>
      </div>
    );
  }

  // variant === 'blur' (default) — shows blurred content with overlay
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '14px' }}>
      <div style={{ filter: 'blur(6px)', opacity: 0.35, pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
        <div style={{ fontSize: '28px' }}>⭐</div>
        <div style={{ fontWeight: 700, fontSize: '15px', color: 'white' }}>{feature}</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{description || 'Upgrade to Plus to unlock'}</div>
        <Link href="/upgrade" style={{ padding: '10px 22px', background: 'var(--grad)', color: 'white', borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', marginTop: '4px' }}>
          Unlock Now →
        </Link>
      </div>
    </div>
  );
}

/** Small badge to show on premium-only labels */
export function PlusBadge({ plan = 'Plus' }: { plan?: 'Plus' | 'Premium' }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '5px',
      background: plan === 'Premium' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
      border: `1px solid ${plan === 'Premium' ? 'rgba(245,158,11,0.4)' : 'rgba(59,130,246,0.4)'}`,
      color: plan === 'Premium' ? '#F59E0B' : '#60A5FA',
      verticalAlign: 'middle', marginLeft: '6px',
    }}>
      {plan === 'Premium' ? '🏆' : '⭐'} {plan}
    </span>
  );
}

/** Hook to check plan (mock until backend wired) */
export function usePlan() {
  // TODO: replace with real API call / auth context
  let plan: 'free' | 'plus' | 'premium' = 'free'; // 'free' | 'plus' | 'premium'
  return {
    plan,
    isFree: plan === 'free',
    isPlus: (plan as string) === 'plus' || (plan as string) === 'premium',
    isPremium: (plan as string) === 'premium',
    aiMessagesLeft: 15,
    aiMessagesTotal: 15,
  };
}
