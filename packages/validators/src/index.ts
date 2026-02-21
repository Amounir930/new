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
 * Centralized Enum to enforce strict industry-based logic and SDUI theme matching.
 */
export const NICHE_TYPES = [
  'retail',
  'wellness',
  'professional',
  'food',
  'education',
  'real_estate',
  'events',
] as const;

export const NicheSchema = z.enum(NICHE_TYPES, {
  errorMap: () => ({
    message: `Industry must be one of: ${NICHE_TYPES.join(', ')}`,
  }),
});

export type NicheType = z.infer<typeof NicheSchema>;
