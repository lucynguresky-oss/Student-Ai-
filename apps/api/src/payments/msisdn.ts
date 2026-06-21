/**
 * Kenyan mobile number validation + normalization to 2547XXXXXXXX / 2541XXXXXXXX
 * format that Safaricom Daraja expects. Rejects "07" alone and bare "254".
 *
 * Accepts:
 *   07XXXXXXXX   → 2547########
 *   01XXXXXXXX   → 2541########
 *   +2547XXXXXXXX → 2547########
 *   2547XXXXXXXX  → 2547########
 *   7XXXXXXXX    → 2547########
 *   1XXXXXXXX    → 2541########
 *
 * Safaricom numbers (07XX) and Airtel/Telkom Kenya (01XX) are both valid.
 */
export function normalizeKenyanMsisdn(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, ''); // strip +, spaces, dashes

  // Already in 254 format
  if (/^254(7|1)\d{8}$/.test(digits)) return digits;

  let national: string | null = null;
  if (/^0(7|1)\d{8}$/.test(digits)) {
    national = digits.slice(1); // 07... → 7...
  } else if (/^(7|1)\d{8}$/.test(digits)) {
    national = digits; // bare 7.../1...
  }

  if (!national) return null;
  return `254${national}`;
}

export function isValidKenyanMsisdn(raw: string): boolean {
  return normalizeKenyanMsisdn(raw) !== null;
}
