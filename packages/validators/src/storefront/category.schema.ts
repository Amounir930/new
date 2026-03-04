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
export const CategorySchema = z.object({
  id: z.string().uuid('Category ID must be a valid UUID'),

  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255, 'Slug cannot exceed 255 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),

  name: z
    .string()
    .min(1, 'Category name is required')
    .max(255, 'Category name cannot exceed 255 characters'),

  description: z.string().nullable(),

  imageUrl: z.string().url('Invalid image URL').nullable(),

  parentId: z
    .string()
    .uuid('Parent category ID must be a valid UUID')
    .nullable()
    .describe('Null for top-level categories'),

  productCount: z
    .number()
    .int('Product count must be an integer')
    .min(0, 'Product count cannot be negative'),

  order: z
    .number()
    .int('Order must be an integer')
    .min(0, 'Order cannot be negative')
    .describe('Display order for sorting'),
});

export type Category = z.infer<typeof CategorySchema>;

/**
 * Category tree node (with nested children)
 */
export const CategoryTreeNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  CategorySchema.extend({
    children: z.array(CategoryTreeNodeSchema).optional(),
  })
);

export type CategoryTreeNode = z.infer<typeof CategoryTreeNodeSchema>;
