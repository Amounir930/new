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
export declare const ProductVariantSchema: z.ZodObject<{
    id: z.ZodString;
    sku: z.ZodString;
    name: z.ZodString;
    price: z.ZodNumber;
    compareAtPrice: z.ZodNullable<z.ZodNumber>;
    quantity: z.ZodNumber;
    attributes: z.ZodRecord<z.ZodString, z.ZodString>;
    imageUrl: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    price: number;
    imageUrl: string | null;
    sku: string;
    quantity: number;
    attributes: Record<string, string>;
    compareAtPrice: number | null;
}, {
    name: string;
    id: string;
    price: number;
    imageUrl: string | null;
    sku: string;
    quantity: number;
    attributes: Record<string, string>;
    compareAtPrice: number | null;
}>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
/**
 * Product Image Schema
 */
export declare const ProductImageSchema: z.ZodObject<{
    url: z.ZodString;
    alt: z.ZodNullable<z.ZodString>;
    isPrimary: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    url: string;
    alt: string | null;
    isPrimary: boolean;
}, {
    url: string;
    alt: string | null;
    isPrimary: boolean;
}>;
export type ProductImage = z.infer<typeof ProductImageSchema>;
/**
 * Product Schema
 */
export declare const ProductSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    shortDescription: z.ZodNullable<z.ZodString>;
    price: z.ZodNumber;
    compareAtPrice: z.ZodEffects<z.ZodNullable<z.ZodNumber>, number | null, number | null>;
    currency: z.ZodString;
    images: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        alt: z.ZodNullable<z.ZodString>;
        isPrimary: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        url: string;
        alt: string | null;
        isPrimary: boolean;
    }, {
        url: string;
        alt: string | null;
        isPrimary: boolean;
    }>, "many">;
    categoryId: z.ZodString;
    categoryName: z.ZodString;
    categorySlug: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    brand: z.ZodNullable<z.ZodString>;
    variants: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        sku: z.ZodString;
        name: z.ZodString;
        price: z.ZodNumber;
        compareAtPrice: z.ZodNullable<z.ZodNumber>;
        quantity: z.ZodNumber;
        attributes: z.ZodRecord<z.ZodString, z.ZodString>;
        imageUrl: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        price: number;
        imageUrl: string | null;
        sku: string;
        quantity: number;
        attributes: Record<string, string>;
        compareAtPrice: number | null;
    }, {
        name: string;
        id: string;
        price: number;
        imageUrl: string | null;
        sku: string;
        quantity: number;
        attributes: Record<string, string>;
        compareAtPrice: number | null;
    }>, "many">;
    hasVariants: z.ZodBoolean;
    inStock: z.ZodBoolean;
    quantity: z.ZodNumber;
    metaTitle: z.ZodNullable<z.ZodString>;
    metaDescription: z.ZodNullable<z.ZodString>;
    averageRating: z.ZodNumber;
    reviewCount: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    brand: string | null;
    createdAt: string;
    description: string | null;
    price: number;
    currency: string;
    updatedAt: string;
    slug: string;
    quantity: number;
    compareAtPrice: number | null;
    shortDescription: string | null;
    images: {
        url: string;
        alt: string | null;
        isPrimary: boolean;
    }[];
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    tags: string[];
    variants: {
        name: string;
        id: string;
        price: number;
        imageUrl: string | null;
        sku: string;
        quantity: number;
        attributes: Record<string, string>;
        compareAtPrice: number | null;
    }[];
    hasVariants: boolean;
    inStock: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    averageRating: number;
    reviewCount: number;
}, {
    name: string;
    id: string;
    brand: string | null;
    createdAt: string;
    description: string | null;
    price: number;
    currency: string;
    updatedAt: string;
    slug: string;
    quantity: number;
    compareAtPrice: number | null;
    shortDescription: string | null;
    images: {
        url: string;
        alt: string | null;
        isPrimary: boolean;
    }[];
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    tags: string[];
    variants: {
        name: string;
        id: string;
        price: number;
        imageUrl: string | null;
        sku: string;
        quantity: number;
        attributes: Record<string, string>;
        compareAtPrice: number | null;
    }[];
    hasVariants: boolean;
    inStock: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    averageRating: number;
    reviewCount: number;
}>;
export type Product = z.infer<typeof ProductSchema>;
/**
 * Product list item schema (minimal fields for list views)
 */
export declare const ProductListItemSchema: z.ZodObject<Pick<{
    id: z.ZodString;
    slug: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    shortDescription: z.ZodNullable<z.ZodString>;
    price: z.ZodNumber;
    compareAtPrice: z.ZodEffects<z.ZodNullable<z.ZodNumber>, number | null, number | null>;
    currency: z.ZodString;
    images: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        alt: z.ZodNullable<z.ZodString>;
        isPrimary: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        url: string;
        alt: string | null;
        isPrimary: boolean;
    }, {
        url: string;
        alt: string | null;
        isPrimary: boolean;
    }>, "many">;
    categoryId: z.ZodString;
    categoryName: z.ZodString;
    categorySlug: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    brand: z.ZodNullable<z.ZodString>;
    variants: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        sku: z.ZodString;
        name: z.ZodString;
        price: z.ZodNumber;
        compareAtPrice: z.ZodNullable<z.ZodNumber>;
        quantity: z.ZodNumber;
        attributes: z.ZodRecord<z.ZodString, z.ZodString>;
        imageUrl: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        price: number;
        imageUrl: string | null;
        sku: string;
        quantity: number;
        attributes: Record<string, string>;
        compareAtPrice: number | null;
    }, {
        name: string;
        id: string;
        price: number;
        imageUrl: string | null;
        sku: string;
        quantity: number;
        attributes: Record<string, string>;
        compareAtPrice: number | null;
    }>, "many">;
    hasVariants: z.ZodBoolean;
    inStock: z.ZodBoolean;
    quantity: z.ZodNumber;
    metaTitle: z.ZodNullable<z.ZodString>;
    metaDescription: z.ZodNullable<z.ZodString>;
    averageRating: z.ZodNumber;
    reviewCount: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "name" | "id" | "price" | "currency" | "slug" | "compareAtPrice" | "images" | "inStock" | "averageRating" | "reviewCount">, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    price: number;
    currency: string;
    slug: string;
    compareAtPrice: number | null;
    images: {
        url: string;
        alt: string | null;
        isPrimary: boolean;
    }[];
    inStock: boolean;
    averageRating: number;
    reviewCount: number;
}, {
    name: string;
    id: string;
    price: number;
    currency: string;
    slug: string;
    compareAtPrice: number | null;
    images: {
        url: string;
        alt: string | null;
        isPrimary: boolean;
    }[];
    inStock: boolean;
    averageRating: number;
    reviewCount: number;
}>;
export type ProductListItem = z.infer<typeof ProductListItemSchema>;
//# sourceMappingURL=product.schema.d.ts.map