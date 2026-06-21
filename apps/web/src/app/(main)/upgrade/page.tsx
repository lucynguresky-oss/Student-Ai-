'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    priceKsh: 0,
    priceUsd: 0,
    period: 'forever',
    tagline: 'Start your learning journey',
    color: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.12)',
    cta: 'Your Current Plan',
    ctaDisabled: true,
    badge: null,
    dbKey: 'FREE',
    features: [
      { icon: '🤖', text: '15 AI Tutor messages/day', ok: true },
      { icon: '📚', text: '3 subjects (Biology, Maths, English)', ok: true },
      { icon: '📄', text: '10 past papers per year', ok: true },
      { icon: '🎬', text: 'Learnix Clips (limited)', ok: true },
      { icon: '📖', text: '2 free textbooks', ok: true },
      { icon: '🎯', text: 'Basic quizzes', ok: true },
      { icon: '⬇️', text: 'Offline downloads', ok: false },
      { icon: '🔥', text: 'Streak freeze protection', ok: false },
    ],
  },
  {
    key: 'plus',
    name: 'Plus',
    priceKsh: 500,
    priceUsd: 5,
    period: 'month',
    tagline: 'Best for serious KCSE prep',
    color: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.4)',
    cta: 'Upgrade to Plus',
    ctaDisabled: false,
    badge: '⭐ POPULAR',
    dbKey: 'PLUS_PLAN',
    features: [
      { icon: '🤖', text: 'Unlimited AI Tutor messages', ok: true },
      { icon: '📚', text: 'All 8 KCSE subjects', ok: true },
      { icon: '📄', text: 'All past papers (2010–2024)', ok: true },
      { icon: '🎬', text: 'All Clips, ad-free', ok: true },
      { icon: '📖', text: 'Full textbook library', ok: true },
      { icon: '🎯', text: 'Advanced quizzes + explanations', ok: true },
      { icon: '⬇️', text: 'Offline downloads', ok: true },
      { icon: '🔥', text: '3× streak freeze tokens/month', ok: true },
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    priceKsh: 1200,
    priceUsd: 12,
    period: 'month',
    tagline: 'For top achievers & schools',
    color: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.4)',
    cta: 'Upgrade to Premium',
    ctaDisabled: false,
    badge: '🏆 BEST VALUE',
    dbKey: 'PREMIUM',
    features: [
      { icon: '🤖', text: 'Unlimited AI + GPT-4 mode', ok: true },
      { icon: '📚', text: 'All subjects + CBC & IGCSE', ok: true },
      { icon: '📄', text: 'All papers + mark schemes', ok: true },
      { icon: '🎬', text: 'Create & publish Clips', ok: true },
      { icon: '📖', text: 'Full library + premium books', ok: true },
      { icon: '🎯', text: 'AI-generated personalised quizzes', ok: true },
      { icon: '⬇️', text: 'Unlimited offline downloads', ok: true },
      { icon: '🔥', text: 'Unlimited streak protection', ok: true },
    ],
  },
  {
    key: 'teacher',
    name: 'Teacher',
    priceKsh: 2500,
    priceUsd: 25,
    period: 'month',
    tagline: 'Empower your classrooms',
    color: 'rgba(16,185,129,0.06)',
    border: 'rgba(16,185,129,0.4)',
    cta: 'Upgrade to Teacher',
    ctaDisabled: false,
    badge: '🎓 CLASSROOM INTEGRATED',
    dbKey: 'TEACHER',
    features: [
      { icon: '🤖', text: 'Unlimited AI + GPT-4 access', ok: true },
      { icon: '🏫', text: 'Create & manage student classrooms', ok: true },
      { icon: '📝', text: 'Generate auto-marked homeworks', ok: true },
      { icon: '📊', text: 'Student learning analytics reports', ok: true },
      { icon: '📖', text: 'Custom resource banks for your class', ok: true },
      { icon: '💬', text: 'Direct messaging channel with parents', ok: true },
    ],
  },
  {
    key: 'creator',
    name: 'Creator Pro',
    priceKsh: 1800,
    priceUsd: 18,
    period: 'month',
    tagline: 'Publish & monetize content',
    color: 'rgba(124,58,237,0.06)',
    border: 'rgba(124,58,237,0.4)',
    cta: 'Upgrade to Creator Pro',
    ctaDisabled: false,
    badge: '🎥 CONTENT MONETIZATION',
    dbKey: 'CREATOR_PRO',
    features: [
      { icon: '🎬', text: 'Upload & host video Clips', ok: true },
      { icon: '💰', text: 'Direct donation & tips support', ok: true },
      { icon: '📊', text: 'Deep viewer metrics dashboard', ok: true },
      { icon: '🏷️', text: 'Custom brand banners & badges', ok: true },
      { icon: '🎒', text: 'Affiliate referral commissions', ok: true },
      { icon: '🔒', text: 'Paid-only subscription channels', ok: true },
    ],
  },
  {
    key: 'institution',
    name: 'Institution',
    priceKsh: 15000,
    priceUsd: 150,
    period: 'month',
    tagline: 'Full-scale school packages',
    color: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.4)',
    cta: 'Upgrade to Institution',
    ctaDisabled: false,
    badge: '🏢 SCHOOL-WIDE',
    dbKey: 'INSTITUTION',
    features: [
      { icon: '👥', text: 'Up to 250 learner accounts', ok: true },
      { icon: '🎓', text: 'LMS portal with complete rosters', ok: true },
      { icon: '🏆', text: 'Dedicated account support rep', ok: true },
      { icon: '📚', text: 'School past paper question bank', ok: true },
      { icon: '💻', text: 'Admin user control panel dashboard', ok: true },
      { icon: '🎨', text: 'Custom brand logo integration', ok: true },
    ],
  },
];

