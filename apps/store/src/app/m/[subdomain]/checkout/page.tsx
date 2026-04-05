import { CheckoutPageClient } from '@/components/checkout/checkout-page';

/**
 * ── CHECKOUT PAGE (Tenant Subdomain) ──
 * CSR-only checkout with multi-step Address → Shipping → Stripe Elements flow.
 * Edge middleware rewrites store1.60sec.shop/checkout → /m/store1/checkout
 */
export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
