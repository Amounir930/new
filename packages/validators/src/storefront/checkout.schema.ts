/**
 * Checkout Schema
 *
 * Zero-trust checkout validation schemas.
 * All pricing is recalculated server-side from the DB.
 *
 * @module @apex/validators/storefront/checkout
 */

import { z } from 'zod';
import { AddressSchema, PaymentMethodSchema } from './order.schema';

/**
 * Shipping method enum matching DB operational rates
 */
export const ShippingMethodSchema = z.enum(
  ['standard', 'express', 'overnight'],
  {
    errorMap: () => ({ message: 'Invalid shipping method' }),
  }
);

export type ShippingMethod = z.infer<typeof ShippingMethodSchema>;

/**
 * Cart item reference for checkout submission
 * Client sends ONLY productId, variantId, quantity — never prices.
 */
export const CheckoutCartItemSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  variantId: z
    .string()
    .uuid('Variant ID must be a valid UUID')
    .nullable()
    .optional(),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(999, 'Quantity cannot exceed 999'),
});

export type CheckoutCartItem = z.infer<typeof CheckoutCartItemSchema>;

/**
 * Create checkout (order) schema
 * Maps to storefront.orders + storefront.order_items columns.
 */
export const CreateCheckoutSchema = z.object({
  idempotencyKey: z
    .string()
    .max(100, 'Idempotency key cannot exceed 100 characters'),

  shippingAddress: AddressSchema,
  billingAddress: AddressSchema.optional(),
  sameAsShipping: z.boolean().default(true),

  shippingMethod: ShippingMethodSchema,

  paymentMethod: PaymentMethodSchema,

  cartItems: z
    .array(CheckoutCartItemSchema)
    .min(1, 'Cart must contain at least one item')
    .max(50, 'Cart cannot exceed 50 line items'),

  notes: z
    .string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional()
    .nullable(),

  guestEmail: z
    .string()
    .email('Invalid email address')
    .max(255)
    .optional()
    .nullable(),
});

export type CreateCheckout = z.infer<typeof CreateCheckoutSchema>;
