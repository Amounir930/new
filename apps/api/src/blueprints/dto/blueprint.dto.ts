import { NicheSchema } from '@apex/validators';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// S3: Strict Input Validation
export const createBlueprintSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  plan: z.enum(['free', 'basic', 'pro', 'enterprise']).default('free'),
  nicheType: NicheSchema.optional()
    .nullable()
    .transform((val) => val || null),
  uiConfig: z.record(z.unknown()).optional().default({}),
  isDefault: z.boolean().default(false),
  status: z.enum(['active', 'paused']).default('active'),
  // S21: Strict nested validation for the blueprint structure
  blueprint: z
    .object({
      version: z.string(), // S3: String validation without strict regex
      name: z.string().min(2).max(100),
      quotas: z
        .object({
          max_products: z.number().int().min(0).default(10),
          max_orders: z.number().int().min(0).default(100),
          max_pages: z.number().int().min(0).default(5),
        })
        .optional()
        .default({}),
      modules: z
        .object({
          core: z.union([z.boolean(), z.record(z.unknown())]).default(true),
        })
        .catchall(z.union([z.boolean(), z.record(z.unknown()), z.undefined()]))
        .default({ core: true }),
      settings: z.record(z.unknown()).optional().default({}),
      pages: z.array(z.unknown()).optional().default([]),
      products: z.array(z.unknown()).optional().default([]),
    })
    .passthrough(), // Allow valid extra fields
});

export class CreateBlueprintDto extends createZodDto(createBlueprintSchema) {}

export const updateBlueprintSchema = createBlueprintSchema.partial();
export class UpdateBlueprintDto extends createZodDto(updateBlueprintSchema) {}

// S22: Snapshot DTO
export const snapshotBlueprintSchema = z.object({
  subdomain: z.string().min(3),
  name: z.string().min(3),
  description: z.string().optional(),
  nicheType: NicheSchema.optional(),
});
export class SnapshotBlueprintDto extends createZodDto(
  snapshotBlueprintSchema
) {}
