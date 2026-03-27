import { BaseCreateProductSchema, BaseProductSchemaShape } from '@apex/validation';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 🛡️ S3: Input Validation — CreateProductDto
 *
 * ALLOWED: 35 merchant-submitted fields (see BaseCreateProductSchema)
 * EXCLUDED (System-Managed — never accepted from merchant):
 *   id, createdAt, updatedAt, deletedAt, publishedAt,
 *   soldCount, viewCount, reviewCount, avgRating, embedding, version
 */
export class CreateProductDto extends createZodDto(BaseCreateProductSchema) {}

export class UpdateProductDto extends createZodDto(
  // Use the raw ZodObject (BaseProductSchemaShape) for .extend()
  // BaseCreateProductSchema is ZodEffects (superRefine) which has no .extend()
  BaseProductSchemaShape.extend({
    version: z.number().int().nonnegative().optional(),
    // Flat dimension fields from edit form — reassembled to JSONB in controller
    dimHeight: z.coerce.number().min(0).optional(),
    dimWidth:  z.coerce.number().min(0).optional(),
    dimLength: z.coerce.number().min(0).optional(),
  })
) {}

// Re-export type for controller usage
export type { CreateProductInput } from '@apex/validation';
