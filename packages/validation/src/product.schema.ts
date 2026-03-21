import { z } from 'zod';

export const RetailAttributes = z.object({
  sku: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  weight_kg: z.number().min(0).optional(),
});

export const WellnessAttributes = z.object({
  duration_min: z.number().int().min(1),
  practitioner: z.string().optional(),
  session_type: z.enum(['one-on-one', 'group', 'workshop']),
});

export const EducationAttributes = z.object({
  instructor: z.string(),
  lessons_count: z.number().int().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  has_certificate: z.boolean().default(false),
});

export const ServicesAttributes = z.object({
  hourly_rate: z.number().min(0).optional(),
  service_category: z.string(),
});

export const HospitalityAttributes = z.object({
  capacity: z.number().int().min(1),
  amenities: z.array(z.string()).default([]),
});

export const RealEstateAttributes = z.object({
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().min(0),
  sqft: z.number().min(0),
  property_type: z.enum(['apartment', 'house', 'commercial', 'land']),
});

export const CreativeAttributes = z.object({
  medium: z.string(),
  dimensions_cm: z.string().optional(),
});

export const PolymorphicAttributesSchema = z.discriminatedUnion('niche', [
  z.object({ niche: z.literal('retail'), attributes: RetailAttributes }),
  z.object({ niche: z.literal('wellness'), attributes: WellnessAttributes }),
  z.object({ niche: z.literal('education'), attributes: EducationAttributes }),
  z.object({ niche: z.literal('services'), attributes: ServicesAttributes }),
  z.object({ niche: z.literal('hospitality'), attributes: HospitalityAttributes }),
  z.object({ niche: z.literal('real_estate'), attributes: RealEstateAttributes }),
  z.object({ niche: z.literal('creative'), attributes: CreativeAttributes }),
]);

export const BaseProductSchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be valid URL format'),
  sku: z.string().min(1, 'SKU is required'),
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  basePrice: z.coerce.number().min(0, 'Base price must be positive'),
  salePrice: z.coerce.number().min(0).optional(),
  taxPercentage: z.coerce.number().min(0).max(100).default(0),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  minOrderQty: z.coerce.number().int().min(1).default(1),
  trackInventory: z.boolean().default(true),
  weight: z.coerce.number().min(0).optional(),
  mainImage: z.string().url('Main image must be a valid URL'),
  galleryImages: z.array(
    z.object({
      url: z.string().url(),
      altText: z.string().optional(),
      order: z.number().int().default(0),
    })
  ).default([]),
  shortDescriptionAr: z.string().max(1000).optional(),
  shortDescriptionEn: z.string().max(1000).optional(),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  specifications: z.record(z.unknown()).default({}),
});

export const CreateProductSchema = z.intersection(
  BaseProductSchema,
  PolymorphicAttributesSchema
);

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
