import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// CART SCHEMAS — Zero-Trust Cart Operations
// ═══════════════════════════════════════════════════════════════
// Security Protocol:
// - Client sends ONLY productId, variantId, quantity
// - Server validates against inventory, computes prices
// - Client NEVER sends or trusts price data from frontend
// ═══════════════════════════════════════════════════════════════

/**
 * ADD TO CART SCHEMA
 * Used when user clicks "Add to Cart" on PDP
 */
export const AddToCartSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  variantId: z.string().uuid().nullable().default(null),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be at least 1')
    .max(10000, 'Quantity exceeds maximum allowed'),
});

export type AddToCartDto = z.infer<typeof AddToCartSchema>;

/**
 * UPDATE CART ITEM SCHEMA
 * Used when user updates quantity in cart drawer
 */
export const UpdateCartItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  variantId: z.string().uuid().nullable().default(null),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative')
    .max(10000, 'Quantity exceeds maximum allowed'),
});

export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>;

/**
 * REMOVE CART ITEM SCHEMA
 * Used when user removes item from cart
 */
export const RemoveCartItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  variantId: z.string().uuid().nullable().default(null),
});

export type RemoveCartItemDto = z.infer<typeof RemoveCartItemSchema>;

/**
 * CART SYNC SCHEMA
 * Used to sync entire cart state with server
 * Client sends optimistic state, server validates and returns authoritative state
 */
export const CartItemSyncSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  variantId: z.string().uuid().nullable().default(null),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be at least 1')
    .max(10000, 'Quantity exceeds maximum allowed'),
});

export const CartSyncSchema = z.object({
  items: z
    .array(CartItemSyncSchema)
    .max(100, 'Cart cannot have more than 100 unique items'),
});

export type CartSyncDto = z.infer<typeof CartSyncSchema>;
export type CartItemSyncDto = z.infer<typeof CartItemSyncSchema>;

/**
 * STOCK CHECK SCHEMA
 * Used to verify stock availability before adding to cart
 * Called on-demand (not polling) when user clicks "Add to Cart"
 */
export const StockCheckItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  variantId: z.string().uuid().nullable().default(null),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be at least 1')
    .max(10000, 'Quantity exceeds maximum allowed'),
});

export const StockCheckSchema = z.object({
  items: z
    .array(StockCheckItemSchema)
    .min(1, 'At least one item required for stock check'),
});

export type StockCheckDto = z.infer<typeof StockCheckSchema>;
export type StockCheckItemDto = z.infer<typeof StockCheckItemSchema>;

/**
 * STOCK CHECK RESPONSE SCHEMA
 * Server response for stock verification
 */
export const StockCheckResponseSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().nullable(),
      quantityRequested: z.number(),
      quantityAvailable: z.number(),
      available: z.boolean(),
      minOrderQty: z.number().optional(),
    })
  ),
  allAvailable: z.boolean(),
});

export type StockCheckResponseDto = z.infer<typeof StockCheckResponseSchema>;

/**
 * CART RESPONSE SCHEMA
 * Server response for cart operations
 * ⚠️ ZERO-TRUST: Prices are server-computed, display-only
 */
export const CartItemResponseSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
  quantity: z.number(),
  unitPrice: z.string(), // Server-computed, display-only
  totalPrice: z.string(), // Server-computed, display-only
  productName: z.string(), // Display-only
  imageUrl: z.string().nullable(),
  availableStock: z.number(),
  minOrderQty: z.number().optional(),
});

export const CartResponseSchema = z.object({
  items: z.array(CartItemResponseSchema),
  subtotal: z.string(),
  itemCount: z.number(),
  lastSyncedAt: z.string().datetime(),
});

export type CartItemResponseDto = z.infer<typeof CartItemResponseSchema>;
export type CartResponseDto = z.infer<typeof CartResponseSchema>;
