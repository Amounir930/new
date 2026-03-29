import { z } from 'zod';

export const PRODUCT_NICHES = [
  'retail',
  'food',
  'digital',
  'services',
  'wellness',
  'education',
  'hospitality',
  'real_estate',
  'creative',
] as const;

export const EmptyAttributesSchema = z.object({}).catchall(z.unknown());

export interface FieldMeta {
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  example: string;
  required: boolean;
  options?: readonly string[];
}

export const FIELD_METADATA: Record<string, FieldMeta> = {
  // === TAB 1: GENERAL INFO ===
  nameAr: {
    labelAr: 'اسم المنتج (عربي)',
    labelEn: 'Product Name (Arabic)',
    descAr: 'الاسم المعروض للمنتج باللغة العربية. يجب أن يكون فريداً وجذاباً.',
    descEn: 'The display name of the product in Arabic. Should be unique and catchy.',
    example: 'هاتف ذكي أيكس برو',
    required: true,
  },
  nameEn: {
    labelAr: 'اسم المنتج (إنجليزي)',
    labelEn: 'Product Name (English)',
    descAr: 'الاسم المعروض للمنتج باللغة الإنجليزية.',
    descEn: 'The display name of the product in English.',
    example: 'Apex Pro Smartphone',
    required: true,
  },
  sku: {
    labelAr: 'رمز SKU',
    labelEn: 'SKU Code',
    descAr: 'وحدة حفظ المخزون. معرف فريد للمنتج يستخدم لتتبع المخزون.',
    descEn: 'Stock Keeping Unit. A unique identifier for the product used for inventory tracking.',
    example: 'APX-PH-001',
    required: true,
  },
  slug: {
    labelAr: 'الرابط الدائم (Slug)',
    labelEn: 'SEO Slug',
    descAr: 'جزء من الرابط (URL) الخاص بالمنتج. يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط.',
    descEn: 'The product URL part. Must contain only lowercase letters, numbers, and hyphens.',
    example: 'apex-pro-smartphone',
    required: true,
  },
  barcode: {
    labelAr: 'الباركود',
    labelEn: 'Barcode',
    descAr: 'الرمز الشريطي للمنتج (مثل GTIN/EAN). 8-50 حرفاً.',
    descEn: 'Product barcode (e.g., GTIN/EAN). 8-50 characters.',
    example: '6221234567890',
    required: false,
  },
  brandId: {
    labelAr: 'معرف الماركة (Brand ID)',
    labelEn: 'Brand UUID',
    descAr: 'لربط المنتج بماركة، يرجى نسخ الـ ID الخاص بها من صفحة الماركات في لوحة التحكم ولصقه هنا.',
    descEn: 'To link a brand, navigate to the Brands page in your dashboard, copy the ID, and paste it here.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  },
  categoryId: {
    labelAr: 'معرف التصنيف (Category ID)',
    labelEn: 'Category UUID',
    descAr: 'لربط المنتج بتصنيف، يرجى نسخ الـ ID الخاص به من صفحة التصنيفات في لوحة التحكم ولصقه هنا.',
    descEn: 'To link a category, navigate to the Categories page in your dashboard, copy the ID, and paste it here.',
    example: 'ad28f440-b3b3-4fbb-8e8e-d7d7d7d7d7d7',
    required: false,
  },
  countryOfOrigin: {
    labelAr: 'بلد المنشأ',
    labelEn: 'Country of Origin',
    descAr: 'رمز الدولة المكون من حرفين (ISO 3166-1 alpha-2).',
    descEn: 'The 2-letter country code (ISO 3166-1 alpha-2).',
    example: 'EG',
    required: false,
  },

  // === TAB 2: PRICING ===
  basePrice: {
    labelAr: 'السعر الأساسي',
    labelEn: 'Base Price',
    descAr: 'السعر قبل الخصم أو السعر الافتراضي للمنتج.',
    descEn: 'The price before discount or the default product price.',
    example: '1200.50',
    required: true,
  },
  salePrice: {
    labelAr: 'سعر البيع',
    labelEn: 'Sale Price',
    descAr: 'السعر الفعلي بعد الخصم (اختياري).',
    descEn: 'The actual price after discount (optional).',
    example: '999.00',
    required: false,
  },
  compareAtPrice: {
    labelAr: 'السعر المشطوب (قبل الخصم)',
    labelEn: 'Compare At Price',
    descAr: 'يستخدم لعرض "سعر أصلي" بجانب سعر البيع لإظهار قيمة التوفير.',
    descEn: 'Used to display an "original price" next to the sale price to show savings.',
    example: '1500.00',
    required: false,
  },
  costPrice: {
    labelAr: 'سعر التكلفة',
    labelEn: 'Cost Price',
    descAr: 'تكلفة المنتج على المتجر (مخفي عن العملاء، يستخدم للتقارير الربحية).',
    descEn: 'The cost of the product for the store (hidden from customers, used for profits reporting).',
    example: '750.00',
    required: false,
  },
  taxPercentage: {
    labelAr: 'نسبة الضريبة',
    labelEn: 'Tax Percentage',
    descAr: 'نسبة الضريبة المضافة (0-100). القيمة الافتراضية هي 0.',
    descEn: 'Applied tax percentage (0-100). Default is 0.',
    example: '14',
    required: false,
  },

  // === TAB 3: INVENTORY & LOGISTICS ===
  weight: {
    labelAr: 'الوزن (جرام)',
    labelEn: 'Weight (Grams)',
    descAr: 'وزن المنتج بالجرام. يستخدم لحساب تكاليف الشحن.',
    descEn: 'Product weight in grams. Used for shipping cost calculations.',
    example: '500',
    required: false,
  },
  minOrderQty: {
    labelAr: 'أقل كمية للطلب',
    labelEn: 'Min Order Quantity',
    descAr: 'الحد الأدنى للكمية التي يمكن للعميل شراؤها في الطلب الواحد.',
    descEn: 'The minimum quantity a customer can buy in a single order.',
    example: '1',
    required: false,
  },
  lowStockThreshold: {
    labelAr: 'تنبيه انخفاض المخزون',
    labelEn: 'Low Stock Threshold',
    descAr: 'سيصلك تنبيه عندما يصل المخزون لهذه القيمة.',
    descEn: 'You will receive an alert when the stock reaches this value.',
    example: '10',
    required: false,
  },
  trackInventory: {
    labelAr: 'تتبع المخزون',
    labelEn: 'Track Inventory',
    descAr: 'تفعيل/تعطيل تتبع كمية المخزون (TRUE أو FALSE).',
    descEn: 'Enable/disable stock quantity tracking (TRUE or FALSE).',
    example: 'TRUE',
    required: false,
  },
  requiresShipping: {
    labelAr: 'يتطلب شحن',
    labelEn: 'Requires Shipping',
    descAr: 'هل المنتج فيزيائي يحتاج لشحن (TRUE أو FALSE).',
    descEn: 'Whether the product is physical and needs shipping (TRUE or FALSE).',
    example: 'TRUE',
    required: false,
  },
  isDigital: {
    labelAr: 'منتج رقمي',
    labelEn: 'Is Digital',
    descAr: 'هل المنتج رقمي (ملف، كود، اشتراك) (TRUE أو FALSE).',
    descEn: 'Whether the product is digital (file, code, subscription) (TRUE or FALSE).',
    example: 'FALSE',
    required: false,
  },

  // === TAB 4: PHYSICAL DIMENSIONS ===
  dimHeight: {
    labelAr: 'الارتفاع (سم)',
    labelEn: 'Height (cm)',
    descAr: 'ارتفاع العلبة بالسنتيمتر.',
    descEn: 'Package height in centimeters.',
    example: '10',
    required: false,
  },
  dimWidth: {
    labelAr: 'العرض (سم)',
    labelEn: 'Width (cm)',
    descAr: 'عرض العلبة بالسنتيمتر.',
    descEn: 'Package width in centimeters.',
    example: '20',
    required: false,
  },
  dimLength: {
    labelAr: 'الطول (سم)',
    labelEn: 'Length (cm)',
    descAr: 'طول العلبة بالسنتيمتر.',
    descEn: 'Package length in centimeters.',
    example: '30',
    required: false,
  },

  // === TAB 5: CONTENT & DESCRIPTIONS ===
  tags: {
    labelAr: 'الوسوم (Tags)',
    labelEn: 'Product Tags',
    descAr: 'كلمات دلالية لتصنيف المنتج، مفصولة بفاصلة (،). مثال: جديد، عرض، صيف',
    descEn: 'Comma-separated labels to categorize the product (e.g., new, sale, summer).',
    example: 'new, sale, electronics',
    required: false,
  },
  shortDescriptionAr: {
    labelAr: 'وصف قصير (عربي)',
    labelEn: 'Short Description (Arabic)',
    descAr: 'وصف موجز يظهر بجانب المنتج (بحد أقصى 1000 حرف).',
    descEn: 'A brief description shown next to the product (max 1000 chars).',
    example: 'هاتف ذكي ببطارية تدوم طويلاً وشاشة فائقة الوضوح.',
    required: false,
  },
  shortDescriptionEn: {
    labelAr: 'وصف قصير (إنجليزي)',
    labelEn: 'Short Description (English)',
    descAr: 'Bilingual short description manual.',
    descEn: 'A brief description shown next to the product in English.',
    example: 'Smartphone with long battery life and ultra-clear screen.',
    required: false,
  },
  descriptionAr: {
    labelAr: 'الوصف التفصيلي (عربي)',
    labelEn: 'Long Description (Arabic)',
    descAr: 'المواصفات الكاملة وتفاصيل المنتج (بحد أقصى 10000 حرف).',
    descEn: 'Full specifications and product details in Arabic (max 10000 chars).',
    example: 'يتميز هذا الهاتف بمعالج ثماني النواة...',
    required: false,
  },
  descriptionEn: {
    labelAr: 'الوصف التفصيلي (إنجليزي)',
    labelEn: 'Long Description (English)',
    descAr: 'Bilingual detailed description manual.',
    descEn: 'Full specifications and product details in English (max 10000 chars).',
    example: 'This phone features an octa-core processor...',
    required: false,
  },

  // === TAB 6: MEDIA ===
  mainImage: {
    labelAr: 'الصورة الأساسية (URL)',
    labelEn: 'Main Image URL',
    descAr: 'رابط مباشر للصورة الأساسية للمنتج. يجب أن يبدأ بـ https://',
    descEn: 'Direct link to the main product image. Must start with https://',
    example: 'https://cdn.apex.shop/img/prod-01.jpg',
    required: true,
  },
  galleryImages: {
    labelAr: 'صور المعرض (URLs)',
    labelEn: 'Gallery Images (URLs)',
    descAr: 'قائمة روابط لصور إضافية للمنتج، مفصولة بـ | (الرمز العمودي).',
    descEn: 'Pipe-separated list of additional product image URLs (e.g., img1.jpg | img2.jpg).',
    example: 'https://cdn.shop/1.jpg | https://cdn.shop/2.jpg',
    required: false,
  },
  videoUrl: {
    labelAr: 'رابط الفيديو (YouTube/Vimeo)',
    labelEn: 'Video URL',
    descAr: 'رابط فيديو للمنتج.',
    descEn: 'Product video URL.',
    example: 'https://youtube.com/watch?v=...',
    required: false,
  },
  digitalFileUrl: {
    labelAr: 'رابط الملف الرقمي',
    labelEn: 'Digital File URL',
    descAr: 'إلزامي إذا كان المنتج رقمي. رابط الملف الذي سيتم تحميله بعد الشراء.',
    descEn: 'Mandatory if the product is digital. The link to the file downloaded after purchase.',
    example: 'https://cdn.apex.shop/downloads/ebook.pdf',
    required: false,
  },

  // === TAB 7: SEO & VISIBILITY ===
  metaTitle: {
    labelAr: 'عنوان SEO',
    labelEn: 'Meta Title',
    descAr: 'العنوان الذي يظهر في محركات البحث (بحد أقصى 70 حرفاً).',
    descEn: 'The title shown in search engines (max 70 chars).',
    example: 'أفضل هاتف ذكي في 2024 | أيكس برو',
    required: false,
  },
  metaDescription: {
    labelAr: 'وصف SEO',
    labelEn: 'Meta Description',
    descAr: 'الوصف الذي يظهر في محركات البحث (بحد أقصى 160 حرفاً).',
    descEn: 'The description shown in search engines (max 160 chars).',
    example: 'اكتشف مواصفات هاتف أيكس برو الجديد، ببطارية تدوم 48 ساعة وكاميرا 108 ميجابكسل.',
    required: false,
  },
  keywords: {
    labelAr: 'الكلمات الدلالية',
    labelEn: 'Keywords',
    descAr: 'كلمات مفتاحية مفصولة بفاصلة لسهولة البحث.',
    descEn: 'Comma-separated keywords for easier searching.',
    example: 'هواتف، ذكية، أجهزة، تكنولوجيا',
    required: false,
  },
  isActive: {
    labelAr: 'نشط',
    labelEn: 'Is Active',
    descAr: 'هل المنتج متاح للعرض والبيع في المتجر (TRUE أو FALSE).',
    descEn: 'Whether the product is available for view and sale (TRUE or FALSE).',
    example: 'TRUE',
    required: false,
  },
  isFeatured: {
    labelAr: 'مميز',
    labelEn: 'Is Featured',
    descAr: 'هل يظهر المنتج في قسم "المنتجات المميزة" (TRUE أو FALSE).',
    descEn: 'Whether the product appears in the "Featured Products" section (TRUE or FALSE).',
    example: 'FALSE',
    required: false,
  },

  isReturnable: {
    labelAr: 'قابل للإرجاع',
    labelEn: 'Is Returnable',
    descAr: 'هل يمكن للعميل إرجاع المنتج (TRUE أو FALSE).',
    descEn: 'Whether the product can be returned by the customer (TRUE or FALSE).',
    example: 'TRUE',
    required: false,
  },
  // === TAB 8: ADVANCED & ATTRIBUTES ===
  niche: {
    labelAr: 'التصنيف البيعي (Niche)',
    labelEn: 'Product Niche',
    descAr: 'يحدد نوع المنتج والمواصفات المسموح بها. يجب الاختيار من القائمة المنسدلة.',
    descEn: 'Determines product type and allowed attributes. Must choose from the dropdown.',
    example: 'retail',
    required: true,
    options: PRODUCT_NICHES,
  },
  attributes: {
    labelAr: 'السمات المخصصة (Attributes)',
    labelEn: 'Custom Attributes',
    descAr: 'قائمة مفصولة بـ | للمفتاح والقيمة. مثال: Color:Red | Size:XL',
    descEn: 'Pipe-separated list of Key:Value pairs. Example: Color:Red | Size:XL',
    example: 'Material:Leather | Style:Modern',
    required: false,
  },
  specifications: {
    labelAr: 'المواصفات الفنية (Specifications)',
    labelEn: 'Technical Specifications',
    descAr: 'نفس تنسيق السمات. مثال: CPU:M3 | RAM:16GB',
    descEn: 'Same format as attributes. Example: CPU:M3 | RAM:16GB',
    example: 'Voltage:220V | Connector:Type-C',
    required: false,
  },
  warrantyPeriod: {
    labelAr: 'مدة الضمان',
    labelEn: 'Warranty Period',
    descAr: 'رقم يمثل مدة الضمان.',
    descEn: 'A number representing the warranty duration.',
    example: '12',
    required: false,
  },
  warrantyUnit: {
    labelAr: 'وحدة الضمان',
    labelEn: 'Warranty Unit',
    descAr: 'يجب الاختيار من القائمة: days, months, years',
    descEn: 'Must choose from: days, months, years',
    example: 'months',
    required: false,
    options: ['days', 'months', 'years'],
  },
};

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
  dimWidth: z.coerce.number().min(0).optional().default(0),
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
  niche: z.enum(PRODUCT_NICHES),
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
    const nicheSchemas: Record<(typeof PRODUCT_NICHES)[number], z.ZodTypeAny> = {
      retail: RetailAttributes,
      food: EmptyAttributesSchema,
      digital: EmptyAttributesSchema,
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
  | { niche: 'food'; attributes: z.infer<typeof EmptyAttributesSchema> }
  | { niche: 'digital'; attributes: z.infer<typeof EmptyAttributesSchema> }
  | { niche: 'wellness'; attributes: z.infer<typeof WellnessAttributes> }
  | { niche: 'education'; attributes: z.infer<typeof EducationAttributes> }
  | { niche: 'services'; attributes: z.infer<typeof ServicesAttributes> }
  | { niche: 'hospitality'; attributes: z.infer<typeof HospitalityAttributes> }
  | { niche: 'real_estate'; attributes: z.infer<typeof RealEstateAttributes> }
  | { niche: 'creative'; attributes: z.infer<typeof CreativeAttributes> };

export type CreateProductInput = z.infer<typeof BaseProductSchema> & AttributesType;
export type GalleryImage = z.infer<typeof GalleryImageSchema>;
