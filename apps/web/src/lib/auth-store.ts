import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getStorageItem, setStorageItem, removeStorageItem } from './api';

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  accessToken: string;
  refreshToken: string;
  avatarUrl?: string | null;
}

interface AuthState {
  currentUser: UserAccount | null;
  accountList: UserAccount[];
  isLoggedIn: boolean;
  addAccount: (account: UserAccount) => void;
  switchAccount: (username: string) => void;
  logout: () => void;
  logoutAll: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      accountList: [],
      isLoggedIn: false,

      addAccount: (account) => {
        const { accountList } = get();
        const exists = accountList.some((acc) => acc.username === account.username);
        
        let newAccountList;
        if (exists) {
          newAccountList = accountList.map((acc) =>
            acc.username === account.username ? account : acc
          );
        } else {
          newAccountList = [...accountList, account];
        }

        // Save tokens to localStorage for apiFetch to read
        setStorageItem('learnix_access_token', account.accessToken);
        setStorageItem('learnix_refresh_token', account.refreshToken);
        setStorageItem('learnix_current_user', JSON.stringify(account));

        set({
          currentUser: account,
          accountList: newAccountList,
          isLoggedIn: true,
        });
      },

      switchAccount: (username) => {
        const { accountList } = get();
        const account = accountList.find((acc) => acc.username === username);
        if (!account) return;

        // Update active tokens
        setStorageItem('learnix_access_token', account.accessToken);
        setStorageItem('learnix_refresh_token', account.refreshToken);
        setStorageItem('learnix_current_user', JSON.stringify(account));

        set({
          currentUser: account,
          isLoggedIn: true,
        });

        // Trigger page refresh to reload context and websocket connections
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      },

      logout: () => {
        const { currentUser, accountList } = get();
        if (!currentUser) return;

        const newAccountList = accountList.filter((acc) => acc.username !== currentUser.username);

        removeStorageItem('learnix_access_token');
        removeStorageItem('learnix_refresh_token');
        removeStorageItem('learnix_current_user');

        if (newAccountList.length > 0) {
          const nextAccount = newAccountList[0]!;
          setStorageItem('learnix_access_token', nextAccount.accessToken);
          setStorageItem('learnix_refresh_token', nextAccount.refreshToken);
          setStorageItem('learnix_current_user', JSON.stringify(nextAccount));

          set({
            currentUser: nextAccount,
            accountList: newAccountList,
            isLoggedIn: true,
          });

          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        } else {
          set({
            currentUser: null,
            accountList: [],
            isLoggedIn: false,
          });
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      },

      logoutAll: () => {
        removeStorageItem('learnix_access_token');
        removeStorageItem('learnix_refresh_token');
        removeStorageItem('learnix_current_user');

        set({
          currentUser: null,
          accountList: [],
          isLoggedIn: false,
        });

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },
    }),
    {
      name: 'learnix-auth-store', // key for localStorage
    }
  )
);
