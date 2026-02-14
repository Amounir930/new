/**
 * Category Schema
 *
 * Product category validation schema.
 *
 * @module @apex/validators/storefront/category
 */
import { z } from 'zod';
/**
 * Category Schema
 */
export declare const CategorySchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    imageUrl: z.ZodNullable<z.ZodString>;
    parentId: z.ZodNullable<z.ZodString>;
    productCount: z.ZodNumber;
    order: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    description: string | null;
    slug: string;
    imageUrl: string | null;
    parentId: string | null;
    productCount: number;
    order: number;
}, {
    name: string;
    id: string;
    description: string | null;
    slug: string;
    imageUrl: string | null;
    parentId: string | null;
    productCount: number;
    order: number;
}>;
export type Category = z.infer<typeof CategorySchema>;
/**
 * Category tree node (with nested children)
 */
export declare const CategoryTreeNodeSchema: z.ZodType<any>;
export type CategoryTreeNode = z.infer<typeof CategoryTreeNodeSchema>;
//# sourceMappingURL=category.schema.d.ts.map