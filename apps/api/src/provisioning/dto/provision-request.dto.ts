/**
 * Provision Request DTO
 */

import { NicheSchema } from '@apex/validators';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ProvisionRequestSchema = z.object({
  /**
   * Unique subdomain for the store (e.g., "coffee-beans")
   */
  subdomain: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-z0-9-]+$/,
      'Subdomain must be lowercase alphanumeric and hyphens only'
    ),

  /**
   * Display name of the store
   */
  storeName: z.string().min(2).max(100),

  /**
   * Initial administrator email
   */
  adminEmail: z.string().email(),

  /**
   * Plan level for the new tenant
   */
  plan: z.enum(['free', 'basic', 'pro', 'enterprise']).default('free'),

  /**
   * Industry niche classification (S2.5)
   */
  nicheType: NicheSchema.optional(),

  /**
   * SDUI/Theme configuration (S2.5)
   */
  uiConfig: z.record(z.unknown()).optional().default({}),

  /**
   * Super Admin secret key
   * S3 Validation: Must be 32-128 chars, alphanumeric + hyphen/underscore only
   * OPTIONAL: If the request is authenticated with a Super Admin JWT, this can be omitted.
   */
  superAdminKey: z
    .string({
      invalid_type_error: 'Super Admin key must be a string',
    })
    .min(32, 'Super Admin key must be at least 32 characters')
    .max(128, 'Super Admin key too long (max 128)')
    .regex(
      /^[A-Za-z0-9-_]+$/,
      'Super Admin key must be alphanumeric with hyphens/underscores only'
    )
    .optional(),

  /**
   * Optional inline blueprint definition (S3 Relaxed)
   * Allows passing a custom blueprint JSON directly in the provision request.
   */
  blueprint: z.unknown().optional(),

  /**
   * Optional named blueprint ID (e.g., from Blueprints table)
   * S21: Allows linking specific predefined blueprints to new tenants.
   */
  blueprintId: z.string().uuid().optional(),
});

export class ProvisionRequestDto extends createZodDto(ProvisionRequestSchema) {}
