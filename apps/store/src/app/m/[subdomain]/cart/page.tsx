import { CartPageClient } from '@/components/cart/cart-page-client';

/**
 * ── CART PAGE (Tenant Subdomain) ──
 * Same client component as apex domain.
 * Edge middleware rewrites store1.60sec.shop/cart → /m/store1/cart
 * so this route file is mandatory for tenant subdomain access.
 */
export default function TenantCartPage() {
  return <CartPageClient />;
}
