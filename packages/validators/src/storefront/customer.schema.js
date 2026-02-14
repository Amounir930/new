/**
 * Customer Schema
 *
 * Customer/user validation schema.
 *
 * @module @apex/validators/storefront/customer
 */
import { z } from 'zod';
/**
 * Customer Schema
 */
export const CustomerSchema = z.object({
    id: z.string().uuid('Customer ID must be a valid UUID'),
    email: z.string().email('Invalid email address'),
    firstName: z
        .string()
        .min(1, 'First name is required')
        .max(100, 'First name cannot exceed 100 characters'),
    lastName: z
        .string()
        .min(1, 'Last name is required')
        .max(100, 'Last name cannot exceed 100 characters'),
    phone: z
        .string()
        .max(20, 'Phone number cannot exceed 20 characters')
        .nullable(),
    avatarUrl: z.string().url('Invalid avatar URL').nullable(),
    // ═══════════════════════════════════════════════════════════
    // Loyalty & Wallet
    // ═══════════════════════════════════════════════════════════
    loyaltyPoints: z
        .number()
        .int('Loyalty points must be an integer')
        .min(0, 'Loyalty points cannot be negative'),
    walletBalance: z
        .number()
        .min(0, 'Wallet balance cannot be negative')
        .finite('Wallet balance must be a finite number'),
    // ═══════════════════════════════════════════════════════════
    // Stats
    // ═══════════════════════════════════════════════════════════
    orderCount: z
        .number()
        .int('Order count must be an integer')
        .min(0, 'Order count cannot be negative'),
    totalSpent: z
        .number()
        .min(0, 'Total spent cannot be negative')
        .finite('Total spent must be a finite number'),
    createdAt: z.string().datetime({ message: 'Invalid datetime format' }),
});
/**
 * Customer registration schema
 */
export const RegisterCustomerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password cannot exceed 128 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    firstName: z
        .string()
        .min(1, 'First name is required')
        .max(100, 'First name cannot exceed 100 characters'),
    lastName: z
        .string()
        .min(1, 'Last name is required')
        .max(100, 'Last name cannot exceed 100 characters'),
    phone: z
        .string()
        .max(20, 'Phone number cannot exceed 20 characters')
        .optional(),
    acceptsMarketing: z.boolean().default(false),
});
/**
 * Customer login schema
 */
export const LoginCustomerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});
/**
 * Update customer profile schema
 */
export const UpdateCustomerSchema = CustomerSchema.pick({
    firstName: true,
    lastName: true,
    phone: true,
}).partial();
//# sourceMappingURL=customer.schema.js.map