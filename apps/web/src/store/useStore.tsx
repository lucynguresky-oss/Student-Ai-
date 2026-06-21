'use client';
/**
 * Learnix Global State Store
 * A lightweight Zustand-like store using React Context + localStorage persistence.
 * Provides: auth session, user profile, messaging state, follow graph, liked/saved posts, XP/streak.
 */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/auth-store';
import { getStorageItem, apiFetch } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarSeed: string;
  bio: string;
  curriculum: string;
  level: string;
  subjects: string[];
  followers: number;
  following: number;
  posts: number;
  xp: number;
  streak: number;
  isPremium: boolean;
  isPrivate: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantName: string;
  participantSeed: string;
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
}

interface LearnixStore {
  // Auth
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;

  // Social
  followedUsers: Set<string>;
  toggleFollow: (userId: string) => void;

  // Content engagement
  likedPosts: Set<string>;
  savedPosts: Set<string>;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;

  // Messaging
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  sendMessage: (conversationId: string, text: string) => void;
  markConversationRead: (conversationId: string) => void;

  // XP / Gamification
  xp: number;
  streak: number;
  addXP: (amount: number) => void;

  // Quiz state
  quizScores: Record<string, number>;
  recordQuizScore: (quizId: string, score: number) => void;

  // Notifications
  notifications: Array<{ id: string; text: string; read: boolean; timestamp: number }>;
  markAllNotificationsRead: () => void;
}

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_USER: User = {
  id: 'caf96cc8-5176-42b1-af57-666fde63f443', // DB Amina Wanjiku
  username: 'amina_learns',
  displayName: 'Amina Wanjiku',
  avatarSeed: 'amina',
  bio: 'Form 4 · KCSE 2026 🇰🇪\nFuture Engineer 🚀 | Biology & Maths nerd',
  curriculum: 'KCSE',
  level: 'Form 4',
  subjects: ['BIO', 'CHE', 'PHY', 'MAT', 'ENG'],
  followers: 901,
  following: 1711,
  posts: 2,
  xp: 2840,
  streak: 15,
  isPremium: false,
  isPrivate: true,
};

const MOCK_CONVERSATIONS: Conversation[] = [];

const MOCK_MESSAGES: Record<string, Message[]> = {};

const MOCK_NOTIFICATIONS: Array<{ id: string; text: string; read: boolean; timestamp: number }> = [];

