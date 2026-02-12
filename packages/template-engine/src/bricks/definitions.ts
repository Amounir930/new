import { z } from 'zod';
import { BaseBrickSchema } from '../schema/v3';

/**
 * 🧱 Brick Definitions
 * Defines the standard props and structure for common bricks.
 */

export const HeroBrick = BaseBrickSchema.extend({
  type: z.literal('Hero'),
  props: z.object({
    headline: z.string(),
    subheadline: z.string().optional(),
    ctaText: z.string().optional(),
    backgroundImage: z.string().optional(),
    rtl: z.boolean().default(true),
  }),
});

export const ProductGridBrick = BaseBrickSchema.extend({
  type: z.literal('ProductGrid'),
  props: z.object({
    title: z.string().optional(),
    algorithm: z.enum(['latest', 'top_rated', 'on_sale']).default('latest'),
    limit: z.number().default(8),
    columns: z
      .object({
        mobile: z.number().default(2),
        desktop: z.number().default(4),
      })
      .default({ mobile: 2, desktop: 4 }),
  }),
});

export const SectionBrick = BaseBrickSchema.extend({
  type: z.literal('Section'),
  props: z.object({
    padding: z.enum(['none', 'small', 'medium', 'large']).default('medium'),
    background: z.string().optional(),
    fullWidth: z.boolean().default(false),
  }),
});

export const ContainerBrick = BaseBrickSchema.extend({
  type: z.literal('Container'),
  props: z.object({
    maxWidth: z.enum(['sm', 'md', 'lg', 'xl', 'full']).default('xl'),
  }),
});
