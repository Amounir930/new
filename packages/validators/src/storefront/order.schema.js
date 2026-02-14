/**
 * Order Schema
 *
 * Order and order item validation schemas.
 *
 * @module @apex/validators/storefront/order
 */
import { z } from 'zod';
/**
 * Order Status Enum
 */
export const OrderStatusSchema = z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], {
    errorMap: () => ({ message: 'Invalid order status' }),
});
/**
 * Payment Status Enum
 */
export const PaymentStatusSchema = z.enum(['pending', 'paid', 'failed', 'refunded'], {
    errorMap: () => ({ message: 'Invalid payment status' }),
});
/**
 * Payment Method Enum
 */
export const PaymentMethodSchema = z.enum(['card', 'cod', 'wallet', 'bnpl'], {
    errorMap: () => ({ message: 'Invalid payment method' }),
});
/**
 * Address Schema
 */
export const AddressSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(255, 'Name cannot exceed 255 characters'),
    line1: z
        .string()
        .min(1, 'Address line 1 is required')
        .max(255, 'Address line 1 cannot exceed 255 characters'),
    line2: z
        .string()
        .max(255, 'Address line 2 cannot exceed 255 characters')
        .nullable(),
    city: z
        .string()
        .min(1, 'City is required')
        .max(100, 'City cannot exceed 100 characters'),
    state: z.string().max(100, 'State cannot exceed 100 characters').nullable(),
    postalCode: z
        .string()
        .min(1, 'Postal code is required')
        .max(20, 'Postal code cannot exceed 20 characters'),
    country: z
        .string()
        .length(2, 'Country code must be 2 characters')
        .toUpperCase()
        .regex(/^[A-Z]{2}$/, 'Country must be ISO 3166-1 alpha-2 format (e.g., US, SA)'),
    phone: z
        .string()
        .max(20, 'Phone number cannot exceed 20 characters')
        .nullable(),
});
/**
 * Order Item Schema
 */
export const OrderItemSchema = z.object({
    productId: z.string().uuid('Product ID must be a valid UUID'),
    name: z.string().min(1, 'Product name is required'),
    sku: z.string().min(1, 'SKU is required'),
    price: z
        .number()
        .positive('Price must be positive')
        .finite('Price must be a finite number'),
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .positive('Quantity must be at least 1'),
    imageUrl: z.string().url('Invalid image URL').nullable(),
});
/**
 * Order Schema
 */
export const OrderSchema = z.object({
    id: z.string().uuid('Order ID must be a valid UUID'),
    orderNumber: z
        .string()
        .min(1, 'Order number is required')
        .max(50, 'Order number cannot exceed 50 characters')
        .regex(/^[A-Z0-9-]+$/, 'Order number must contain only uppercase letters, numbers, and hyphens'),
    tenantId: z.string().uuid('Tenant ID must be a valid UUID'),
    customerId: z.string().uuid('Customer ID must be a valid UUID'),
    status: OrderStatusSchema,
    items: z
        .array(OrderItemSchema)
        .min(1, 'Order must contain at least one item'),
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
        .positive('Total must be positive')
        .finite('Total must be a finite number'),
    currency: z
        .string()
        .length(3, 'Currency code must be 3 characters')
        .toUpperCase()
        .regex(/^[A-Z]{3}$/, 'Currency must be ISO 4217 format'),
    // ═══════════════════════════════════════════════════════════
    // Addresses
    // ═══════════════════════════════════════════════════════════
    shippingAddress: AddressSchema,
    billingAddress: AddressSchema,
    // ═══════════════════════════════════════════════════════════
    // Payment
    // ═══════════════════════════════════════════════════════════
    paymentMethod: PaymentMethodSchema,
    paymentStatus: PaymentStatusSchema,
    // ═══════════════════════════════════════════════════════════
    // Tracking
    // ═══════════════════════════════════════════════════════════
    trackingNumber: z
        .string()
        .max(100, 'Tracking number cannot exceed 100 characters')
        .nullable(),
    trackingUrl: z.string().url('Invalid tracking URL').nullable(),
    // ═══════════════════════════════════════════════════════════
    // Timestamps
    // ═══════════════════════════════════════════════════════════
    createdAt: z.string().datetime({ message: 'Invalid datetime format' }),
    updatedAt: z.string().datetime({ message: 'Invalid datetime format' }),
    shippedAt: z
        .string()
        .datetime({ message: 'Invalid datetime format' })
        .nullable(),
    deliveredAt: z
        .string()
        .datetime({ message: 'Invalid datetime format' })
        .nullable(),
});
/**
 * Create order schema (for checkout)
 */
export const CreateOrderSchema = z.object({
    shippingAddress: AddressSchema,
    billingAddress: AddressSchema.optional(),
    paymentMethod: PaymentMethodSchema,
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});
//# sourceMappingURL=order.schema.js.map