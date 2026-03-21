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
  z.object({
    niche: z.literal('hospitality'),
    attributes: HospitalityAttributes,
  }),
  z.object({
    niche: z.literal('real_estate'),
    attributes: RealEstateAttributes,
  }),
  z.object({ niche: z.literal('creative'), attributes: CreativeAttributes }),
]);
