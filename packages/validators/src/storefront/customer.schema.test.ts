import { describe, expect, it } from 'vitest';
import { CustomerSchema, RegisterCustomerSchema } from './customer.schema.js';

describe('CustomerSchema', () => {
    const validCustomer = {
        id: '550e8400-e29b-41d4-a716-446655440006',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
        phone: '+1234567890',
        avatarUrl: 'https://example.com/avatar.jpg',
        loyaltyPoints: 100,
        walletBalance: 250.5,
        orderCount: 5,
        totalSpent: 1250.75,
        createdAt: new Date().toISOString(),
    };

    it('should validate valid customer', () => {
        const result = CustomerSchema.safeParse(validCustomer);
        expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
        const result = CustomerSchema.safeParse({ ...validCustomer, email: 'invalid-email' });
        expect(result.success).toBe(false);
    });

    it('should validate RegisterCustomerSchema with strong password', () => {
        const request = {
            email: 'newuser@example.com',
            password: 'StrongPassword123!',
            firstName: 'New',
            lastName: 'User',
            phone: undefined,
            acceptsMarketing: true,
        };
        const result = RegisterCustomerSchema.safeParse(request);
        expect(result.success).toBe(true);
    });

    it('should reject RegisterCustomerSchema with weak password', () => {
        const request = {
            email: 'newuser@example.com',
            password: 'weak',
            firstName: 'New',
            lastName: 'User',
        };
        const result = RegisterCustomerSchema.safeParse(request);
        expect(result.success).toBe(false);
    });
});
