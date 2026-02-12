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
export declare const CustomerSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    avatarUrl: z.ZodNullable<z.ZodString>;
    loyaltyPoints: z.ZodNumber;
    walletBalance: z.ZodNumber;
    orderCount: z.ZodNumber;
    totalSpent: z.ZodNumber;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatarUrl: string | null;
    loyaltyPoints: number;
    walletBalance: number;
    orderCount: number;
    totalSpent: number;
}, {
    id: string;
    createdAt: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatarUrl: string | null;
    loyaltyPoints: number;
    walletBalance: number;
    orderCount: number;
    totalSpent: number;
}>;
export type Customer = z.infer<typeof CustomerSchema>;
/**
 * Customer registration schema
 */
export declare const RegisterCustomerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    acceptsMarketing: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    acceptsMarketing: boolean;
    phone?: string | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    phone?: string | undefined;
    acceptsMarketing?: boolean | undefined;
}>;
export type RegisterCustomer = z.infer<typeof RegisterCustomerSchema>;
/**
 * Customer login schema
 */
export declare const LoginCustomerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginCustomer = z.infer<typeof LoginCustomerSchema>;
/**
 * Update customer profile schema
 */
export declare const UpdateCustomerSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | null | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | null | undefined;
}>;
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;
//# sourceMappingURL=customer.schema.d.ts.map