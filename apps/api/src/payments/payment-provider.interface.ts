/**
 * Payment-provider abstraction. Each gateway (M-Pesa, PayPal, later Stripe/Flutterwave)
 * implements its own flow and feeds confirmation back through a webhook/capture path.
 * Flows differ (M-Pesa = STK push + callback; PayPal = create order + approve + capture),
 * so we keep provider-specific endpoints but share entitlement/idempotency rules.
 *
 * Country → provider routing belongs in one place (chooseProvider()), so the UI
 * shows M-Pesa to Kenyan/EA users and PayPal to everyone else — automatically.
 */
export type PaymentProviderName = 'MPESA' | 'PAYPAL'; // | 'STRIPE' | 'FLUTTERWAVE'

export interface InitiateResult {
  paymentId: string;
  provider: PaymentProviderName;
  status: 'PENDING';
  // provider-specific handoff for the client:
  mpesa?: { note: 'STK prompt sent to phone' };
  paypal?: { orderId: string }; // client approves this with the PayPal JS SDK
}

/**
 * Single source of truth for which provider a country uses.
 * Default everyone to PayPal; M-Pesa for East African markets where it dominates.
 * Extend MPESA_COUNTRIES as Learnix expands to other mobile-money markets.
 */
const MPESA_COUNTRIES = new Set(['KE', 'TZ', 'UG', 'RW', 'CD', 'GH', 'EG']);

export function chooseProvider(countryIso2?: string): PaymentProviderName {
  if (countryIso2 && MPESA_COUNTRIES.has(countryIso2.toUpperCase())) return 'MPESA';
  return 'PAYPAL';
}
