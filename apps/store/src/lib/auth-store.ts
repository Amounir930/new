'use client';

import { create } from 'zustand';

// ═══════════════════════════════════════════════════════════════
// AUTH INTENT — stores the action to execute after login
// ═══════════════════════════════════════════════════════════════

export type AuthIntentAction =
  | 'add_to_cart'
  | 'write_review'
  | 'checkout'
  | 'wishlist';

export interface AuthIntent {
  action: AuthIntentAction;
  payload: Record<string, unknown>;
}

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface AuthState {
  // Core state
  isAuthenticated: boolean;
  user: AuthUser | null;
  isAuthenticating: boolean;

  // Intent queue
  pendingIntent: AuthIntent | null;

  // Modal control
  isLoginModalOpen: boolean;

  // Actions
  setAuthenticated: (
    user: AuthUser,
    options?: { clearIntent?: boolean }
  ) => void;
  setUnauthenticated: () => void;
  setAuthenticating: (loading: boolean) => void;

  // Intent management
  setAuthIntent: (intent: AuthIntent) => void;
  getAndClearAuthIntent: () => AuthIntent | null;

  // Modal control
  openLoginModal: (intent?: AuthIntent) => void;
  closeLoginModal: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  isAuthenticating: false,
  pendingIntent: null,
  isLoginModalOpen: false,

  setAuthenticated: (user, options) => {
    set({
      isAuthenticated: true,
      user,
      isAuthenticating: false,
      ...(options?.clearIntent ? { pendingIntent: null } : {}),
    });
  },

  setUnauthenticated: () => {
    set({
      isAuthenticated: false,
      user: null,
      isAuthenticating: false,
    });
  },

  setAuthenticating: (loading) => {
    set({ isAuthenticating: loading });
  },

  setAuthIntent: (intent) => {
    set({ pendingIntent: intent });
  },

  getAndClearAuthIntent: () => {
    const { pendingIntent } = get();
    set({ pendingIntent: null });
    return pendingIntent;
  },

  openLoginModal: (intent) => {
    if (intent) set({ pendingIntent: intent });
    set({ isLoginModalOpen: true });
  },

  closeLoginModal: () => {
    set({ isLoginModalOpen: false });
  },
}));

/**
 * ── HYDRATION-SAFE HOOK ──
 * Returns auth state only on client to prevent SSR mismatch.
 */
export function useMountedAuth() {
  const auth = useAuthStore();
  const isMounted = typeof window !== 'undefined';

  if (!isMounted) {
    return {
      isAuthenticated: false,
      user: null,
      isAuthenticating: false,
      pendingIntent: null,
      isLoginModalOpen: false,
      setAuthenticated: () => {},
      setUnauthenticated: () => {},
      setAuthenticating: () => {},
      setAuthIntent: () => {},
      getAndClearAuthIntent: () => null,
      openLoginModal: () => {},
      closeLoginModal: () => {},
    };
  }

  return auth;
}

/**
 * ── QUICK CHECK HOOK ──
 * Returns true if the cst_tkn cookie exists (client-side only).
 */
export function useHasAuthCookie(): boolean {
  if (typeof window === 'undefined') return false;
  return document.cookie.includes('cst_tkn=');
}
