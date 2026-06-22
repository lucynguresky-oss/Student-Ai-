const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export function getStorageItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

export function setStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE_URL}${path}`;
  const accessToken = getStorageItem('learnix_access_token');

  const headers = new Headers(options.headers);
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, fetchOptions);

  // Check for 401 Unauthorized and attempt token refresh
  if (response.status === 401 && !path.includes('/auth/refresh') && !path.includes('/auth/login')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshToken = getStorageItem('learnix_refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const resData = await refreshRes.json();
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = resData.data;
            setStorageItem('learnix_access_token', newAccessToken);
            setStorageItem('learnix_refresh_token', newRefreshToken);
            isRefreshing = false;
            onRefreshed(newAccessToken);
          } else {
            isRefreshing = false;
            handleAuthFailure();
            throw new Error('Refresh token invalid');
          }
        } catch (err) {
          isRefreshing = false;
          handleAuthFailure();
          throw err;
        }
      } else {
        handleAuthFailure();
        throw new Error('No refresh token available');
      }
    }

    // Queue subsequent failed requests until token refresh completes
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => {
        headers.set('Authorization', `Bearer ${token}`);
        resolve(
          fetch(url, fetchOptions)
            .then(async (res) => {
              const data = await res.json();
              if (!res.ok) {
                throw new Error(data.error?.message || res.statusText || 'API Request Failed');
              }
              return data;
            })
        );
      });
    });
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || response.statusText || 'API Request Failed');
  }

  return data;
}

function handleAuthFailure() {
  removeStorageItem('learnix_access_token');
  removeStorageItem('learnix_refresh_token');
  removeStorageItem('learnix_current_user');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
