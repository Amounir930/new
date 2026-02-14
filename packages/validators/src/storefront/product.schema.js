/**
 * Product Schema
 *
 * Defines product and variant data structures with validation.
 *
 * @module @apex/validators/storefront/product
 */
import { z } from 'zod';
/**
 * Product Variant Schema
 */
export const ProductVariantSchema = z.object({
    id: z.string().uuid('Variant ID must be a valid UUID'),
    sku: z
        .string()
        .min(1, 'SKU is required')
        .max(100, 'SKU cannot exceed 100 characters'),
    name: z
        .string()
        .min(1, 'Variant name is required')
        .max(255, 'Variant name cannot exceed 255 characters'),
    price: z
        .number()
        .positive('Price must be positive')
        .finite('Price must be a finite number'),
    compareAtPrice: z
        .number()
        .positive('Compare-at price must be positive')
        .finite('Compare-at price must be a finite number')
        .nullable(),
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .min(0, 'Quantity cannot be negative'),
    attributes: z
        .record(z.string(), z.string())
        .describe('Variant attributes (e.g., { color: "Red", size: "XL" })'),
    imageUrl: z.string().url('Invalid variant image URL').nullable(),
});
/**
 * Product Image Schema
 */
export const ProductImageSchema = z.object({
    url: z.string().url('Invalid image URL'),
    alt: z.string().nullable(),
    isPrimary: z.boolean(),
});
/**
 * Product Schema
 */
export const ProductSchema = z.object({
    id: z.string().uuid('Product ID must be a valid UUID'),
    slug: z
        .string()
        .min(1, 'Slug is required')
        .max(255, 'Slug cannot exceed 255 characters')
        .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    name: z
        .string()
        .min(1, 'Product name is required')
        .max(255, 'Product name cannot exceed 255 characters'),
    description: z.string().nullable(),
    shortDescription: z
        .string()
        .max(500, 'Short description cannot exceed 500 characters')
        .nullable(),
    // ═══════════════════════════════════════════════════════════
    // Pricing
    // ═══════════════════════════════════════════════════════════
    price: z
        .number()
        .positive('Price must be positive')
        .finite('Price must be a finite number'),
    compareAtPrice: z
        .number()
        .positive('Compare-at price must be positive')
        .finite('Compare-at price must be a finite number')
        .nullable()
        .refine((val) => val === null || val > 0, {
        message: 'Compare-at price must be greater than sale price',
    }),
    currency: z
        .string()
        .length(3, 'Currency code must be 3 characters')
        .toUpperCase()
        .regex(/^[A-Z]{3}$/, 'Currency must be ISO 4217 format'),
    // ═══════════════════════════════════════════════════════════
    // Media
    // ═══════════════════════════════════════════════════════════
    images: z
        .array(ProductImageSchema)
        .min(1, 'At least one product image is required'),
    // ═══════════════════════════════════════════════════════════
    // Categorization
    // ═══════════════════════════════════════════════════════════
    categoryId: z.string().uuid('Category ID must be a valid UUID'),
    categoryName: z.string(),
    categorySlug: z.string(),
    tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters')),
    brand: z
        .string()
        .max(100, 'Brand name cannot exceed 100 characters')
        .nullable(),
    // ═══════════════════════════════════════════════════════════
    // Variants
    // ═══════════════════════════════════════════════════════════
    variants: z.array(ProductVariantSchema),
    hasVariants: z.boolean(),
    // ═══════════════════════════════════════════════════════════
    // Inventory
    // ═══════════════════════════════════════════════════════════
    inStock: z.boolean(),
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .min(0, 'Quantity cannot be negative'),
    // ═══════════════════════════════════════════════════════════
    // SEO
    // ═══════════════════════════════════════════════════════════
    metaTitle: z
        .string()
        .max(60, 'Meta title should not exceed 60 characters for optimal SEO')
        .nullable(),
    metaDescription: z
        .string()
        .max(160, 'Meta description should not exceed 160 characters for optimal SEO')
        .nullable(),
    // ═══════════════════════════════════════════════════════════
    // Reviews Summary
    // ═══════════════════════════════════════════════════════════
    averageRating: z
        .number()
        .min(0, 'Rating must be between 0 and 5')
        .max(5, 'Rating must be between 0 and 5'),
    reviewCount: z
        .number()
        .int('Review count must be an integer')
        .min(0, 'Review count cannot be negative'),
    // ═══════════════════════════════════════════════════════════
    // Timestamps
    // ═══════════════════════════════════════════════════════════
    createdAt: z.string().datetime({ message: 'Invalid datetime format' }),
    updatedAt: z.string().datetime({ message: 'Invalid datetime format' }),
});
/**
 * Product list item schema (minimal fields for list views)
 */
export const ProductListItemSchema = ProductSchema.pick({
    id: true,
    slug: true,
    name: true,
    price: true,
    compareAtPrice: true,
    currency: true,
    images: true,
    inStock: true,
    averageRating: true,
    reviewCount: true,
});
//# sourceMappingURL=product.schema.js.map