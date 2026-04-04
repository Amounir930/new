'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { extractTenantFromHost } from '@/lib/api';

// ═══════════════════════════════════════════════════════════════
// ZERO-TRUST CART STATE
// ═══════════════════════════════════════════════════════════════
// Client state contains ONLY productId, variantId, quantity
// Prices are NEVER stored client-side - they are fetched server-side
// ═══════════════════════════════════════════════════════════════

export interface CartItem {
  productId: string; // UUID - server-validated
  variantId: string | null; // UUID - null for non-variant products
  quantity: number; // Positive integer, validated against inventory
}

export interface CartItemServer {
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: string; // Server-computed, display-only
  totalPrice: string; // Server-computed, display-only
  productName: string; // Display-only
  imageUrl: string | null;
  availableStock: number;
  minOrderQty: number;
}

interface CartState {
  // Client-state (optimistic, for UI only)
  items: CartItem[];
  isOpen: boolean;

  // Server-state (source of truth, populated after sync)
  serverItems: CartItemServer[];
  subtotal: string;
  itemCount: number;
  lastSyncedAt: string | null;
  isSyncing: boolean;

  // Actions
  addItem: (
    productId: string,
    variantId: string | null,
    quantity: number
  ) => Promise<void>;
  removeItem: (productId: string, variantId: string | null) => Promise<void>;
  updateQuantity: (
    productId: string,
    variantId: string | null,
    quantity: number
  ) => Promise<void>;
  syncWithServer: () => Promise<void>;
  toggleCart: () => void;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
}

// Generate or retrieve session ID
const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// Get tenant ID from host
const getTenantId = async (): Promise<string> => {
  if (typeof window === 'undefined') return 'public';
  const tenant = await extractTenantFromHost();
  return tenant || 'public';
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      serverItems: [],
      isOpen: false,
      subtotal: '0',
      itemCount: 0,
      lastSyncedAt: null,
      isSyncing: false,

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      clearCart: () => {
        set({
          items: [],
          serverItems: [],
          subtotal: '0',
          itemCount: 0,
          isOpen: false,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cart-storage');
        }
      },

      addItem: async (productId, variantId, quantity) => {
        // Optimistic update (UI only)
        set((state) => {
          const existing = state.items.find(
            (item) =>
              item.productId === productId && item.variantId === variantId
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === productId && item.variantId === variantId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            items: [...state.items, { productId, variantId, quantity }],
          };
        });

        // Sync with server (debounced)
        await get().syncWithServer();
      },

      updateQuantity: async (productId, variantId, quantity) => {
        if (quantity <= 0) {
          return get().removeItem(productId, variantId);
        }

        // Optimistic update
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item
          ),
        }));

        await get().syncWithServer();
      },

      removeItem: async (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.productId === productId && item.variantId === variantId)
          ),
        }));

        await get().syncWithServer();
      },

      refreshCart: async () => {
        try {
          const tenantId = await getTenantId();
          const sessionId = getSessionId();
          const cart = await (await import('@/lib/api')).getCart(
            tenantId,
            sessionId
          );

          set({
            serverItems: cart.items || [],
            subtotal: cart.subtotal || '0',
            itemCount: cart.itemCount || 0,
            lastSyncedAt: cart.lastSyncedAt || new Date().toISOString(),
            // Sync optimistic state with server
            items: (cart.items || []).map((item: CartItemServer) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            })),
          });
        } catch (error) {
          console.error('Cart refresh error:', error);
        }
      },

      syncWithServer: async () => {
        const { items, isSyncing } = get();

        // Prevent concurrent syncs
        if (isSyncing) return;

        // Debounce: Wait 300ms before syncing
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Check if items changed during debounce
        const currentItems = get().items;
        if (JSON.stringify(items) !== JSON.stringify(currentItems)) {
          // Items changed during debounce — another sync will handle it.
          // CRITICAL: We did NOT set isSyncing=true, so no lock to release.
          return;
        }

        // 🔒 Lock AFTER debounce + change check — prevents permanent freeze
        set({ isSyncing: true });

        // Timeout guard: force-unlock after 10s to prevent permanent lock
        const unlockTimeout = setTimeout(() => {
          set({ isSyncing: false });
          console.warn('[Cart] syncWithServer timeout — force unlocked');
        }, 10_000);

        try {
          const tenantId = await getTenantId();
          const sessionId = getSessionId();

          const { syncCart } = await import('@/lib/api');
          const serverCart = await syncCart(tenantId, currentItems, sessionId);

          clearTimeout(unlockTimeout);
          set({
            serverItems: serverCart.items || [],
            subtotal: serverCart.subtotal || '0',
            itemCount: serverCart.itemCount || 0,
            lastSyncedAt: serverCart.lastSyncedAt || new Date().toISOString(),
            isSyncing: false,
          });
        } catch (error) {
          clearTimeout(unlockTimeout);
          console.error('Cart sync error:', error);
          // Revert optimistic update on error
          set((state) => ({
            items: state.serverItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            })),
            isSyncing: false,
          }));
        }
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;
        // SSR No-op storage to satisfy TypeScript/Zustand requirements
        return {
          getItem: () => null,
          setItem: () => { },
          removeItem: () => { },
        };
      }),
      // ⚠️ HYDRATION SAFETY: Only persist client-state, not server-state
      partialize: (state) => ({
        items: state.items,
        isOpen: false, // Don't persist UI state
      }),
      skipHydration: false,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Cart hydration error:', error);
        } else {
          // Trigger server sync after hydration
          state?.syncWithServer();
        }
      },
    }
  )
);

/**
 * ── HYDRATION-SAFE HOOK ──
 * Returns empty state during SSR/hydration to prevent layout shift
 */
export function useMountedCart() {
  const cart = useCartStore();
  const isMounted = typeof window !== 'undefined';

  // Return empty state during SSR/hydration
  if (!isMounted) {
    return {
      items: [],
      serverItems: [],
      subtotal: '0',
      itemCount: 0,
      isOpen: false,
      isSyncing: false,
      lastSyncedAt: null,
      addItem: async () => { },
      removeItem: async () => { },
      updateQuantity: async () => { },
      toggleCart: () => { },
      clearCart: () => { },
      refreshCart: async () => { },
      syncWithServer: async () => { },
    };
  }

  return cart;
}

/**
 * Hook to get cart item count for badge display
 */
export function useCartItemCount() {
  const cart = useCartStore();
  const isMounted = typeof window !== 'undefined';

  if (!isMounted) return 0;

  return (
    cart.itemCount || cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );
}
