/**
 * Template Schema Definitions
 * TypeScript types for template structure and composition
 */

import { z } from 'zod';

/**
 * Template Slot - A single component instance in a template
 */
export interface TemplateSlot {
  /** Unique slot identifier */
  id: string;
  /** Component name from registry */
  componentName: string;
  /** Props to pass to the component */
  props?: Record<string, any>;
  /** Child slots (nested components) */
  children?: TemplateSlot[];
  /** Data binding expression (e.g., "products", "cart.items") */
  dataBinding?: string;
  /** Conditional rendering expression */
  condition?: string;
}

/**
 * Page Template - Complete page definition
 */
export interface PageTemplate {
  /** Unique template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Root-level slots */
  slots: TemplateSlot[];
  /** Template metadata */
  metadata: TemplateMetadata;
}

/**
 * Template Metadata
 */
export interface TemplateMetadata {
  /** Template category (e.g., "home", "product", "checkout") */
  category: string;
  /** Preview image URL */
  preview?: string;
  /** RTL support */
  rtlSupport: boolean;
  /** Supported locales */
  locales?: string[];
  /** Template author */
  author?: string;
  /** Template version */
  version?: string;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Template Data Context
 * Data passed to template during rendering
 */
export interface TemplateDataContext {
  /** Product data */
  products?: any[];
  /** Cart data */
  cart?: {
    items: any[];
    total: number;
  };
  /** User data */
  user?: {
    name: string;
    email: string;
  };
  /** Store configuration */
  store?: {
    name: string;
    logo: string;
    theme: Record<string, any>;
  };
  /** Current locale */
  locale?: string;
  /** Whether rendering in builder mode */
  builderMode?: boolean;
  /** Custom data */
  [key: string]: any;
}

/**
 * Zod schema for validation
 */
export const TemplateSlotSchema: z.ZodType<TemplateSlot> = z.object({
  id: z.string(),
  componentName: z.string(),
  props: z.any().optional(),
  children: z.array(z.lazy(() => TemplateSlotSchema)).optional(),
  dataBinding: z.string().optional(),
  condition: z.string().optional(),
});

export const TemplateMetadataSchema = z.object({
  category: z.string(),
  preview: z.string().optional(),
  rtlSupport: z.boolean(),
  locales: z.array(z.string()).optional(),
  author: z.string().optional(),
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const PageTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  slots: z.array(TemplateSlotSchema),
  metadata: TemplateMetadataSchema,
});

/**
 * Validate a page template
 */
export function validateTemplate(template: unknown): PageTemplate {
  return PageTemplateSchema.parse(template);
}

/**
 * Type guard for TemplateSlot
 */
export function isTemplateSlot(value: unknown): value is TemplateSlot {
  return TemplateSlotSchema.safeParse(value).success;
}

/**
 * Type guard for PageTemplate
 */
export function isPageTemplate(value: unknown): value is PageTemplate {
  return PageTemplateSchema.safeParse(value).success;
}