const FAQ = [
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime — no questions asked. Your plan stays active until the end of the billing period.' },
  { q: 'What payment methods are accepted?', a: 'M-Pesa, Airtel Money, debit/credit card, and bank transfer. Pay in KSh or USD — no hidden fees.' },
  { q: 'Is there a student discount?', a: 'Yes! Students with a valid school ID get 30% off Plus. Contact support@learnix.ke.' },
  { q: 'Can my school get Learnix?', a: 'Yes — we offer school & institution plans. Email schools@learnix.ke for pricing.' },
];

export default function UpgradePage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Active subscription state
  const [activePlan, setActivePlan] = useState<any>(null);
  const [billingActionLoading, setBillingActionLoading] = useState(false);
  const [billingMessage, setBillingMessage] = useState('');

  // M-Pesa Checkout simulation states
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [phone, setPhone] = useState('07');
  const [step, setStep] = useState<'details' | 'loading' | 'success'>('details');

  const discount = billing === 'yearly' ? 0.7 : 1; // 30% off yearly

  useEffect(() => {
    fetchActivePlan();
  }, []);

  const fetchActivePlan = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://localhost:4000/subscriptions/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json?.data) {
        setActivePlan(json.data);
      }
    } catch (e) {
      console.warn('Failed to load active plan details');
    }
  };

  const handleCancelSub = async () => {
    if (!confirm('Are you sure you want to cancel your active subscription? You will still retain access until the end of the period.')) return;
    setBillingActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      setBillingMessage(json.message || 'Subscription successfully canceled.');
      fetchActivePlan();
    } catch (e) {
      setBillingMessage('Failed to process cancellation request.');
    }
    setBillingActionLoading(false);
  };

  const handleRequestRefund = async () => {
    if (!activePlan?.subscriptionId) return;
    if (!confirm('Request a refund? This will terminate your subscription access immediately.')) return;
    setBillingActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/subscriptions/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscriptionId: activePlan.subscriptionId })
      });
      const json = await res.json();
      setBillingMessage(json.message || 'Refund successfully processed.');
      fetchActivePlan();
    } catch (e) {
      setBillingMessage('Failed to process refund request.');
    }
    setBillingActionLoading(false);
  };

  const handleCtaPress = (plan: any) => {
    if (plan.ctaDisabled) return;
    setSelectedPlan(plan);
    setStep('details');
    setCheckoutOpen(true);
  };

  const handleMpesaPay = async () => {
    if (!phone || phone.length < 9) return;
    setStep('loading');

    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:4000/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: selectedPlan.dbKey,
          phone: phone
        })
      });
    } catch (e) {
      console.warn('Mocking database persistence directly');
    }

    setTimeout(() => {
      setStep('success');
      fetchActivePlan();
    }, 3000);
  };

  const currentPrice = selectedPlan ? (currency === 'KES' ? Math.round(selectedPlan.priceKsh * discount) : Math.round(selectedPlan.priceUsd * discount)) : 0;

  return (
    <div style={{ paddingBottom: '100px', maxWidth: '100%', position: 'relative' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '32px 16px 24px' }}>
        <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '999px', fontSize: '12px', fontWeight: 700, color: 'var(--blue)', marginBottom: '16px' }}>
          🚀 Unlock Your Full Potential
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px', lineHeight: 1.2 }}>
          Choose your<br />
          <span style={{ background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Learnix plan</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px' }}>
          Join 50,000+ students across East Africa
        </p>

        {/* Localized Currency Switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', background: 'var(--surface)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)' }}>
            {(['KES', 'USD'] as const).map(c => (
              <button key={c} onClick={() => setCurrency(c)} style={{ padding: '6px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 700, background: currency === c ? 'white' : 'transparent', color: currency === c ? 'black' : 'var(--text2)', transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}>
                {c === 'KES' ? 'KSh (KES)' : '$ (USD)'}
              </button>
            ))}
          </div>
        </div>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', background: 'var(--surface)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border)' }}>
          {(['monthly', 'yearly'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{ padding: '8px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: billing === b ? 'white' : 'transparent', color: billing === b ? 'black' : 'var(--text2)', transition: 'all 0.2s', position: 'relative', border: 'none', cursor: 'pointer' }}>
              {b === 'yearly' ? 'Yearly' : 'Monthly'}
              {b === 'yearly' && <span style={{ position: 'absolute', top: '-8px', right: '-6px', fontSize: '10px', fontWeight: 800, color: '#22C55E', background: 'rgba(34,197,94,0.15)', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(34,197,94,0.3)' }}>-30%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVE SUBSCRIPTION STATE PANEL */}
      {activePlan && activePlan.plan !== 'FREE' && (
        <div style={{ margin: '0 16px 24px', padding: '20px', background: 'rgba(245,158,11,0.06)', border: '1.5px solid rgba(245,158,11,0.3)', borderRadius: '16px', color: 'white' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 4px', color: '#F59E0B' }}>⭐ Active Subscription</h3>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>
            Plan: <strong>{activePlan.plan}</strong> ({activePlan.status})<br />
            {activePlan.expiresAt && <>Renews on: <strong>{new Date(activePlan.expiresAt).toLocaleDateString()}</strong></>}
          </p>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCancelSub}
              disabled={billingActionLoading || activePlan.status === 'CANCELED'}
              style={{ flex: 1, padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {activePlan.status === 'CANCELED' ? 'Canceled' : 'Cancel Auto-Renew'}
            </button>
            <button
              onClick={handleRequestRefund}
              disabled={billingActionLoading}
              style={{ flex: 1, padding: '10px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Request Refund
            </button>
          </div>
          {billingMessage && <p style={{ fontSize: '12px', color: '#60A5FA', marginTop: '10px', margin: '10px 0 0' }}>{billingMessage}</p>}
        </div>
      )}

      {/* Plans */}
      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {PLANS.map(plan => {
          const finalPrice = currency === 'KES' ? plan.priceKsh : plan.priceUsd;
          const isFree = finalPrice === 0;

          return (
            <div key={plan.key} style={{ background: plan.color, border: `1.5px solid ${plan.border}`, borderRadius: '20px', overflow: 'hidden', position: 'relative' }}>
              {/* Popular badge */}
              {plan.badge && (
                <div style={{ background: plan.key === 'plus' ? 'var(--grad)' : 'linear-gradient(135deg,#F59E0B,#D97706)', padding: '6px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: 'white' }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ padding: '20px' }}>
                {/* Price header */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text2)', marginBottom: '4px' }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '4px' }}>
                    {isFree ? (
                      <span style={{ fontSize: '36px', fontWeight: 900 }}>Free</span>
                    ) : (
                      <>
                        <span style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>{currency === 'KES' ? 'KSh' : '$'}</span>
                        <span style={{ fontSize: '36px', fontWeight: 900 }}>{Math.round(finalPrice * discount).toLocaleString()}</span>
                        <span style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>/{billing === 'yearly' ? 'yr' : 'mo'}</span>
                      </>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text2)' }}>{plan.tagline}</p>
                </div>

                {/* CTA */}
                <button
                  disabled={plan.ctaDisabled || activePlan?.plan === plan.dbKey}
                  onClick={() => handleCtaPress(plan)}
                  style={{
                    width: '100%', padding: '13px', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
                    background: plan.ctaDisabled || activePlan?.plan === plan.dbKey ? 'var(--surface)' : plan.key === 'premium' ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'var(--grad)',
                    color: 'white', marginBottom: '20px', opacity: plan.ctaDisabled || activePlan?.plan === plan.dbKey ? 0.6 : 1,
                    border: 'none', cursor: plan.ctaDisabled || activePlan?.plan === plan.dbKey ? 'default' : 'pointer',
                    transition: 'opacity 0.2s, transform 0.15s',
                  }}
                >
                  {activePlan?.plan === plan.dbKey ? 'Your Current Plan' : plan.cta}
                </button>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: f.ok ? 1 : 0.35 }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: f.ok ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px' }}>
                        {f.ok ? '✓' : '✕'}
                      </div>
                      <span style={{ fontSize: '13.5px', color: f.ok ? 'var(--text)' : 'var(--text3)', textDecoration: f.ok ? 'none' : 'line-through' }}>{f.text}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '14px' }}>{f.icon}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust badges */}
      <div style={{ padding: '24px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { emoji: '🔒', title: 'Secure Payments', desc: 'M-Pesa · Stripe · Flutterwave' },
            { emoji: '🔄', title: 'Cancel Anytime', desc: 'No lock-in contracts' },
            { emoji: '📱', title: 'Works Offline', desc: 'Download & learn anywhere' },
            { emoji: '🎓', title: 'Student Discount', desc: '30% off with school ID' },
          ].map(b => (
            <div key={b.title} style={{ padding: '14px', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{b.emoji}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '2px' }}>{b.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding: '0 16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>Frequently Asked Questions</h2>
        {FAQ.map((f, i) => (
          <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', background: 'none', border: 'none', color: 'white', textAlign: 'left', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              {f.q}
              <span style={{ fontSize: '20px', color: 'var(--text2)', flexShrink: 0, marginLeft: '12px', transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
            </button>
            {openFaq === i && (
              <p style={{ paddingBottom: '14px', fontSize: '13.5px', color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{f.a}</p>
            )}
          </div>
        ))}
      </div>

      {/* ────────────────────────────────────────────────────────────
          WEB CHECKOUT POPUP OVERLAY
          ──────────────────────────────────────────────────────────── */}
      {checkoutOpen && selectedPlan && (
        <div
          onClick={() => setCheckoutOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px', boxSizing: 'border-box' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '440px', backgroundColor: '#1C1C1E', borderRadius: '20px', padding: '24px', color: 'white', boxSizing: 'border-box', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {step === 'details' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>Secure Checkout</h3>
                  <button onClick={() => setCheckoutOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                </div>

                {/* Plan Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Learnix {selectedPlan.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '2px' }}>{selectedPlan.tagline}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '20px' }}>
                    {currency === 'KES' ? 'KSh' : '$'} {currentPrice.toLocaleString()}
                  </div>
                </div>

                {/* Inputs */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Enter M-Pesa Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#2C2C2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: 'white', fontSize: '15px', boxSizing: 'border-box' }}
                    placeholder="e.g. 0712345678"
                  />
                </div>

                <button
                  onClick={handleMpesaPay}
                  style={{ width: '100%', backgroundColor: '#34A853', color: 'white', borderRadius: '12px', padding: '14px', fontWeight: '800', fontSize: '15px', border: 'none', cursor: 'pointer', marginBottom: '10px' }}
                >
                  Pay {currency === 'KES' ? 'KSh' : '$'} {currentPrice.toLocaleString()}
                </button>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', textAlign: 'center' }}>
                  An STK PIN prompt will be sent directly to your phone.
                </div>
              </>
            )}

            {step === 'loading' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #3B82F6', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}} />
                <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '800', margin: '0 0 8px' }}>Sending STK Push Prompt...</h4>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.4, margin: 0 }}>Please check your phone screen to enter your M-Pesa PIN to complete payment.</p>
              </div>
            )}

            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(52,168,83,0.15)', border: '1.5px solid #34A853', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '32px' }}>
                  🎉
                </div>
                <h4 style={{ color: 'white', fontSize: '18px', fontWeight: '800', margin: '0 0 8px' }}>Subscription Activated!</h4>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.4, margin: '0 0 24px' }}>
                  Congratulations! You are now a <strong>Learnix {selectedPlan.name}</strong> member. You have unlimited access to all subjects and study tools.
                </p>
                <button
                  onClick={() => setCheckoutOpen(false)}
                  style={{ width: '100%', backgroundColor: '#3B82F6', color: 'white', borderRadius: '12px', padding: '13px 32px', fontWeight: '800', fontSize: '15px', border: 'none', cursor: 'pointer' }}
                >
                  Let's Study! 🚀
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
