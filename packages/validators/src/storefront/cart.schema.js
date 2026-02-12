/**
 * Cart Schema
 *
 * Shopping cart and cart item validation schemas.
 *
 * @module @apex/validators/storefront/cart
 */
import { z } from 'zod';
/**
 * Cart Item Schema
 */
export const CartItemSchema = z.object({
    productId: z.string().uuid('Product ID must be a valid UUID'),
    variantId: z.string().uuid('Variant ID must be a valid UUID').nullable(),
    name: z
        .string()
        .min(1, 'Product name is required')
        .max(255, 'Product name cannot exceed 255 characters'),
    sku: z
        .string()
        .min(1, 'SKU is required')
        .max(100, 'SKU cannot exceed 100 characters'),
    price: z
        .number()
        .positive('Price must be positive')
        .finite('Price must be a finite number'),
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .positive('Quantity must be at least 1')
        .max(999, 'Quantity cannot exceed 999'),
    imageUrl: z.string().url('Invalid image URL').nullable(),
    attributes: z
        .record(z.string(), z.string())
        .optional()
        .describe('Selected variant attributes'),
});
/**
 * Coupon Schema
 */
export const AppliedCouponSchema = z.object({
    code: z
        .string()
        .min(1, 'Coupon code is required')
        .max(50, 'Coupon code cannot exceed 50 characters')
        .toUpperCase(),
    discountAmount: z
        .number()
        .min(0, 'Discount amount cannot be negative')
        .finite('Discount amount must be a finite number'),
    discountType: z.enum(['percentage', 'fixed'], {
        errorMap: () => ({
            message: 'Discount type must be "percentage" or "fixed"',
        }),
    }),
});
/**
 * Cart Schema
 */
export const CartSchema = z.object({
    id: z.string().uuid('Cart ID must be a valid UUID'),
    tenantId: z.string().uuid('Tenant ID must be a valid UUID'),
    customerId: z
        .string()
        .uuid('Customer ID must be a valid UUID')
        .nullable()
        .describe('Null for guest carts'),
    items: z.array(CartItemSchema).min(0, 'Cart items must be an array'),
    // ═══════════════════════════════════════════════════════════
    // Totals
    // ═══════════════════════════════════════════════════════════
    subtotal: z
        .number()
        .min(0, 'Subtotal cannot be negative')
        .finite('Subtotal must be a finite number'),
    discount: z
        .number()
        .min(0, 'Discount cannot be negative')
        .finite('Discount must be a finite number'),
    shipping: z
        .number()
        .min(0, 'Shipping cost cannot be negative')
        .finite('Shipping cost must be a finite number'),
    tax: z
        .number()
        .min(0, 'Tax cannot be negative')
        .finite('Tax must be a finite number'),
    total: z
        .number()
        .min(0, 'Total cannot be negative')
        .finite('Total must be a finite number'),
    // ═══════════════════════════════════════════════════════════
    // Coupons
    // ═══════════════════════════════════════════════════════════
    appliedCoupons: z.array(AppliedCouponSchema),
    currency: z
        .string()
        .length(3, 'Currency code must be 3 characters')
        .toUpperCase()
        .regex(/^[A-Z]{3}$/, 'Currency must be ISO 4217 format'),
    itemCount: z
        .number()
        .int('Item count must be an integer')
        .min(0, 'Item count cannot be negative'),
    updatedAt: z.string().datetime({ message: 'Invalid datetime format' }),
});
/**
 * Add to cart request schema
 */
export const AddToCartSchema = z.object({
    productId: z.string().uuid('Product ID must be a valid UUID'),
    variantId: z.string().uuid('Variant ID must be a valid UUID').optional(),
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .positive('Quantity must be at least 1')
        .max(999, 'Quantity cannot exceed 999')
        .default(1),
});
/**
 * Update cart item schema
 */
export const UpdateCartItemSchema = z.object({
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .min(0, 'Quantity cannot be negative (use 0 to remove)')
        .max(999, 'Quantity cannot exceed 999'),
});
//# sourceMappingURL=cart.schema.js.map