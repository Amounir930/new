import { NicheSchema } from '@apex/validators';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  MASTER_FEATURE_LIST,
  MASTER_QUOTA_LIST,
} from '../../../../../packages/provisioning/src/blueprint/constants.js';

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
      version: z.string(),
      name: z.string().min(2).max(100),
      quotas: z.record(z.string(), z.number()).refine(
        (val) => {
          return MASTER_QUOTA_LIST.every((q) => q in val);
        },
        {
          message: `Blueprint quotas must include: ${MASTER_QUOTA_LIST.join(', ')}`,
        }
      ),
      modules: z
        .record(z.string(), z.union([z.boolean(), z.record(z.unknown())]))
        .refine(
          (val) => {
            return MASTER_FEATURE_LIST.every((f) => f in val);
          },
          {
            message: `Blueprint modules must include all 41+ features: ${MASTER_FEATURE_LIST.join(', ')}`,
          }
        ),
      settings: z.record(z.unknown()).optional().default({}),
      pages: z.array(z.unknown()).optional().default([]),
      products: z.array(z.unknown()).optional().default([]),
    })
    .passthrough(),
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
