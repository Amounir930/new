import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// NICHE-SPECIFIC ATTRIBUTE SCHEMAS (S3 Validation)
// ═══════════════════════════════════════════════════════════════

export const RetailAttributes = z.object({
  material: z.string().max(500).optional(),
  color: z.string().max(500).optional(),
  size: z.string().max(500).optional(),
});

export const WellnessAttributes = z.object({
  duration_min: z.number().int().min(1),
  practitioner: z.string().max(500).optional(),
  session_type: z.enum(['one-on-one', 'group', 'workshop']),
});

export const EducationAttributes = z.object({
  instructor: z.string().max(500),
  lessons_count: z.number().int().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  has_certificate: z.boolean().default(false),
});

export const ServicesAttributes = z.object({
  hourly_rate: z.number().min(0).optional(),
  service_category: z.string().max(500),
});

export const HospitalityAttributes = z.object({
  capacity: z.number().int().min(1),
  amenities: z.array(z.string().max(500)).default([]),
});

export const RealEstateAttributes = z.object({
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().min(0),
  sqft: z.number().min(0),
  property_type: z.enum(['apartment', 'house', 'commercial', 'land']),
});

export const CreativeAttributes = z.object({
  medium: z.string().max(500),
  dimensions_cm: z.string().max(500).optional(),
});

// ═══════════════════════════════════════════════════════════════
// ANTI-NOSQL INJECTION: Strict attribute value validation
// Max 20 keys, max 500 chars per string, no deep nesting
// ═══════════════════════════════════════════════════════════════
export const AttributesSchema = z.record(
  z.union([
    z.string().max(500),
    z.number(),
    z.boolean(),
    z.array(z.string().max(500)),
  ])
)
  .refine(
    (obj) => Object.keys(obj).length <= 20,
    'Attributes cannot have more than 20 keys'
  )
  .refine(
    (obj) => Object.keys(obj).every((k) => k.length <= 100),
    'Attribute key names cannot exceed 100 characters'
  );

// ═══════════════════════════════════════════════════════════════
// SYSTEM-MANAGED FIELDS (NEVER accepted from merchant)
// ═══════════════════════════════════════════════════════════════
export const SystemManagedFields = [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'publishedAt',
  'soldCount',
  'viewCount',
  'reviewCount',
  'avgRating',
  'embedding',
  'version',
] as const;

// ═══════════════════════════════════════════════════════════════
// GALLERY IMAGE SCHEMA
// ═══════════════════════════════════════════════════════════════
export const GalleryImageSchema = z.object({
  url: z.string().url('Gallery image must be a valid URL'),
  altText: z.string().max(200).optional(),
  order: z.number().int().min(0).default(0),
});

