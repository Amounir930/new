import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  MASTER_FEATURE_LIST,
  MASTER_QUOTA_LIST,
} from '@apex/provisioning';

// ─── S21: Blueprint Structure Schema ─────────────────────────────────────────
// Using explicit interface + z.lazy() to break TypeScript's deep-inference loop.
// This is the architectural solution: define the shape explicitly, let TS stop recursing.

export interface BlueprintStructure {
  version: string;
  name: string;
  quotas: Record<string, number>;
  modules: Record<string, boolean | Record<string, unknown>>;
  settings?: Record<string, unknown>;
  pages?: unknown[];
  products?: unknown[];
}

export const blueprintStructureSchema: z.ZodType<BlueprintStructure> = z.object(
  {
    version: z.string(),
    name: z.string().min(2).max(100),
    quotas: z.record(z.string(), z.number()).superRefine((val, ctx) => {
      for (const q of MASTER_QUOTA_LIST) {
        if (!(q in val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Missing quota: ${q}`,
          });
        }
      }
    }),
    modules: z
      .record(z.string(), z.union([z.boolean(), z.record(z.unknown())]))
      .superRefine((val, ctx) => {
        for (const f of MASTER_FEATURE_LIST) {
          if (!(f in val)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Missing module: ${f}`,
            });
          }
        }
      }),
    settings: z.record(z.unknown()).optional(),
    pages: z.array(z.unknown()).optional(),
    products: z.array(z.unknown()).optional(),
  }
);

// ─── Create Blueprint ─────────────────────────────────────────────────────────

export const createBlueprintSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  plan: z.enum(['free', 'basic', 'pro', 'enterprise']).default('free'),
  nicheType: z.string().optional().nullable(),
  uiConfig: z.record(z.unknown()).optional().default({}),
  isDefault: z.boolean().default(false),
  status: z.enum(['active', 'paused']).default('active'),
  blueprint: blueprintStructureSchema.optional(),
});

export type CreateBlueprintInput = z.infer<typeof createBlueprintSchema>;
export class CreateBlueprintDto extends createZodDto(createBlueprintSchema) { }

// ─── Update Blueprint ─────────────────────────────────────────────────────────

export const updateBlueprintSchema = createBlueprintSchema.partial();
export type UpdateBlueprintInput = z.infer<typeof updateBlueprintSchema>;
export class UpdateBlueprintDto extends createZodDto(updateBlueprintSchema) { }

// ─── Snapshot Blueprint ───────────────────────────────────────────────────────

export const snapshotBlueprintSchema = z.object({
  subdomain: z.string().min(3),
  name: z.string().min(3),
  description: z.string().optional(),
  nicheType: z.string().optional(),
});

export type SnapshotBlueprintInput = z.infer<typeof snapshotBlueprintSchema>;
export class SnapshotBlueprintDto extends createZodDto(
  snapshotBlueprintSchema
) { }
