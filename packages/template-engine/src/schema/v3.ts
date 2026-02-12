import { z } from 'zod';

/**
 * 🧱 Base Brick Schema (LEGO v3)
 */
export const BaseBrickSchema: z.ZodObject<any> = z.object({
    id: z.string().describe('Unique identifier for this brick instance'),
    type: z.string().describe('The component type (e.g., "Hero", "ProductGrid")'),
    props: z.record(z.any()).default({}).describe('Parameters passed to the component'),
    slots: z.record(z.array(z.lazy((): z.ZodType<any> => BaseBrickSchema))).optional().describe('Named slots for nested child bricks'),
    data: z.object({
        binding: z.string().optional().describe('Data source path'),
        condition: z.string().optional().describe('Logical expression for rendering'),
    }).optional(),
    meta: z.object({
        label: z.string().optional(),
        isHidden: z.boolean().default(false),
        isLocked: z.boolean().default(false),
    }).optional(),
});

/**
 * 🧱 Recursive Brick Schema
 */
export const BrickSchema: z.ZodType<any> = z.lazy(() => BaseBrickSchema);

/**
 * 🗺️ Blueprint Schema (LEGO v3)
 * A Blueprint is a complete configuration of Bricks for a specific page.
 */
export const BlueprintSchema = z.object({
    version: z.literal('3.0.0').default('3.0.0'),
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    category: z.enum(['home', 'category', 'product', 'cart', 'checkout', 'page']),
    root: BrickSchema.describe('The root brick of the page (usually a Layout/PageContainer)'),
    layout: z.object({
        theme: z.string().default('default'),
        isFullWidth: z.boolean().default(true),
        rtl: z.boolean().default(true),
    }).default({}),
});

// Type definitions derived from schemas
export type Brick = z.infer<typeof BrickSchema>;
export type Blueprint = z.infer<typeof BlueprintSchema>;

/**
 * 🛡️ Validation Utilities
 */
export function validateBlueprint(data: unknown): Blueprint {
    return BlueprintSchema.parse(data);
}

export function validateBrick(data: unknown): Brick {
    return BrickSchema.parse(data);
}
