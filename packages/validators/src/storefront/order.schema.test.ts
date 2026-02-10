import { describe, expect, it } from 'vitest';
import { CreateOrderSchema, OrderSchema } from './order.schema.js';

describe('OrderSchema', () => {
  const validOrder = {
    id: '550e8400-e29b-41d4-a716-446655440005',
    orderNumber: 'ORD-12345-ABC',
    tenantId: '550e8400-e29b-41d4-a716-446655440000',
    customerId: '550e8400-e29b-41d4-a716-446655440006',
    status: 'pending',
    items: [
      {
        productId: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Product',
        sku: 'SKU-001',
        price: 99.99,
        quantity: 1,
        imageUrl: null,
      },
    ],
    subtotal: 99.99,
    discount: 0,
    shipping: 10,
    tax: 5,
    total: 114.99,
    currency: 'USD',
    shippingAddress: {
      name: 'John Doe',
      line1: '123 Main St',
      line2: null,
      city: 'Riyadh',
      state: 'Riyadh',
      postalCode: '12345',
      country: 'SA',
      phone: '+966500000000',
    },
    billingAddress: {
      name: 'John Doe',
      line1: '123 Main St',
      line2: null,
      city: 'Riyadh',
      state: 'Riyadh',
      postalCode: '12345',
      country: 'SA',
      phone: '+966500000000',
    },
    paymentMethod: 'card',
    paymentStatus: 'pending',
    trackingNumber: null,
    trackingUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    shippedAt: null,
    deliveredAt: null,
  };

  it('should validate valid order', () => {
    const result = OrderSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it('should reject invalid country code (3 chars instead of 2)', () => {
    const invalidOrder = {
      ...validOrder,
      shippingAddress: { ...validOrder.shippingAddress, country: 'USA' },
    };
    const result = OrderSchema.safeParse(invalidOrder);
    expect(result.success).toBe(false);
  });

  it('should reject invalid order status', () => {
    const result = OrderSchema.safeParse({ ...validOrder, status: 'unknown' });
    expect(result.success).toBe(false);
  });

  it('should validate CreateOrderSchema', () => {
    const request = {
      shippingAddress: validOrder.shippingAddress,
      paymentMethod: 'cod',
    };
    const result = CreateOrderSchema.safeParse(request);
    expect(result.success).toBe(true);
  });
});