// ─── Context ─────────────────────────────────────────────────────────────────
const StoreContext = createContext<LearnixStore | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`learnix_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(`learnix_${key}`, JSON.stringify(value)); } catch { /* ignore */ }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const authUser = useAuthStore((state) => state.currentUser);
  const authLogout = useAuthStore((state) => state.logout);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const socketRef = useRef<Socket | null>(null);

  // Sync state with authUser
  useEffect(() => {
    if (authUser) {
      setCurrentUser({
        id: authUser.id,
        username: authUser.username || '',
        displayName: authUser.displayName || '',
        avatarSeed: (authUser.username || 'default').split('.')[0] || 'default',
        bio: authUser.username === 'amara.otieno'
          ? 'Form 4 · KCSE 2026 🇰🇪\nFuture Engineer 🚀 | Biology & Maths nerd'
          : authUser.username === 'brian.codes'
          ? 'Form 3 · KCSE 2025 🇰🇪\nCoding & Physics enthusiast 💻'
          : 'Learnix Educator & Creator 🎓',
        curriculum: 'KCSE',
        level: authUser.username === 'brian.codes' ? 'Form 3' : 'Form 4',
        subjects: authUser.username === 'brian.codes' ? ['PHY', 'MAT', 'ENG'] : ['BIO', 'CHE', 'MAT', 'ENG'],
        followers: authUser.username === 'amara.otieno' ? 901 : 124,
        following: authUser.username === 'amara.otieno' ? 1711 : 452,
        posts: authUser.username === 'amara.otieno' ? 2 : 0,
        xp: (authUser as any).xp || 0,
        streak: (authUser as any).streak || 0,
        isPremium: false,
        isPrivate: false,
      });
      setXp((authUser as any).xp || 0);
      setStreak((authUser as any).streak || 0);
    } else {
      setCurrentUser(null);
      setXp(0);
      setStreak(0);
    }
  }, [authUser]);

  // Hydrate other local preferences and load API conversations
  useEffect(() => {
    const liked = loadFromStorage<string[]>('likedPosts', []);
    const saved = loadFromStorage<string[]>('savedPosts', []);
    const followed = loadFromStorage<string[]>('followedUsers', []);
    const scores = loadFromStorage<Record<string, number>>('quizScores', {});
    setLikedPosts(new Set(liked));
    setSavedPosts(new Set(saved));
    setFollowedUsers(new Set(followed));
    setQuizScores(scores);

    if (authUser) {
      // Fetch conversations from API using apiFetch
      apiFetch(`/messages/conversations?userId=${authUser.id}`)
        .then((res: any) => {
          const data = res.data;
          if (Array.isArray(data) && data.length > 0) {
            const mapped: Conversation[] = data.map((c: any) => {
              const other = c.participants?.find((p: any) => p.userId !== authUser.id);
              const otherProfile = other?.user?.profile;
              const lastMsg = c.messages?.[0];
              return {
                id: c.id,
                participantIds: c.participants?.map((p: any) => p.userId) ?? [],
                participantName: otherProfile?.displayName ?? 'User',
                participantSeed: otherProfile?.username ?? 'default',
                lastMessage: lastMsg?.body ?? '',
                lastTimestamp: lastMsg ? new Date(lastMsg.createdAt).getTime() : Date.now(),
                unreadCount: 0,
              };
            });
            setConversations(mapped);

            // Fetch messages for each conversation using apiFetch
            mapped.forEach((conv) => {
              apiFetch(`/messages/${conv.id}`)
                .then((resMsgs: any) => {
                  const msgs = resMsgs.data;
                  if (Array.isArray(msgs)) {
                    const parsed: Message[] = msgs.map((m: any) => ({
                      id: m.id,
                      conversationId: m.conversationId,
                      senderId: m.senderId,
                      text: m.body,
                      timestamp: new Date(m.createdAt).getTime(),
                      read: true,
                    }));
                    setMessages((prev) => ({ ...prev, [conv.id]: parsed }));
                  }
                })
                .catch(() => { /* keep mock */ });
            });
          }
        })
        .catch(() => { /* keep mock */ });
    }
  }, [authUser]);

  // WebSockets Setup
  useEffect(() => {
    if (!currentUser) {
      socketRef.current?.disconnect();
      return;
    }

    const socket = io('http://localhost:4001', {
      query: { userId: currentUser.id },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Messages WebSocket', socket.id);
      // Join existing conversations rooms
      conversations.forEach(c => socket.emit('joinConversation', { conversationId: c.id }));
    });

    socket.on('newMessage', (msg: any) => {
      const parsedMsg: Message = {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        text: msg.body,
        timestamp: new Date(msg.createdAt).getTime(),
        read: msg.senderId === currentUser.id,
      };

      setMessages(prev => {
        // Prevent duplicate insertion
        const existing = prev[parsedMsg.conversationId] ?? [];
        if (existing.some(m => m.id === parsedMsg.id)) return prev;
        return {
          ...prev,
          [parsedMsg.conversationId]: [...existing, parsedMsg],
        };
      });

      setConversations(prev =>
        prev.map(c => c.id === parsedMsg.conversationId ? { 
          ...c, 
          lastMessage: parsedMsg.text, 
          lastTimestamp: parsedMsg.timestamp, 
          unreadCount: parsedMsg.senderId === currentUser.id ? c.unreadCount : c.unreadCount + 1 
        } : c)
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser, conversations.length]); // Re-bind on conversations length change so we join new rooms

  const login = useCallback(async (user: User) => {
    try {
      const res = await apiFetch('/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: user.displayName,
          username: user.username,
          bio: user.bio,
          curriculum: user.curriculum,
          level: user.level,
          subjects: user.subjects,
        }),
      });
      const updatedProfile = res.data;
      
      // Update state in Zustand auth store
      const authState = useAuthStore.getState();
      if (authState.currentUser) {
        authState.addAccount({
          ...authState.currentUser,
          username: updatedProfile.username,
          displayName: updatedProfile.displayName,
          avatarUrl: updatedProfile.avatarUrl,
        });
      }
    } catch (err) {
      console.error('Failed to update profile in DB:', err);
    }
  }, []);

  const logout = useCallback(() => {
    authLogout();
  }, [authLogout]);

  const toggleFollow = useCallback((userId: string) => {
    setFollowedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      saveToStorage('followedUsers', [...next]);
      return next;
    });
  }, []);

  const toggleLike = useCallback((postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      saveToStorage('likedPosts', [...next]);
      return next;
    });
  }, []);

  const toggleSave = useCallback((postId: string) => {
    setSavedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      saveToStorage('savedPosts', [...next]);
      return next;
    });
  }, []);

  const sendMessage = useCallback((conversationId: string, text: string) => {
    // Emit via WebSocket
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendMessage', {
        senderId: currentUser?.id ?? 'u_amina',
        conversationId,
        body: text,
      });
    }

    // Optimistic UI update
    const newMsg: Message = {
      id: `m_opt_${Date.now()}`,
      conversationId,
      senderId: currentUser?.id ?? 'u_amina',
      text,
      timestamp: Date.now(),
      read: true,
    };
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] ?? []), newMsg],
    }));
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, lastMessage: text, lastTimestamp: Date.now(), unreadCount: 0 } : c)
    );
  }, [currentUser]);

  const markConversationRead = useCallback((conversationId: string) => {
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] ?? []).map(m => ({ ...m, read: true })),
    }));
  }, []);

  const addXP = useCallback((amount: number) => {
    setXp(prev => {
      const next = prev + amount;
      saveToStorage('xp', next);
      return next;
    });
  }, []);

  const recordQuizScore = useCallback((quizId: string, score: number) => {
    setQuizScores(prev => {
      const next = { ...prev, [quizId]: Math.max(prev[quizId] ?? 0, score) };
      saveToStorage('quizScores', next);
      return next;
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const value: LearnixStore = {
    currentUser,
    isLoggedIn: !!currentUser,
    login, logout,
    followedUsers, toggleFollow,
    likedPosts, savedPosts, toggleLike, toggleSave,
    conversations, messages, sendMessage, markConversationRead,
    xp, streak, addXP,
    quizScores, recordQuizScore,
    notifications, markAllNotificationsRead,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): LearnixStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
