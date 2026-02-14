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
export const ReviewSchema = z.object({
    id: z.string().uuid('Review ID must be a valid UUID'),
    productId: z.string().uuid('Product ID must be a valid UUID'),
    customerId: z.string().uuid('Customer ID must be a valid UUID'),
    customerName: z
        .string()
        .min(1, 'Customer name is required')
        .max(100, 'Customer name cannot exceed 100 characters'),
    rating: z
        .number()
        .int('Rating must be an integer')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot exceed 5'),
    title: z
        .string()
        .max(100, 'Review title cannot exceed 100 characters')
        .nullable(),
    content: z
        .string()
        .min(1, 'Review content is required')
        .max(2000, 'Review content cannot exceed 2000 characters'),
    verified: z.boolean().describe('True if customer purchased this product'),
    helpful: z
        .number()
        .int('"Helpful" count must be an integer')
        .min(0, '"Helpful" count cannot be negative'),
    createdAt: z.string().datetime({ message: 'Invalid datetime format' }),
});
/**
 * Create review schema (customer submission)
 */
export const CreateReviewSchema = z.object({
    productId: z.string().uuid('Product ID must be a valid UUID'),
    rating: z
        .number()
        .int('Rating must be an integer')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot exceed 5'),
    title: z
        .string()
        .max(100, 'Review title cannot exceed 100 characters')
        .optional(),
    content: z
        .string()
        .min(10, 'Review must be at least 10 characters')
        .max(2000, 'Review cannot exceed 2000 characters'),
});
//# sourceMappingURL=review.schema.js.map