// ═══════════════════════════════════════════════════════════════
// BASE PRODUCT SCHEMA — 35 merchant-submitted fields
// ═══════════════════════════════════════════════════════════════
export const BaseProductSchemaShape = z.object({
  // === TAB 1: GENERAL INFO ===
  nameAr: z.string().min(1, 'Arabic name is required').max(255),
  nameEn: z.string().min(1, 'English name is required').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  sku: z.string().min(1, 'SKU is required').max(100),
  barcode: z
    .string()
    .regex(/^[A-Za-z0-9-]{8,50}$/, 'Invalid barcode format')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  brandId: z.string().uuid('Invalid brand ID').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  // Optional: empty string → undefined (DB rejects '' but accepts NULL)
  countryOfOrigin: z.string()
    .length(2, 'Must be a 2-letter country code')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),

  // === TAB 2: PRICING ===
  basePrice: z.coerce.number().positive('Base price must be positive'),
  // Optional price fields: 0 is allowed (empty form input coerces to 0)
  salePrice: z.coerce.number().min(0, 'Sale price must be 0 or greater').optional().or(z.literal(0)),
  compareAtPrice: z.coerce.number().min(0, 'Compare-at price must be 0 or greater').optional().or(z.literal(0)),
  costPrice: z.coerce.number().min(0, 'Cost price must be 0 or greater').optional().or(z.literal(0)),
  taxPercentage: z.coerce.number().min(0).max(100).default(0),

  // === TAB 3: INVENTORY & LOGISTICS ===
  // weight: 0 means not set (optional)
  weight: z.coerce.number().min(0, 'Weight must be 0 or greater').optional().or(z.literal(0)),
  dimensions: z
    .object({
      h: z.coerce.number().min(0).optional().default(0),
      w: z.coerce.number().min(0).optional().default(0),
      l: z.coerce.number().min(0).optional().default(0),
    })
    .optional(),
  minOrderQty: z.coerce.number().int().min(1).default(1),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  trackInventory: z.boolean().default(true),
  requiresShipping: z.boolean().default(true),
  isDigital: z.boolean().default(false),

  // Flat dimension fields — used by frontend forms & bulk import
  dimHeight: z.coerce.number().min(0).optional().default(0),
  dimWidth:  z.coerce.number().min(0).optional().default(0),
  dimLength: z.coerce.number().min(0).optional().default(0),

  // === TAB 4: PRODUCT DETAILS ===
  shortDescriptionAr: z.string().max(1000).optional(),
  shortDescriptionEn: z.string().max(1000).optional(),
  descriptionAr: z.string().max(10000).optional(),
  descriptionEn: z.string().max(10000).optional(),
  specifications: z.record(z.string().max(500)).default({}),
  tags: z.array(z.string().max(100)).max(30).default([]),

  // === TAB 5: MEDIA ===
  mainImage: z.string().url('Main image must be a valid URL'),
  galleryImages: z.array(GalleryImageSchema).default([]),
  videoUrl: z.string().url().optional().or(z.literal('')),
  digitalFileUrl: z.string().url().optional().or(z.literal('')),

  // === TAB 6: SEO & VISIBILITY ===
  metaTitle: z.string().max(70, 'Meta title cannot exceed 70 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description cannot exceed 160 characters').optional(),
  keywords: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isReturnable: z.boolean().default(true),

  // === TAB 7: ADVANCED ===
  niche: z.enum([
    'retail',
    'wellness',
    'education',
    'services',
    'hospitality',
    'real_estate',
    'creative',
  ]),
  attributes: AttributesSchema.default({}),
  warrantyPeriod: z.coerce.number().int().positive().optional(),
  warrantyUnit: z.enum(['days', 'months', 'years']).optional(),
});

// Cross-field: warrantyUnit required when warrantyPeriod is set
export const BaseProductSchema = BaseProductSchemaShape.superRefine((data, ctx) => {
  if (data.warrantyPeriod && !data.warrantyUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Warranty unit is required when warranty period is set',
      path: ['warrantyUnit'],
    });
  }
});

export const BaseCreateProductSchema = BaseProductSchema;

// ═══════════════════════════════════════════════════════════════
// FULL CREATE SCHEMA with niche-specific attribute validation
// ═══════════════════════════════════════════════════════════════
export const CreateProductSchema = BaseProductSchema
  .superRefine((data, ctx) => {
    // Digital product: digitalFileUrl is mandatory
    if (data.isDigital && !data.digitalFileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Digital file URL is required for digital products',
        path: ['digitalFileUrl'],
      });
    }

    // Niche-specific attributes validation
    const nicheSchemas: Record<string, z.ZodTypeAny> = {
      retail: RetailAttributes,
      wellness: WellnessAttributes,
      education: EducationAttributes,
      services: ServicesAttributes,
      hospitality: HospitalityAttributes,
      real_estate: RealEstateAttributes,
      creative: CreativeAttributes,
    };

    const nicheSchema = nicheSchemas[data.niche];
    if (nicheSchema) {
      const result = nicheSchema.safeParse(data.attributes);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({
            ...issue,
            path: ['attributes', ...issue.path],
          });
        }
      }
    }
  }) as z.ZodType<CreateProductInput>;

// ═══════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════
type AttributesType =
  | { niche: 'retail'; attributes: z.infer<typeof RetailAttributes> }
  | { niche: 'wellness'; attributes: z.infer<typeof WellnessAttributes> }
  | { niche: 'education'; attributes: z.infer<typeof EducationAttributes> }
  | { niche: 'services'; attributes: z.infer<typeof ServicesAttributes> }
  | { niche: 'hospitality'; attributes: z.infer<typeof HospitalityAttributes> }
  | { niche: 'real_estate'; attributes: z.infer<typeof RealEstateAttributes> }
  | { niche: 'creative'; attributes: z.infer<typeof CreativeAttributes> };

export type CreateProductInput = z.infer<typeof BaseProductSchema> & AttributesType;
export type GalleryImage = z.infer<typeof GalleryImageSchema>;
