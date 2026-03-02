/**
 * Provision Request DTO
 */

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * S21: Provision Request Schema Interface
 * Breaking Zod Inference Depth to prevent TS2589
 */
export interface ProvisionRequest {
  subdomain: string;
  storeName: string;
  adminEmail: string;
  plan?: 'free' | 'basic' | 'pro' | 'enterprise';
  nicheType?: string | null;
  uiConfig?: Record<string, any>;
  superAdminKey?: string;
  blueprint?: any;
  blueprintId?: string;
}

export const ProvisionRequestSchema: z.ZodType<ProvisionRequest> = z.object({
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
  storeName: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z0-9\s._-]+$/, 'Store name contains invalid characters'),

  /**
   * Initial administrator email
   */
  adminEmail: z.string().email().max(255),

  /**
   * Plan level for the new tenant
   */
  plan: z.enum(['free', 'basic', 'pro', 'enterprise']).default('free'),

  /**
   * Industry niche classification (S2.5)
   */
  nicheType: z.any().optional().nullable(),

  /**
   * SDUI/Theme configuration (S2.5)
   */
  uiConfig: z.record(z.any()).optional().default({}),

  /**
   * Super Admin secret key
   */
  superAdminKey: z
    .string()
    .min(32)
    .max(128)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9-_]{30,126}[A-Za-z0-9]$/,
      'Key must start and end with alphanumeric characters and contain only A-Z, 0-9, -, _'
    ),

  /**
   * Optional inline blueprint definition
   */
  blueprint: z.any().optional(),

  /**
   * Optional named blueprint ID
   */
  blueprintId: z.string().uuid().optional(),
});

export class ProvisionRequestDto extends createZodDto(ProvisionRequestSchema) {}
