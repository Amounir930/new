import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 7 Sections of Product Data
 * S3: Input Validation
 */
export const CreateProductSchema = z.object({
    // 1. Primary Info
    nameAr: z.string().min(1, 'Arabic name is required'),
    nameEn: z.string().min(1, 'English name is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be valid URL format'),
    sku: z.string().min(1, 'SKU is required'),
    brandId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),

    // 2. Pricing & Inventory
    basePrice: z.number().min(0, 'Base price must be positive'),
    salePrice: z.number().min(0).optional(),
    taxPercentage: z.number().min(0).max(100).default(0),
    stockQuantity: z.number().int().min(0).default(0),
    minOrderQty: z.number().int().min(1).default(1),
    trackInventory: z.boolean().default(true),

    // 3. Technical & Logistics
    weight: z.number().min(0).optional(),
    dimensions: z.object({
        h: z.number().min(0).optional(),
        w: z.number().min(0).optional(),
        l: z.number().min(0).optional(),
    }).optional(),
    packageContentsAr: z.string().optional(),
    packageContentsEn: z.string().optional(),
    countryOfOrigin: z.string().optional(),

    // 4. Content & Media
    shortDescriptionAr: z.string().max(1000).optional(),
    shortDescriptionEn: z.string().max(1000).optional(),
    longDescriptionAr: z.string().optional(),
    longDescriptionEn: z.string().optional(),
    mainImage: z.string().url('Main image must be a valid URL'),
    galleryImages: z.array(z.string().url()).default([]),
    videoUrl: z.string().url().optional(),

    // 5. Trust & Policies
    warrantyPeriod: z.number().int().min(0).optional(),
    warrantyPolicyAr: z.string().optional(),
    warrantyPolicyEn: z.string().optional(),
    isReturnable: z.boolean().default(true),
    returnPeriod: z.number().int().min(0).default(14),

    // 6. SEO Metadata
    metaTitle: z.string().max(70).optional(),
    metaDescription: z.string().max(160).optional(),
    keywords: z.string().optional(),

    // 7. Dynamic Niche-Specific
    specifications: z.record(z.unknown()).default({}),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) { }

export const UpdateProductSchema = CreateProductSchema.partial();
export class UpdateProductDto extends createZodDto(UpdateProductSchema) { }
