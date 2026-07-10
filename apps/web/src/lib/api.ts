/**
 * Learnix typed API client.
 * Wraps every call in the standard error envelope, handles auth cookies,
 * and transparently refreshes the access token on 401.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/* ─── Error envelope ──────────────────────────────────────────── */
export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

export class LearnixApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'LearnixApiError';
  }
}

/* ─── Internal fetch wrapper ──────────────────────────────────── */
let _refreshing: Promise<void> | null = null;

async function lxFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  // Transparent token refresh on 401
  if (res.status === 401 && retry) {
    if (!_refreshing) {
      _refreshing = refreshToken().finally(() => { _refreshing = null; });
    }
    await _refreshing;
    return lxFetch<T>(path, init, false);
  }

  if (!res.ok) {
    let err: ApiError;
    try {
      err = await res.json();
    } catch {
      err = { statusCode: res.status, code: 'UNKNOWN', message: res.statusText };
    }
    throw new LearnixApiError(err.statusCode, err.code, err.message, err.details);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

async function refreshToken(): Promise<void> {
  await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
}

/* ─── Public API surface ──────────────────────────────────────── */
export const api = {
  get: <T>(path: string, init?: RequestInit) =>
    lxFetch<T>(path, { ...init, method: 'GET' }),

  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    lxFetch<T>(path, { ...init, method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    lxFetch<T>(path, { ...init, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string, init?: RequestInit) =>
    lxFetch<T>(path, { ...init, method: 'DELETE' }),
};

/* ─── Typed endpoint helpers ──────────────────────────────────── */

// Auth
export const authApi = {
  register: (body: Record<string, unknown>) => api.post('/auth/register', body),
  login: (body: Record<string, unknown>) => api.post('/auth/login', body),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  guestRegister: () => api.post('/auth/guest'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  verifyEmail: (code: string) => api.post('/auth/verify-email', { code }),
  resendVerification: () => api.post('/auth/resend-verification'),
  oauthGoogle: () => `${BASE}/auth/oauth/google`,
};

// Users / Profile
export const usersApi = {
  me: () => api.get<{ id: string; email?: string; username?: string; profile?: Record<string, unknown> }>('/users/me'),
  updateProfile: (body: Record<string, unknown>) => api.patch('/profile', body),
  avatarUploadUrl: () => api.post<{ uploadUrl: string; key: string }>('/profile/avatar/upload-url'),
  confirmAvatar: (key: string) => api.post('/profile/avatar/confirm', { key }),
  checkUsername: (username: string) => api.get(`/users/check-username?username=${encodeURIComponent(username)}`),
  publicProfile: (username: string) => api.get(`/users/${username}`),
};

// Onboarding
export const onboardingApi = {
  state: () => api.get('/onboarding/state'),
  advance: (step: string, data?: unknown) => api.post(`/onboarding/step/${step}`, data),
  placementQuestions: (trackId: string) =>
    api.get<{ questions: Array<{ id: string; text: string; options: string[]; trackId: string }> }>(
      `/onboarding/placement/${trackId}`,
    ),
  submitPlacement: (answers: Array<{ questionId: string; answerIndex: number }>) =>
    api.post('/onboarding/placement', { answers }),
  complete: () => api.post('/onboarding/complete'),
};

// Reference data
export const referenceApi = {
  countries: () =>
    api.get<Array<{ code: string; name: string; callingCode: string; flag: string; continent: string }>>('/reference/countries'),
  languages: () =>
    api.get<Array<{ code: string; name: string; nativeName: string; rtl: boolean }>>('/reference/languages'),
  countryLanguages: (countryCode: string) =>
    api.get<Array<{ code: string; name: string }>>(`/reference/country-languages/${countryCode}`),
};

// Tracks (learning content)
export const tracksApi = {
  list: () => api.get('/tracks'),
  get: (id: string) => api.get(`/tracks/${id}`),
};

// Sessions
export const sessionsApi = {
  list: () => api.get('/sessions'),
  revoke: (id: string) => api.delete(`/sessions/${id}`),
  revokeAll: () => api.delete('/sessions'),
};

// Security events
export const securityApi = {
  events: (cursor?: string) =>
    api.get(`/security/events${cursor ? `?cursor=${cursor}` : ''}`),
};

// Privacy
export const privacyApi = {
  get: () => api.get('/privacy'),
  update: (body: Record<string, unknown>) => api.patch('/privacy', body),
  blockedUsers: () => api.get('/privacy/blocked'),
  blockUser: (userId: string) => api.post(`/privacy/block/${userId}`),
  unblockUser: (userId: string) => api.delete(`/privacy/block/${userId}`),
};

// Notification prefs
export const notifApi = {
  get: () => api.get('/notification-prefs'),
  update: (body: Record<string, unknown>) => api.patch('/notification-prefs', body),
};

// Account lifecycle
export const lifecycleApi = {
  deactivate: () => api.post('/account/deactivate'),
  requestDelete: () => api.post('/account/delete'),
  cancelDelete: () => api.post('/account/delete/cancel'),
  requestExport: () => api.post('/account/export'),
};
