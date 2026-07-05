/**
 * Typed error-code catalogue (§5). The API throws these; the web app maps them
 * to friendly copy. Keep codes stable — they are a contract.
 */
export const ERROR_CODES = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_2FA_REQUIRED: 'AUTH_2FA_REQUIRED',
  AUTH_2FA_INVALID: 'AUTH_2FA_INVALID',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_REFRESH_REUSE: 'AUTH_REFRESH_REUSE',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_ACCOUNT_DEACTIVATED: 'AUTH_ACCOUNT_DEACTIVATED',
  AUTH_ACCOUNT_BANNED: 'AUTH_ACCOUNT_BANNED',
  AUTH_GUEST_ONLY: 'AUTH_GUEST_ONLY',
  AUTH_NOT_GUEST: 'AUTH_NOT_GUEST',

  // OTP / verification
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_LOCKED: 'OTP_LOCKED',
  VERIFICATION_TOKEN_INVALID: 'VERIFICATION_TOKEN_INVALID',
  ALREADY_VERIFIED: 'ALREADY_VERIFIED',

  // Username / profile
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  USERNAME_INVALID: 'USERNAME_INVALID',
  USERNAME_RESERVED: 'USERNAME_RESERVED',
  USERNAME_CHANGE_LIMIT: 'USERNAME_CHANGE_LIMIT',
  USERNAME_CHANGE_COOLDOWN: 'USERNAME_CHANGE_COOLDOWN',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  PHONE_TAKEN: 'PHONE_TAKEN',
  PHONE_INVALID: 'PHONE_INVALID',

  // OAuth
  OAUTH_STATE_INVALID: 'OAUTH_STATE_INVALID',
  OAUTH_LAST_METHOD: 'OAUTH_LAST_METHOD', // cannot unlink last login method
  OAUTH_ALREADY_LINKED: 'OAUTH_ALREADY_LINKED',

  // Onboarding
  ONBOARDING_STEP_INVALID: 'ONBOARDING_STEP_INVALID',
  ONBOARDING_ANSWER_INVALID: 'ONBOARDING_ANSWER_INVALID',
  ONBOARDING_INCOMPLETE: 'ONBOARDING_INCOMPLETE',
  ONBOARDING_STEP_NOT_SKIPPABLE: 'ONBOARDING_STEP_NOT_SKIPPABLE',
  PLACEMENT_ALREADY_TAKEN: 'PLACEMENT_ALREADY_TAKEN',

  // Minor / compliance
  MINOR_PRIVACY_LOCKED: 'MINOR_PRIVACY_LOCKED',
  PARENTAL_CONSENT_REQUIRED: 'PARENTAL_CONSENT_REQUIRED',
  POLICY_ACCEPTANCE_REQUIRED: 'POLICY_ACCEPTANCE_REQUIRED',

  // Account lifecycle
  PASSWORD_REQUIRED: 'PASSWORD_REQUIRED',
  ACCOUNT_NOT_IN_GRACE: 'ACCOUNT_NOT_IN_GRACE',

  // Generic
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL: 'INTERNAL',
  UPLOAD_INVALID: 'UPLOAD_INVALID',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ApiErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Default human-readable copy per code (frontend may override with localized copy). */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  AUTH_INVALID_CREDENTIALS: 'The credentials you entered are incorrect.',
  AUTH_2FA_REQUIRED: 'Two-factor authentication is required.',
  AUTH_2FA_INVALID: 'That two-factor code is invalid.',
  AUTH_TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  AUTH_TOKEN_INVALID: 'Your session is invalid. Please sign in again.',
  AUTH_REFRESH_REUSE: 'Session security issue detected. Please sign in again.',
  AUTH_UNAUTHORIZED: 'You need to be signed in to do that.',
  AUTH_ACCOUNT_DEACTIVATED: 'This account is deactivated.',
  AUTH_ACCOUNT_BANNED: 'This account has been suspended.',
  AUTH_GUEST_ONLY: 'This action is only available for guest accounts.',
  AUTH_NOT_GUEST: 'This account is already registered.',
  OTP_INVALID: 'That code is incorrect.',
  OTP_EXPIRED: 'That code has expired. Request a new one.',
  OTP_LOCKED: 'Too many attempts. Try again in a few minutes.',
  VERIFICATION_TOKEN_INVALID: 'This verification link is invalid or has expired.',
  ALREADY_VERIFIED: 'This is already verified.',
  USERNAME_TAKEN: 'That username is taken.',
  USERNAME_INVALID: 'That username isn’t allowed.',
  USERNAME_RESERVED: 'That username is reserved.',
  USERNAME_CHANGE_LIMIT: 'You’ve reached the username change limit for this year.',
  USERNAME_CHANGE_COOLDOWN: 'You changed your username recently. Try again later.',
  EMAIL_TAKEN: 'That email is already in use.',
  PHONE_TAKEN: 'That phone number is already in use.',
  PHONE_INVALID: 'That phone number isn’t valid.',
  OAUTH_STATE_INVALID: 'Sign-in could not be completed. Please try again.',
  OAUTH_LAST_METHOD: 'You can’t remove your only sign-in method.',
  OAUTH_ALREADY_LINKED: 'That account is already linked.',
  ONBOARDING_STEP_INVALID: 'Unknown onboarding step.',
  ONBOARDING_ANSWER_INVALID: 'That answer isn’t valid for this step.',
  ONBOARDING_INCOMPLETE: 'Please finish the required steps first.',
  ONBOARDING_STEP_NOT_SKIPPABLE: 'This step can’t be skipped.',
  PLACEMENT_ALREADY_TAKEN: 'You’ve already taken this placement quiz.',
  MINOR_PRIVACY_LOCKED: 'Accounts for under-18s stay private.',
  PARENTAL_CONSENT_REQUIRED: 'A parent or guardian needs to approve this first.',
  POLICY_ACCEPTANCE_REQUIRED: 'Please accept the Terms and Privacy Policy.',
  PASSWORD_REQUIRED: 'Please confirm your password.',
  ACCOUNT_NOT_IN_GRACE: 'This account isn’t scheduled for deletion.',
  VALIDATION_ERROR: 'Some fields need your attention.',
  RATE_LIMITED: 'Too many requests. Please slow down.',
  NOT_FOUND: 'Not found.',
  FORBIDDEN: 'You don’t have permission to do that.',
  CONFLICT: 'That conflicts with an existing record.',
  INTERNAL: 'Something went wrong on our end.',
  UPLOAD_INVALID: 'That file couldn’t be uploaded.',
};
