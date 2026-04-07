'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getCustomerMe } from '@/lib/api';

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

  // Hydration flag — true once client rehydration completes
  isHydrated: boolean;

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

  // Session probe — re-validate auth via HttpOnly cookie
  probeAuthSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      isAuthenticating: false,
      pendingIntent: null,
      isLoginModalOpen: false,
      isHydrated: false,

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

      probeAuthSession: async () => {
        const customer = await getCustomerMe();
        if (customer) {
          set({
            isAuthenticated: true,
            user: {
              id: customer.id,
              email: '',
              firstName: customer.firstName,
              lastName: customer.lastName,
              avatarUrl: customer.avatarUrl,
            },
            isAuthenticating: false,
          });
        } else {
          set({
            isAuthenticated: false,
            user: null,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;
        // SSR no-op storage to satisfy TypeScript/Zustand requirements
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      // Only persist core auth state — exclude UI/transient state
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        isHydrated: true,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Auth hydration error:', error);
        } else if (state) {
          state.isHydrated = true;
          // If we have a persisted auth state, probe the server to validate
          if (state.isAuthenticated) {
            state.probeAuthSession();
          }
        }
      },
    }
  )
);

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
      isHydrated: false,
      setAuthenticated: () => {},
      setUnauthenticated: () => {},
      setAuthenticating: () => {},
      setAuthIntent: () => {},
      getAndClearAuthIntent: () => null,
      openLoginModal: () => {},
      closeLoginModal: () => {},
      probeAuthSession: async () => {},
    };
  }

  return auth;
}

/**
 * ── AUTH SESSION PROBE HOOK ──
 * Probes the /me endpoint on mount to re-validate HttpOnly cookie session.
 * The HttpOnly cookie (cst_tkn) is sent automatically by the browser.
 */
export function useAuthSessionProbe() {
  const auth = useAuthStore();

  if (typeof window === 'undefined') return;
  if (auth.isHydrated && !auth.isAuthenticated) {
    auth.probeAuthSession();
  }
}
