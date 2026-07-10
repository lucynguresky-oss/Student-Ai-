'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usersApi, authApi, LearnixApiError } from './api';

export interface User {
  id: string;
  email?: string;
  username?: string;
  isGuest: boolean;
  onboardingComplete: boolean;
  profile?: {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    country?: string;
    language?: string;
  };
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  error: null,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    try {
      setError(null);
      const data = await usersApi.me() as User & { onboardingComplete?: boolean; isGuest?: boolean };
      setUser({
        ...data,
        isGuest: data.isGuest ?? false,
        onboardingComplete: data.onboardingComplete ?? false,
      });
    } catch (e) {
      if (e instanceof LearnixApiError && (e.statusCode === 401 || e.statusCode === 403)) {
        setUser(null);
      } else {
        setError('Failed to load user');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, refresh: fetchMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useUser() {
  const { user, loading } = useAuth();
  return { user, loading, isLoggedIn: !!user && !user.isGuest };
}
