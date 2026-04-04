import { z } from 'zod';

export * from './storefront/blueprint.schema';
export * from './storefront/cart.schema';
export * from './storefront/category.schema';
export * from './storefront/customer.schema';
export * from './storefront/order.schema';
export * from './storefront/product.schema';
export * from './storefront/review.schema';
export * from './storefront/tenant-config.schema';

/**
 * Platform Industry Niches (S2.5)
 * Centralized Enum — MUST match public.niche_type PostgreSQL enum (9 values).
 * Single source of truth after enum consolidation (tenant_niche eradicated).
 */
export const NICHE_TYPES = [
  'retail',
  'wellness',
  'education',
  'services',
  'hospitality',
  'real_estate',
  'creative',
  'food',
  'digital',
] as const;

export const NicheSchema = z.enum(NICHE_TYPES, {
  errorMap: () => ({
    message: `Industry must be one of: ${NICHE_TYPES.join(', ')}`,
  }),
});

export type NicheType = z.infer<typeof NicheSchema>;
