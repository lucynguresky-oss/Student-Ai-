import { z } from 'zod';
import { usernameSchema, emailSchema, phoneSchema, otpSchema } from './auth.schemas';
import { isValidCountry, isValidLanguage } from './geo';

/** Reusable global validators. */
export const countryCodeSchema = z
  .string()
  .length(2)
  .transform((s) => s.toUpperCase())
  .refine((s) => isValidCountry(s), 'Unknown country');

export const languageCodeSchema = z
  .string()
  .min(2)
  .max(3)
  .transform((s) => s.toLowerCase())
  .refine((s) => isValidLanguage(s), 'Unsupported language');

// ---------- Profile (§5.3) ----------
export const linkSchema = z.object({
  title: z.string().trim().min(1).max(30),
  url: z.string().trim().url().max(200),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().max(50).nullable().optional(),
  bio: z.string().trim().max(150).nullable().optional(),
  links: z.array(linkSchema).max(3).nullable().optional(),
  country: countryCodeSchema.optional(), // any ISO-3166 alpha-2 worldwide
  language: languageCodeSchema.optional(), // any ISO-639-1; UI falls back to English if untranslated
});

export const changeUsernameSchema = z.object({ username: usernameSchema });

export const usernameAvailableQuerySchema = z.object({ u: z.string().min(1).max(30) });

export const avatarConfirmSchema = z.object({
  key: z.string().min(1), // storage object key returned by presign
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().int().positive().max(5 * 1024 * 1024, 'Max 5MB'),
});

export const changeEmailStartSchema = z.object({ email: emailSchema });
export const changeEmailConfirmSchema = z.object({ email: emailSchema, otp: otpSchema });
export const changePhoneStartSchema = z.object({ phone: phoneSchema });
export const changePhoneConfirmSchema = z.object({ phone: phoneSchema, otp: otpSchema });

// ---------- Preferences (§5.4, §7) ----------
export const notificationChannel = z.object({
  streak: z.boolean(),
  social: z.boolean(),
  product: z.boolean(),
});
export const notificationsSchema = z.object({
  push: notificationChannel,
  email: notificationChannel,
  sms: notificationChannel,
});

export const updatePreferencesSchema = z.object({
  dailyGoalMinutes: z
    .union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)])
    .optional(),
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable()
    .optional(),
  timezone: z.string().max(64).optional(), // IANA tz, detected client-side worldwide
  theme: z.enum(['light', 'dark', 'system']).optional(),
  contentLanguage: languageCodeSchema.optional(),
  soundEffects: z.boolean().optional(),
});

export const updateNotificationPrefsSchema = z.object({ notifications: notificationsSchema });

// ---------- Privacy (§5.4) ----------
export const updatePrivacySchema = z.object({
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  whoCanMessage: z.enum(['everyone', 'followers', 'none']).optional(),
  whoCanComment: z.enum(['everyone', 'followers', 'none']).optional(),
});

// ---------- 2FA (§5.4) ----------
export const totpEnableSchema = z.object({ code: z.string().regex(/^\d{6}$/) });
export const disable2faSchema = z.object({
  password: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
});

// ---------- Account lifecycle (§5.5) ----------
export const passwordConfirmSchema = z.object({ password: z.string().min(1) });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type UpdatePrivacyInput = z.infer<typeof updatePrivacySchema>;
export type NotificationsInput = z.infer<typeof notificationsSchema>;
