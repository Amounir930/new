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
export declare const OrderStatusSchema: z.ZodEnum<["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
/**
 * Payment Status Enum
 */
export declare const PaymentStatusSchema: z.ZodEnum<["pending", "paid", "failed", "refunded"]>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
/**
 * Payment Method Enum
 */
export declare const PaymentMethodSchema: z.ZodEnum<["card", "cod", "wallet", "bnpl"]>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
/**
 * Address Schema
 */
export declare const AddressSchema: z.ZodObject<{
    name: z.ZodString;
    line1: z.ZodString;
    line2: z.ZodNullable<z.ZodString>;
    city: z.ZodString;
    state: z.ZodNullable<z.ZodString>;
    postalCode: z.ZodString;
    country: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    country: string;
}, {
    name: string;
    phone: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    country: string;
}>;
export type Address = z.infer<typeof AddressSchema>;
/**
 * Order Item Schema
 */
export declare const OrderItemSchema: z.ZodObject<{
    productId: z.ZodString;
    name: z.ZodString;
    sku: z.ZodString;
    price: z.ZodNumber;
    quantity: z.ZodNumber;
    imageUrl: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    price: number;
    productId: string;
    sku: string;
    quantity: number;
    imageUrl: string | null;
}, {
    name: string;
    price: number;
    productId: string;
    sku: string;
    quantity: number;
    imageUrl: string | null;
}>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
/**
 * Order Schema
 */
export declare const OrderSchema: z.ZodObject<{
    id: z.ZodString;
    orderNumber: z.ZodString;
    tenantId: z.ZodString;
    customerId: z.ZodString;
    status: z.ZodEnum<["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        name: z.ZodString;
        sku: z.ZodString;
        price: z.ZodNumber;
        quantity: z.ZodNumber;
        imageUrl: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        price: number;
        productId: string;
        sku: string;
        quantity: number;
        imageUrl: string | null;
    }, {
        name: string;
        price: number;
        productId: string;
        sku: string;
        quantity: number;
        imageUrl: string | null;
    }>, "many">;
    subtotal: z.ZodNumber;
    discount: z.ZodNumber;
    shipping: z.ZodNumber;
    tax: z.ZodNumber;
    total: z.ZodNumber;
    currency: z.ZodString;
    shippingAddress: z.ZodObject<{
        name: z.ZodString;
        line1: z.ZodString;
        line2: z.ZodNullable<z.ZodString>;
        city: z.ZodString;
        state: z.ZodNullable<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    }, {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    }>;
    billingAddress: z.ZodObject<{
        name: z.ZodString;
        line1: z.ZodString;
        line2: z.ZodNullable<z.ZodString>;
        city: z.ZodString;
        state: z.ZodNullable<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    }, {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    }>;
    paymentMethod: z.ZodEnum<["card", "cod", "wallet", "bnpl"]>;
    paymentStatus: z.ZodEnum<["pending", "paid", "failed", "refunded"]>;
    trackingNumber: z.ZodNullable<z.ZodString>;
    trackingUrl: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    shippedAt: z.ZodNullable<z.ZodString>;
    deliveredAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    currency: string;
    createdAt: string;
    updatedAt: string;
    status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
    tenantId: string;
    customerId: string;
    items: {
        name: string;
        price: number;
        productId: string;
        sku: string;
        quantity: number;
        imageUrl: string | null;
    }[];
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    orderNumber: string;
    shippingAddress: {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    };
    billingAddress: {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    };
    paymentMethod: "card" | "cod" | "wallet" | "bnpl";
    paymentStatus: "pending" | "refunded" | "paid" | "failed";
    trackingNumber: string | null;
    trackingUrl: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
}, {
    id: string;
    currency: string;
    createdAt: string;
    updatedAt: string;
    status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
    tenantId: string;
    customerId: string;
    items: {
        name: string;
        price: number;
        productId: string;
        sku: string;
        quantity: number;
        imageUrl: string | null;
    }[];
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    orderNumber: string;
    shippingAddress: {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    };
    billingAddress: {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    };
    paymentMethod: "card" | "cod" | "wallet" | "bnpl";
    paymentStatus: "pending" | "refunded" | "paid" | "failed";
    trackingNumber: string | null;
    trackingUrl: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
}>;
export type Order = z.infer<typeof OrderSchema>;
/**
 * Create order schema (for checkout)
 */
export declare const CreateOrderSchema: z.ZodObject<{
    shippingAddress: z.ZodObject<{
        name: z.ZodString;
        line1: z.ZodString;
        line2: z.ZodNullable<z.ZodString>;
        city: z.ZodString;
        state: z.ZodNullable<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    }, {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    }>;
    billingAddress: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        line1: z.ZodString;
        line2: z.ZodNullable<z.ZodString>;
        city: z.ZodString;
        state: z.ZodNullable<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
        phone: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    }, {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    }>>;
    paymentMethod: z.ZodEnum<["card", "cod", "wallet", "bnpl"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    shippingAddress: {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    };
    paymentMethod: "card" | "cod" | "wallet" | "bnpl";
    billingAddress?: {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    } | undefined;
    notes?: string | undefined;
}, {
    shippingAddress: {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    };
    paymentMethod: "card" | "cod" | "wallet" | "bnpl";
    billingAddress?: {
        name: string;
        phone: string | null;
        line1: string;
        line2: string | null;
        city: string;
        state: string | null;
        postalCode: string;
        country: string;
    } | undefined;
    notes?: string | undefined;
}>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
//# sourceMappingURL=order.schema.d.ts.map