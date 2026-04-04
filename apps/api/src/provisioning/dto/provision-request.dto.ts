/**
 * Provision Request DTO
 */

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  type BlueprintStructure,
  blueprintStructureSchema,
} from '../../blueprints/dto/blueprint.dto';

/**
 * S21: Provision Request Schema Interface
 * Breaking Zod Inference Depth to prevent TS2589
 */
export interface ProvisionRequest {
  subdomain: string;
  storeName: string;
  adminEmail: string;
  password?: string; // S7: Initial merchant password
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  nicheType?:
    | 'retail'
    | 'wellness'
    | 'education'
    | 'services'
    | 'hospitality'
    | 'real_estate'
    | 'creative'
    | 'food'
    | 'digital'
    | null;
  uiConfig: Record<string, unknown>;
  superAdminKey: string;
  blueprint?: BlueprintStructure;
  blueprintId?: string;
}

export const ProvisionRequestSchema = z.object({
  /**
   * Unique subdomain for the store (e.g., "coffee-beans")
   */
  subdomain: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^(?=.*[a-z])[a-z0-9_-]+$/,
      'Architectural Lockdown Violation: Subdomain must contain at least one lowercase letter and follow [a-z0-9_-] format'
    ),

  /**
   * Display name of the store
   */
  storeName: z
    .string({ required_error: 'Architectural Lockdown: storeName is required' })
    .min(2, 'Store name must be at least 2 characters')
    .max(100, 'Store name cannot exceed 100 characters')
    .regex(
      /^[\w\s.,!?@#&\-()[\]]+$/,
      'Store name contains forbidden characters. Use alphanumeric and standard symbols only.'
    ),

  /**
   * Initial administrator email
   */
  adminEmail: z.string().email().max(255),

  /**
   * Initial administrator password (S7: Bcrypt-compatible)
   */
  password: z
    .string()
    .min(
      8,
      'Banking-Grade Security Compliance: Password must be at least 8 characters'
    )
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#_.])[A-Za-z\d@$!%*?&#_.-]{8,}$/,
      'Banking-Grade Security Compliance: Password must contain uppercase, lowercase, number, and special character (@$!%*?&#_.-)'
    )
    .optional(),

  /**
   * Plan level for the new tenant
   */
  plan: z.enum(['free', 'basic', 'pro', 'enterprise'], {
    errorMap: () => ({
      message:
        'Architectural Lockdown: plan must be one of [free, basic, pro, enterprise]',
    }),
  }),

  /**
   * Industry niche classification (S2.5)
   * MUST match public.niche_type PostgreSQL enum (9 values).
   */
  nicheType: z
    .enum([
      'retail',
      'wellness',
      'education',
      'services',
      'hospitality',
      'real_estate',
      'creative',
      'food',
      'digital',
    ])
    .optional()
    .nullable(),

  /**
   * SDUI/Theme configuration (S2.5)
   */
  uiConfig: z.record(z.unknown()).optional().default({}),

  /**
   * Super Admin secret key
   */
  superAdminKey: z
    .string({
      required_error: 'Sovereign Authorization Required: Missing superAdminKey',
    })
    .min(
      32,
      'Sovereign Authorization Required: Key must be at least 32 characters'
    )
    .max(128)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9_@#!.*-]{30,126}[A-Za-z0-9]$/,
      'Sovereign Authorization Required: Invalid key format'
    ),

  /**
   * Optional inline blueprint definition
   */
  blueprint: blueprintStructureSchema.optional(),

  /**
   * Optional named blueprint ID
   */
  blueprintId: z
    .string()
    .uuid(
      'Architectural Lockdown Violation: blueprintId must be a valid UUID (e.g. 123e4567-e89b-12d3-a456-426614174000)'
    )
    .optional(),
});

export class ProvisionRequestDto extends createZodDto(ProvisionRequestSchema) {}
