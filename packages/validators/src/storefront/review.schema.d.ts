/**
 * Review Schema
 *
 * Product review validation schema.
 *
 * @module @apex/validators/storefront/review
 */
import { z } from 'zod';
/**
 * Review Schema
 */
export declare const ReviewSchema: z.ZodObject<{
    id: z.ZodString;
    productId: z.ZodString;
    customerId: z.ZodString;
    customerName: z.ZodString;
    rating: z.ZodNumber;
    title: z.ZodNullable<z.ZodString>;
    content: z.ZodString;
    verified: z.ZodBoolean;
    helpful: z.ZodNumber;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    customerId: string;
    title: string | null;
    content: string;
    productId: string;
    customerName: string;
    rating: number;
    verified: boolean;
    helpful: number;
}, {
    id: string;
    createdAt: string;
    customerId: string;
    title: string | null;
    content: string;
    productId: string;
    customerName: string;
    rating: number;
    verified: boolean;
    helpful: number;
}>;
export type Review = z.infer<typeof ReviewSchema>;
/**
 * Create review schema (customer submission)
 */
export declare const CreateReviewSchema: z.ZodObject<{
    productId: z.ZodString;
    rating: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    productId: string;
    rating: number;
    title?: string | undefined;
}, {
    content: string;
    productId: string;
    rating: number;
    title?: string | undefined;
}>;
export type CreateReview = z.infer<typeof CreateReviewSchema>;
//# sourceMappingURL=review.schema.d.ts.map