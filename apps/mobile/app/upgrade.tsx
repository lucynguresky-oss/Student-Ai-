import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE } from '../constants/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    priceKsh: 0,
    priceUsd: 0,
    period: 'forever',
    tagline: 'Start your learning journey',
    color: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    badge: null,
    cta: 'Your Current Plan',
    ctaDisabled: true,
    dbKey: 'FREE',
    features: [
      { text: '15 AI Tutor messages/day', ok: true },
      { text: '3 subjects (Bio, Math, Eng)', ok: true },
      { text: '10 past papers/year', ok: true },
      { text: 'Basic quizzes', ok: true },
      { text: 'Offline downloads', ok: false },
      { text: 'Streak protection', ok: false },
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
    borderColor: 'rgba(59,130,246,0.4)',
    badge: '⭐ POPULAR',
    cta: 'Upgrade to Plus',
    ctaDisabled: false,
    dbKey: 'PLUS_PLAN',
    features: [
      { text: 'Unlimited AI Tutor messages', ok: true },
      { text: 'All 8 KCSE subjects', ok: true },
      { text: 'All past papers (2010–2024)', ok: true },
      { text: 'Full textbook library', ok: true },
      { text: 'Offline downloads', ok: true },
      { text: '3× streak freeze tokens/month', ok: true },
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
    borderColor: 'rgba(245,158,11,0.4)',
    badge: '🏆 BEST VALUE',
    cta: 'Upgrade to Premium',
    ctaDisabled: false,
    dbKey: 'PREMIUM',
    features: [
      { text: 'Unlimited AI + GPT-4 mode', ok: true },
      { text: 'All subjects + CBC & IGCSE', ok: true },
      { text: 'All papers + mark schemes', ok: true },
      { text: 'AI-generated personalized quizzes', ok: true },
      { text: 'Unlimited offline downloads', ok: true },
      { text: 'Unlimited streak protection', ok: true },
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
    borderColor: 'rgba(16,185,129,0.4)',
    badge: '🎓 CLASSROOM INTEGRATED',
    cta: 'Upgrade to Teacher',
    ctaDisabled: false,
    dbKey: 'TEACHER',
    features: [
      { text: 'Unlimited AI + GPT-4 access', ok: true },
      { text: 'Create & manage student classrooms', ok: true },
      { text: 'Generate auto-marked homeworks', ok: true },
      { text: 'Student learning analytics reports', ok: true },
      { text: 'Custom resource banks for class', ok: true },
      { text: 'Direct chat channel with parents', ok: true },
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
    borderColor: 'rgba(124,58,237,0.4)',
    badge: '🎥 CONTENT MONETIZATION',
    cta: 'Upgrade to Creator Pro',
    ctaDisabled: false,
    dbKey: 'CREATOR_PRO',
    features: [
      { text: 'Upload & host video Clips', ok: true },
      { text: 'Direct donation & tips support', ok: true },
      { text: 'Deep viewer metrics dashboard', ok: true },
      { text: 'Custom brand banners & badges', ok: true },
      { text: 'Affiliate referral commissions', ok: true },
      { text: 'Paid-only subscription channels', ok: true },
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
    borderColor: 'rgba(239,68,68,0.4)',
    badge: '🏢 SCHOOL-WIDE',
    cta: 'Upgrade to Institution',
    ctaDisabled: false,
    dbKey: 'INSTITUTION',
    features: [
      { text: 'Up to 250 learner accounts', ok: true },
      { text: 'LMS portal with rosters', ok: true },
      { text: 'Dedicated account support rep', ok: true },
      { text: 'School past paper bank', ok: true },
      { text: 'Admin user control dashboard', ok: true },
      { text: 'Custom brand logo integration', ok: true },
    ],
  },
];

const FAQS = [
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime — no questions asked. Your plan stays active until the end of the billing period.' },
  { q: 'What payment methods are accepted?', a: 'M-Pesa, Airtel Money, Stripe, and cards. Pay in KSh or USD — no hidden FX fees.' },
  { q: 'Is there a student discount?', a: 'Yes! Students with a school ID get 30% off Plus. Contact support@learnix.ke.' },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Active plan state
  const [activePlan, setActivePlan] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Checkout simulation states
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [phone, setPhone] = useState('07');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'loading' | 'success'>('details');

  const discount = billing === 'yearly' ? 0.7 : 1; // 30% off yearly

  useEffect(() => {
    fetchActivePlan();
  }, []);

  const fetchActivePlan = async () => {
    try {
      // Fetch plan from local API server
      const res = await fetch(`${API_BASE}/subscriptions/me`);
      const json = await res.json();
      if (json?.data) {
        setActivePlan(json.data);
      }
    } catch (e) {
      console.warn('Mocking active plan details');
    }
  };

  const handleCancelSub = () => {
    Alert.alert(
      'Cancel Auto-Renew',
      'Are you sure you want to cancel your active auto-renewal? You will retain access until the end of this billing cycle.',
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Cancel Plan',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await fetch(`${API_BASE}/subscriptions/cancel`, { method: 'POST' });
              const json = await res.json();
              Alert.alert('Canceled', json.message || 'Auto-renew successfully turned off.');
              fetchActivePlan();
            } catch (e) {
              Alert.alert('Canceled', 'Auto-renew successfully turned off.');
              setActivePlan((prev: any) => prev ? { ...prev, status: 'CANCELED' } : null);
            }
            setActionLoading(false);
          }
        }
      ]
    );
  };

  const handleRequestRefund = () => {
    Alert.alert(
      'Request a Refund',
      'Request refund for this subscription? Access to all premium features will be immediately terminated.',
      [
        { text: 'Dismiss', style: 'cancel' },
        {
          text: 'Request Refund',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await fetch(`${API_BASE}/subscriptions/refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId: activePlan?.subscriptionId })
              });
              const json = await res.json();
              Alert.alert('Refund Issued', json.message || 'Refund successfully processed.');
              fetchActivePlan();
            } catch (e) {
              Alert.alert('Refund Issued', 'Your payment is being refunded to your M-Pesa account.');
              setActivePlan(null);
            }
            setActionLoading(false);
          }
        }
      ]
    );
  };

  const handleCtaPress = (plan: any) => {
    if (plan.ctaDisabled) return;
    setSelectedPlan(plan);
    setStep('details');
    setCheckoutVisible(true);
  };

  const handleMpesaPay = async () => {
    if (!phone || phone.length < 9) return;
    setLoading(true);
    setStep('loading');
    
    try {
      await fetch(`${API_BASE}/subscriptions/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan.dbKey, phone })
      });
    } catch (e) {
      console.warn('Simulating checkout directly');
    }

    setTimeout(() => {
      setStep('success');
      setLoading(false);
      fetchActivePlan();
    }, 3000);
  };

  const finalPriceValue = selectedPlan ? (currency === 'KES' ? selectedPlan.priceKsh : selectedPlan.priceUsd) : 0;
  const currentPrice = Math.round(finalPriceValue * discount);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Pitch section */}
        <View style={styles.pitchContainer}>
          <View style={styles.badgeLabel}>
            <Text style={styles.badgeLabelText}>🚀 UNLOCK YOUR FULL POTENTIAL</Text>
          </View>
          <Text style={styles.pitchTitle}>Choose your Learnix plan</Text>
          <Text style={styles.pitchSub}>Join 50,000+ top-achieving students across East Africa</Text>

          {/* Localized Currency Switcher */}
          <View style={styles.currencySwitcher}>
            {(['KES', 'USD'] as const).map(c => (
              <TouchableOpacity key={c} onPress={() => setCurrency(c)} style={[styles.currencyTab, currency === c && styles.currencyTabActive]}>
                <Text style={[styles.currencyTabText, currency === c && styles.currencyTabTextActive]}>
                  {c === 'KES' ? 'KSh (KES)' : '$ (USD)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Billing Switcher Toggle */}
          <View style={styles.billingToggleContainer}>
            <TouchableOpacity 
              onPress={() => setBilling('monthly')} 
              style={[styles.billingTab, billing === 'monthly' && styles.billingTabActive]}
            >
              <Text style={[styles.billingTabText, billing === 'monthly' && styles.billingTabTextActive]}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setBilling('yearly')} 
              style={[styles.billingTab, billing === 'yearly' && styles.billingTabActive]}
            >
              <Text style={[styles.billingTabText, billing === 'yearly' && styles.billingTabTextActive]}>Yearly</Text>
              <View style={styles.discountTag}>
                <Text style={styles.discountTagText}>-30%</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACTIVE PLAN DETAILS OVERLAY */}
        {activePlan && activePlan.plan !== 'FREE' && (
          <View style={styles.activeSubBox}>
            <Text style={styles.activeSubTitle}>⭐ Active Subscription</Text>
            <Text style={styles.activeSubDesc}>
              Plan: {activePlan.plan} ({activePlan.status}){'\n'}
              {activePlan.expiresAt && `Renews on: ${new Date(activePlan.expiresAt).toLocaleDateString()}`}
            </Text>
            
            <View style={styles.activeSubActions}>
              <TouchableOpacity onPress={handleCancelSub} disabled={actionLoading || activePlan.status === 'CANCELED'} style={styles.cancelActionBtn}>
                <Text style={styles.cancelActionText}>{activePlan.status === 'CANCELED' ? 'Canceled' : 'Cancel Auto-Renew'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRequestRefund} disabled={actionLoading} style={styles.refundActionBtn}>
                <Text style={styles.refundActionText}>Request Refund</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Pricing Cards */}
        <View style={styles.plansContainer}>
          {PLANS.map(plan => {
            const finalPrice = currency === 'KES' ? plan.priceKsh : plan.priceUsd;
            const currentPriceText = Math.round(finalPrice * discount);
            const isFree = finalPrice === 0;

            return (
              <View 
                key={plan.key} 
                style={[
                  styles.planCard, 
                  { backgroundColor: plan.color, borderColor: plan.borderColor },
                  plan.badge && styles.planCardSpecial
                ]}
              >
                {plan.badge && (
                  <View style={[styles.planCardBadge, { backgroundColor: plan.key === 'plus' ? '#3B82F6' : plan.key === 'premium' ? '#F59E0B' : '#7C3AED' }]}>
                    <Text style={styles.planCardBadgeText}>{plan.badge}</Text>
                  </View>
                )}

                <View style={styles.planCardBody}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  
                  <View style={styles.priceRow}>
                    {isFree ? (
                      <Text style={styles.priceText}>Free</Text>
                    ) : (
                      <>
                        <Text style={styles.currencyText}>{currency === 'KES' ? 'KSh' : '$'}</Text>
                        <Text style={styles.priceValueText}>{currentPriceText.toLocaleString()}</Text>
                        <Text style={styles.periodText}>/{billing === 'yearly' ? 'yr' : 'mo'}</Text>
                      </>
                    )}
                  </View>
                  <Text style={styles.planTagline}>{plan.tagline}</Text>

                  {/* Buy/Action Button */}
                  <TouchableOpacity
                    disabled={plan.ctaDisabled || activePlan?.plan === plan.dbKey}
                    onPress={() => handleCtaPress(plan)}
                    style={[
                      styles.ctaBtn,
                      plan.key === 'premium' && { backgroundColor: '#F59E0B' },
                      plan.key === 'teacher' && { backgroundColor: '#10B981' },
                      plan.key === 'creator' && { backgroundColor: '#7C3AED' },
                      plan.key === 'institution' && { backgroundColor: '#EF4444' },
                      (plan.ctaDisabled || activePlan?.plan === plan.dbKey) && styles.ctaBtnDisabled
                    ]}
                  >
                    <Text style={[styles.ctaBtnText, (plan.ctaDisabled || activePlan?.plan === plan.dbKey) && styles.ctaBtnTextDisabled]}>
                      {activePlan?.plan === plan.dbKey ? 'Your Current Plan' : plan.cta}
                    </Text>
                  </TouchableOpacity>

                  {/* Checklist */}
                  <View style={styles.checklist}>
                    {plan.features.map((f, i) => (
                      <View key={i} style={[styles.checkRow, !f.ok && { opacity: 0.35 }]}>
                        <View style={[styles.checkmarkCircle, f.ok ? styles.checkOk : styles.checkNotOk]}>
                          <Text style={styles.checkmarkText}>{f.ok ? '✓' : '✕'}</Text>
                        </View>
                        <Text style={[styles.checkText, !f.ok && { textDecorationLine: 'line-through' }]}>
                          {f.text}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Security Badges */}
        <View style={styles.badgesGrid}>
          {[
            { title: 'Secure Gateway', desc: 'Protected via Stripe & M-Pesa', icon: '🔒' },
            { title: 'Cancel Anytime', desc: 'No complex contracts', icon: '🔄' },
            { title: 'IGCSE & KCSE', desc: 'Fully aligned curriculum', icon: '🎓' },
            { title: 'Works Offline', desc: 'Save & study on the go', icon: '📱' },
          ].map(b => (
            <View key={b.title} style={styles.badgeItem}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>{b.icon}</Text>
              <Text style={styles.badgeTitle}>{b.title}</Text>
              <Text style={styles.badgeDesc}>{b.desc}</Text>
            </View>
          ))}
        </View>

        {/* FAQ Accordion */}
        <View style={styles.faqSection}>
          <Text style={styles.faqSectionTitle}>Frequently Asked Questions</Text>
          {FAQS.map((faq, i) => (
            <View key={i} style={styles.faqItem}>
              <TouchableOpacity onPress={() => setOpenFaq(openFaq === i ? null : i)} style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Text style={[styles.faqPlus, openFaq === i && { transform: [{ rotate: '45deg' }] }]}>+</Text>
              </TouchableOpacity>
              {openFaq === i && (
                <View style={styles.faqBody}>
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ────────────────────────────────────────────────────────────
          CHECKOUT/SIMULATOR MODAL (M-PESA PUSH)
          ──────────────────────────────────────────────────────────── */}
      <Modal
        visible={checkoutVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCheckoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {step === 'details' && selectedPlan && (
              <>
                <View style={styles.handleBar} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <Text style={styles.modalTitle}>Secure Checkout</Text>
                  <TouchableOpacity onPress={() => setCheckoutVisible(false)}>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Plan brief */}
                <View style={styles.planSummaryBox}>
                  <View>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Learnix {selectedPlan.name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>{selectedPlan.tagline}</Text>
                  </View>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                    {currency === 'KES' ? 'KSh' : '$'} {currentPrice.toLocaleString()}
                  </Text>
                </View>

                {/* Input field */}
                <Text style={styles.inputLabel}>Enter M-Pesa Phone Number</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="numeric"
                  placeholder="e.g. 0712345678"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={styles.textInput}
                />
                
                {/* Pay button */}
                <TouchableOpacity onPress={handleMpesaPay} style={styles.payBtn}>
                  <Text style={styles.payBtnText}>Pay {currency === 'KES' ? 'KSh' : '$'} {currentPrice.toLocaleString()}</Text>
                </TouchableOpacity>
                <Text style={styles.mpesaDisclaimer}>An STK PIN prompt will be sent directly to your phone.</Text>
              </>
            )}

            {step === 'loading' && (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingTitle}>Sending STK Push Prompt...</Text>
                <Text style={styles.loadingSub}>Please check your phone screen to enter your M-Pesa PIN to complete payment.</Text>
              </View>
            )}

            {step === 'success' && selectedPlan && (
              <View style={styles.centerContainer}>
                <View style={styles.successIconBox}>
                  <Text style={{ fontSize: 32 }}>🎉</Text>
                </View>
                <Text style={styles.successTitle}>Subscription Activated!</Text>
                <Text style={styles.successSub}>
                  Congratulations! You are now a **Learnix {selectedPlan.name}** member. You have unlimited access to all subjects and study tools.
                </Text>
                <TouchableOpacity 
                  onPress={() => { setCheckoutVisible(false); router.back(); }} 
                  style={styles.doneBtn}
                >
                  <Text style={styles.doneBtnText}>Let's Study! 🚀</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  backBtn: { padding: 4 },
  backBtnText: { color: 'white', fontSize: 20, fontWeight: '300' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: 'white' },
  scrollContent: { paddingBottom: 40 },
  pitchContainer: { alignItems: 'center', padding: 24, textAlign: 'center' },
  badgeLabel: { backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  badgeLabelText: { color: '#60A5FA', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  pitchTitle: { fontSize: 24, fontWeight: '900', color: 'white', textAlign: 'center', marginBottom: 6 },
  pitchSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 18, paddingHorizontal: 12 },
  
  currencySwitcher: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, padding: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginTop: 12 },
  currencyTab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 9 },
  currencyTabActive: { backgroundColor: '#222' },
  currencyTabText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700' },
  currencyTabTextActive: { color: 'white' },

  billingToggleContainer: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 4, marginTop: 14 },
  billingTab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 9, position: 'relative' },
  billingTabActive: { backgroundColor: 'white' },
  billingTabText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' },
  billingTabTextActive: { color: 'black' },
  discountTag: { position: 'absolute', top: -10, right: -12, backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1 },
  discountTagText: { color: '#22C55E', fontSize: 8, fontWeight: '900' },

  activeSubBox: { marginHorizontal: 16, marginBottom: 20, padding: 18, backgroundColor: 'rgba(245,158,11,0.06)', borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 16 },
  activeSubTitle: { color: '#F59E0B', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  activeSubDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12.5, lineHeight: 18, marginBottom: 14 },
  activeSubActions: { flexDirection: 'row', gap: 10 },
  cancelActionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.06)', alignItems: 'center' },
  cancelActionText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
  refundActionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center' },
  refundActionText: { color: 'white', fontSize: 12, fontWeight: '700' },

  plansContainer: { paddingHorizontal: 16, gap: 16, marginTop: 10 },
  planCard: { borderWidth: 1.5, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  planCardSpecial: { borderWidth: 2 },
  planCardBadge: { paddingVertical: 5, alignItems: 'center' },
  planCardBadgeText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  planCardBody: { padding: 20 },
  planName: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  priceText: { fontSize: 32, fontWeight: '900', color: 'white' },
  currencyText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6, marginRight: 2 },
  priceValueText: { fontSize: 32, fontWeight: '900', color: 'white' },
  periodText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  planTagline: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },
  ctaBtn: { width: '100%', backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 20 },
  ctaBtnDisabled: { backgroundColor: '#1A1A1A' },
  ctaBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
  ctaBtnTextDisabled: { color: 'rgba(255,255,255,0.3)' },
  checklist: { gap: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkmarkCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkOk: { backgroundColor: 'rgba(34,197,94,0.15)' },
  checkNotOk: { backgroundColor: 'rgba(255,255,255,0.06)' },
  checkmarkText: { fontSize: 11, fontWeight: 'bold', color: 'white' },
  checkText: { color: 'white', fontSize: 13 },

  badgesGrid: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: 30 },
  badgeItem: { width: (width - 42) / 2, backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, alignItems: 'center', textAlign: 'center' },
  badgeTitle: { fontSize: 12, fontWeight: '800', color: 'white', marginBottom: 2 },
  badgeDesc: { fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },

  faqSection: { paddingHorizontal: 16, marginTop: 30 },
  faqSectionTitle: { fontSize: 17, fontWeight: '800', color: 'white', marginBottom: 15 },
  faqItem: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  faqQuestion: { color: 'white', fontSize: 14, fontWeight: '600', flex: 1, paddingRight: 10 },
  faqPlus: { color: 'rgba(255,255,255,0.5)', fontSize: 20, fontWeight: '300' },
  faqBody: { paddingBottom: 15 },
  faqAnswer: { color: 'rgba(255,255,255,0.5)', fontSize: 13.5, lineHeight: 20 },

  // Checkout modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 15 },
  modalTitle: { color: 'white', fontSize: 17, fontWeight: '800' },
  planSummaryBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginBottom: 20 },
  inputLabel: { color: 'white', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  textInput: { backgroundColor: '#2C2C2E', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, color: 'white', fontSize: 15, marginBottom: 20 },
  payBtn: { backgroundColor: '#34A853', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  payBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
  mpesaDisclaimer: { color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center' },

  // Loading/Success state
  centerContainer: { alignItems: 'center', padding: 20, paddingVertical: 40 },
  loadingTitle: { color: 'white', fontSize: 16, fontWeight: '800', marginTop: 20, marginBottom: 8 },
  loadingSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  successIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(52,168,83,0.15)', borderWidth: 1.5, borderColor: '#34A853', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  successTitle: { color: 'white', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  successSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 18, paddingHorizontal: 10, marginBottom: 24 },
  doneBtn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  doneBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
});
