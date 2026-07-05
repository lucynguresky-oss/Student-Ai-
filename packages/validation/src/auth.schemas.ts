import { z } from 'zod';
import { isReservedUsername } from './reserved-usernames';
import { normalizePhone } from './phone';

/**
 * Username rules (§5.3, Instagram-style):
 * 3–30 chars, a-z 0-9 . _, no leading/trailing/consecutive dots, case-insensitive uniqueness,
 * reserved-word blocklist. Stored lowercase.
 */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .transform((s) => s.toLowerCase())
  .refine((s) => /^[a-z0-9._]+$/.test(s), 'Only letters, numbers, dots and underscores')
  .refine((s) => !s.startsWith('.') && !s.endsWith('.'), 'Username can’t start or end with a dot')
  .refine((s) => !s.includes('..'), 'Username can’t contain consecutive dots')
  .refine((s) => !isReservedUsername(s), 'That username is reserved');

/**
 * Password policy (§9.1): min 8 chars. zxcvbn score ≥ 2 and top-10k blocklist are enforced
 * server-side (they need the wordlist); the schema guards the shape only.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(200, 'Password is too long');

/**
 * Phone input from clients — normalized to E.164 (global). The frontend PhoneInput converts a
 * national number to E.164 using the user's selected country before sending, so the value that
 * reaches the API is already international and parses without a default region. For robustness
 * we still fall back to KE parsing to preserve the original Kenya-first UX for bare locals.
 */
export const phoneSchema = z.string().transform((raw, ctx) => {
  const r = normalizePhone(raw) .ok ? normalizePhone(raw) : normalizePhone(raw, 'KE');
  if (!r.ok || !r.e164) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid phone number' });
    return z.NEVER;
  }
  return r.e164;
});

/** Country-aware phone object schema for clients that send { phone, phoneCountry }. */
export const phoneWithCountrySchema = z
  .object({ phone: z.string(), phoneCountry: z.string().length(2).optional() })
  .transform((v, ctx) => {
    const r = normalizePhone(v.phone, v.phoneCountry);
    if (!r.ok || !r.e164) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid phone number', path: ['phone'] });
      return z.NEVER;
    }
    return { phone: r.e164, country: r.country };
  });

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email');

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code');

export const policyAcceptanceSchema = z.object({
  acceptedTos: z.literal(true),
  policyVersion: z.string().min(1),
});

// ---------- Registration ----------
export const registerEmailSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    username: usernameSchema,
  })
  .merge(policyAcceptanceSchema);

export const registerPhoneStartSchema = z.object({ phone: phoneSchema });

export const registerPhoneVerifySchema = z
  .object({
    phone: phoneSchema,
    otp: otpSchema,
    username: usernameSchema,
  })
  .merge(policyAcceptanceSchema);

export const guestSchema = z.object({
  deviceId: z.string().min(8).max(200), // hashed device fingerprint
});

/** Guest → real account conversion (§5.1) — upgrade in place, keep userId. */
export const guestConvertSchema = z
  .object({
    method: z.enum(['email', 'phone', 'oauth']),
    // email path
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    // phone path
    phone: phoneSchema.optional(),
    otp: otpSchema.optional(),
    // oauth path — a short-lived code exchanged server-side
    oauthCode: z.string().optional(),
    provider: z.enum(['GOOGLE', 'APPLE']).optional(),
    username: usernameSchema.optional(), // required if the guest has an auto username to replace
  })
  .merge(policyAcceptanceSchema)
  .superRefine((v, ctx) => {
    if (v.method === 'email' && (!v.email || !v.password)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Email and password required', path: ['email'] });
    }
    if (v.method === 'phone' && (!v.phone || !v.otp)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Phone and code required', path: ['phone'] });
    }
    if (v.method === 'oauth' && (!v.oauthCode || !v.provider)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'OAuth code and provider required', path: ['oauthCode'] });
    }
  });

// ---------- Login ----------
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email, username or phone'),
  password: z.string().min(1, 'Enter your password'),
});

export const loginOtpStartSchema = z.object({ phone: phoneSchema });
export const loginOtpVerifySchema = z.object({ phone: phoneSchema, otp: otpSchema });

export const twoFactorVerifySchema = z
  .object({
    challengeToken: z.string().min(10),
    totp: z
      .string()
      .regex(/^\d{6}$/)
      .optional(),
    backupCode: z.string().min(8).optional(),
  })
  .refine((v) => v.totp || v.backupCode, 'Provide a code');

// ---------- Verification & recovery ----------
export const verifyEmailConfirmSchema = z.object({ token: z.string().min(10) });
export const verifyEmailCodeSchema = z.object({ code: otpSchema });
export const forgotPasswordSchema = z.object({ identifier: z.string().trim().min(1) });
export const resetPasswordSchema = z
  .object({
    token: z.string().optional(),
    otp: otpSchema.optional(),
    identifier: z.string().optional(),
    newPassword: passwordSchema,
  })
  .refine((v) => v.token || (v.otp && v.identifier), 'A reset token or phone code is required');

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

// ---------- Types ----------
export type RegisterEmailInput = z.infer<typeof registerEmailSchema>;
export type RegisterPhoneVerifyInput = z.infer<typeof registerPhoneVerifySchema>;
export type GuestConvertInput = z.infer<typeof guestConvertSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
