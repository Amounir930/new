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
export declare const CartItemSchema: z.ZodObject<{
    productId: z.ZodString;
    variantId: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    sku: z.ZodString;
    price: z.ZodNumber;
    quantity: z.ZodNumber;
    imageUrl: z.ZodNullable<z.ZodString>;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    price: number;
    productId: string;
    variantId: string | null;
    sku: string;
    quantity: number;
    imageUrl: string | null;
    attributes?: Record<string, string> | undefined;
}, {
    name: string;
    price: number;
    productId: string;
    variantId: string | null;
    sku: string;
    quantity: number;
    imageUrl: string | null;
    attributes?: Record<string, string> | undefined;
}>;
export type CartItem = z.infer<typeof CartItemSchema>;
/**
 * Coupon Schema
 */
export declare const AppliedCouponSchema: z.ZodObject<{
    code: z.ZodString;
    discountAmount: z.ZodNumber;
    discountType: z.ZodEnum<["percentage", "fixed"]>;
}, "strip", z.ZodTypeAny, {
    code: string;
    discountAmount: number;
    discountType: "fixed" | "percentage";
}, {
    code: string;
    discountAmount: number;
    discountType: "fixed" | "percentage";
}>;
export type AppliedCoupon = z.infer<typeof AppliedCouponSchema>;
/**
 * Cart Schema
 */
export declare const CartSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    customerId: z.ZodNullable<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        variantId: z.ZodNullable<z.ZodString>;
        name: z.ZodString;
        sku: z.ZodString;
        price: z.ZodNumber;
        quantity: z.ZodNumber;
        imageUrl: z.ZodNullable<z.ZodString>;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        price: number;
        productId: string;
        variantId: string | null;
        sku: string;
        quantity: number;
        imageUrl: string | null;
        attributes?: Record<string, string> | undefined;
    }, {
        name: string;
        price: number;
        productId: string;
        variantId: string | null;
        sku: string;
        quantity: number;
        imageUrl: string | null;
        attributes?: Record<string, string> | undefined;
    }>, "many">;
    subtotal: z.ZodNumber;
    discount: z.ZodNumber;
    shipping: z.ZodNumber;
    tax: z.ZodNumber;
    total: z.ZodNumber;
    appliedCoupons: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        discountAmount: z.ZodNumber;
        discountType: z.ZodEnum<["percentage", "fixed"]>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        discountAmount: number;
        discountType: "fixed" | "percentage";
    }, {
        code: string;
        discountAmount: number;
        discountType: "fixed" | "percentage";
    }>, "many">;
    currency: z.ZodString;
    itemCount: z.ZodNumber;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    currency: string;
    updatedAt: string;
    tenantId: string;
    customerId: string | null;
    items: {
        name: string;
        price: number;
        productId: string;
        variantId: string | null;
        sku: string;
        quantity: number;
        imageUrl: string | null;
        attributes?: Record<string, string> | undefined;
    }[];
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    appliedCoupons: {
        code: string;
        discountAmount: number;
        discountType: "fixed" | "percentage";
    }[];
    itemCount: number;
}, {
    id: string;
    currency: string;
    updatedAt: string;
    tenantId: string;
    customerId: string | null;
    items: {
        name: string;
        price: number;
        productId: string;
        variantId: string | null;
        sku: string;
        quantity: number;
        imageUrl: string | null;
        attributes?: Record<string, string> | undefined;
    }[];
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    appliedCoupons: {
        code: string;
        discountAmount: number;
        discountType: "fixed" | "percentage";
    }[];
    itemCount: number;
}>;
export type Cart = z.infer<typeof CartSchema>;
/**
 * Add to cart request schema
 */
export declare const AddToCartSchema: z.ZodObject<{
    productId: z.ZodString;
    variantId: z.ZodOptional<z.ZodString>;
    quantity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
    variantId?: string | undefined;
}, {
    productId: string;
    variantId?: string | undefined;
    quantity?: number | undefined;
}>;
export type AddToCart = z.infer<typeof AddToCartSchema>;
/**
 * Update cart item schema
 */
export declare const UpdateCartItemSchema: z.ZodObject<{
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    quantity: number;
}, {
    quantity: number;
}>;
export type UpdateCartItem = z.infer<typeof UpdateCartItemSchema>;
//# sourceMappingURL=cart.schema.d.ts.map