import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// CHECKOUT SCHEMAS — Zero-Trust Order Creation (Store-#06)
// ═══════════════════════════════════════════════════════════════
// Security Protocol:
// - Client sends ONLY productId, variantId, quantity, address
// - Server validates against DB, computes ALL prices
// - Client NEVER sends or trusts price data from frontend
// ═══════════════════════════════════════════════════════════════

/**
 * Shipping method enum matching operational rates
 */
export const ShippingMethodSchema = z.enum(
  ['standard', 'express', 'overnight'],
  {
    errorMap: () => ({ message: 'Invalid shipping method' }),
  }
);

export type ShippingMethod = z.infer<typeof ShippingMethodSchema>;

/**
 * Address schema — matches storefront.orders shipping_address/billing_address jsonb
 */
export const CheckoutAddressSchema = z.object({
  name: z
    .string()
    .min(1, 'Recipient name is required')
    .max(255, 'Name cannot exceed 255 characters'),

  line1: z
    .string()
    .min(1, 'Address line 1 is required')
    .max(255, 'Address line 1 cannot exceed 255 characters'),

  line2: z
    .string()
    .max(255, 'Address line 2 cannot exceed 255 characters')
    .nullable()
    .optional(),

  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City cannot exceed 100 characters'),

  state: z
    .string()
    .max(100, 'State cannot exceed 100 characters')
    .nullable()
    .optional(),

  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .max(20, 'Postal code cannot exceed 20 characters'),

  country: z
    .string()
    .length(2, 'Country code must be 2 characters')
    .toUpperCase()
    .regex(
      /^[A-Z]{2}$/,
      'Country must be ISO 3166-1 alpha-2 format (e.g., US, SA)'
    ),

  phone: z
    .string()
    .max(20, 'Phone number cannot exceed 20 characters')
    .nullable()
    .optional(),
});

export type CheckoutAddress = z.infer<typeof CheckoutAddressSchema>;

/**
 * Cart item reference for checkout — ONLY product refs, no prices.
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
 * Payment method enum — matches DB payment_method enum
 */
export const CheckoutPaymentMethodSchema = z.enum(
  ['card', 'cod', 'wallet', 'bnpl'],
  {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }
);

export type CheckoutPaymentMethod = z.infer<typeof CheckoutPaymentMethodSchema>;

/**
 * Create checkout (order) schema
 * Maps to storefront.orders + storefront.order_items columns.
 */
export const CreateCheckoutSchema = z.object({
  idempotencyKey: z
    .string()
    .max(100, 'Idempotency key cannot exceed 100 characters'),

  shippingAddress: CheckoutAddressSchema,
  billingAddress: CheckoutAddressSchema.optional(),
  sameAsShipping: z.boolean().default(true),

  shippingMethod: ShippingMethodSchema,

  paymentMethod: CheckoutPaymentMethodSchema,

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
