import { describe, expect, it } from 'vitest';
import { CartSchema, AddToCartSchema } from './cart.schema.js';

describe('CartSchema', () => {
    const validCart = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        customerId: null,
        items: [
            {
                productId: '550e8400-e29b-41d4-a716-446655440001',
                variantId: null,
                name: 'Test Product',
                sku: 'SKU-001',
                price: 99.99,
                quantity: 2,
                imageUrl: 'https://example.com/img.jpg',
                attributes: {},
            },
        ],
        subtotal: 199.98,
        discount: 0,
        shipping: 10,
        tax: 15,
        total: 224.98,
        appliedCoupons: [],
        currency: 'USD',
        itemCount: 2,
        updatedAt: new Date().toISOString(),
    };

    it('should validate valid cart', () => {
        const result = CartSchema.safeParse(validCart);
        expect(result.success).toBe(true);
    });

    it('should reject negative subtotal', () => {
        const result = CartSchema.safeParse({ ...validCart, subtotal: -1 });
        expect(result.success).toBe(false);
    });

    it('should reject invalid item quantity', () => {
        const invalidCart = {
            ...validCart,
            items: [{ ...validCart.items[0], quantity: 1000 }],
        };
        const result = CartSchema.safeParse(invalidCart);
        expect(result.success).toBe(false);
    });

    it('should validate AddToCartSchema', () => {
        const request = { productId: validCart.items[0].productId, quantity: 5 };
        const result = AddToCartSchema.safeParse(request);
        expect(result.success).toBe(true);
        expect(result.data?.quantity).toBe(5);
    });

    it('should fallback to default quantity in AddToCartSchema', () => {
        const request = { productId: validCart.items[0].productId };
        const result = AddToCartSchema.safeParse(request);
        expect(result.success).toBe(true);
        expect(result.data?.quantity).toBe(1);
    });
});
