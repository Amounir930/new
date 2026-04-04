import { CartPageClient } from '@/components/cart/cart-page-client';

/**
 * ── CART PAGE (Apex Domain) ──
 * Client component — all cart state lives in Zustand (localStorage).
 * No server-side data fetching needed.
 */
export default function CartPage() {
  return <CartPageClient />;
}
