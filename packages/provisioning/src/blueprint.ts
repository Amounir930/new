/**
 * Super-#21: Onboarding Blueprint Editor
 * Constitution Reference: plan.md (Super-#21)
 * Purpose: JSON editor UI in Super Admin for tenant provisioning templates
 */

import { onboardingBlueprints } from '@apex/db';
import { publicDb } from '@apex/db';
import { and, desc, eq } from 'drizzle-orm';

export interface BlueprintTemplate {
  version: '1.0';
  name: string;
  description?: string;
  // Starter products to seed
  products?: Array<{
    name: string;
    description?: string;
    price: number;
    category?: string;
    inventory?: number;
  }>;
  // Starter pages (CMS)
  pages?: Array<{
    slug: string;
    title: string;
    content: string;
    isPublished?: boolean;
  }>;
  // Starter categories
  categories?: Array<{
    name: string;
    slug: string;
    description?: string;
  }>;
  // Default settings override
  settings?: Record<string, string>;
  // Sample orders (for demo mode)
  sampleOrders?: boolean;
  // Navigation/menu structure
  navigation?: Array<{
    label: string;
    url: string;
    position: number;
  }>;
}

export interface BlueprintRecord {
  id: string;
  name: string;
  description: string | null;
  blueprint: BlueprintTemplate;
  isDefault: boolean;
  plan: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Validate blueprint JSON structure
 */
/**
 * Validate blueprint JSON structure
 */
export function validateBlueprint(
  blueprint: unknown
): blueprint is BlueprintTemplate {
  if (typeof blueprint !== 'object' || blueprint === null) {
    throw new Error('Blueprint must be an object');
  }

  const bp = blueprint as Record<string, unknown>;

  // Check version
  if (bp.version !== '1.0') {
    throw new Error('Blueprint version must be "1.0"');
  }

  // Validate name
  if (typeof bp.name !== 'string' || bp.name.length < 1) {
    throw new Error('Blueprint must have a name');
  }

  // Validate products if present
  if (bp.products !== undefined) {
    validateProducts(bp.products);
  }

  // Validate pages if present
  if (bp.pages !== undefined) {
    validatePages(bp.pages);
  }

  return true;
}

/**
 * Validate products array in blueprint
 */
function validateProducts(products: unknown): void {
  if (!Array.isArray(products)) {
    throw new Error('products must be an array');
  }
  for (const product of products) {
    if (typeof product.name !== 'string') {
      throw new Error('Product must have a name');
    }
    if (typeof product.price !== 'number' || product.price < 0) {
      throw new Error('Product must have a valid price');
    }
  }
}

/**
 * Validate pages array in blueprint
 */
function validatePages(pages: unknown): void {
  if (!Array.isArray(pages)) {
    throw new Error('pages must be an array');
  }
  for (const page of pages) {
    if (typeof page.slug !== 'string' || typeof page.title !== 'string') {
      throw new Error('Page must have slug and title');
    }
  }
}

/**
 * Create a new onboarding blueprint
 */
export async function createBlueprint(
  name: string,
  blueprint: BlueprintTemplate,
  options: {
    description?: string;
    isDefault?: boolean;
    plan?: string;
  } = {}
): Promise<BlueprintRecord> {
  // Validate blueprint structure
  validateBlueprint(blueprint);

  // If this is set as default, unset any existing default for this plan
  if (options.isDefault) {
    await publicDb
      .update(onboardingBlueprints)
      .set({ isDefault: 'false' })
      .where(eq(onboardingBlueprints.plan, options.plan || 'free'));
  }

  const result = await publicDb
    .insert(onboardingBlueprints)
    .values({
      name,
      description: options.description || null,
      blueprint: JSON.stringify(blueprint),
      isDefault: options.isDefault ? 'true' : 'false',
      plan: options.plan || 'free',
    })
    .returning();

  return {
    ...result[0],
    blueprint: JSON.parse(result[0].blueprint) as BlueprintTemplate,
    isDefault: result[0].isDefault === 'true',
  };
}

/**
 * Get all blueprints
 */
export async function getAllBlueprints(): Promise<BlueprintRecord[]> {
  const results = await publicDb
    .select()
    .from(onboardingBlueprints)
    .orderBy(desc(onboardingBlueprints.createdAt));

  return results.map((r) => ({
    ...r,
    blueprint: JSON.parse(r.blueprint) as BlueprintTemplate,
    isDefault: r.isDefault === 'true',
  }));
}

/**
 * Get blueprint by ID
 */
export async function getBlueprintById(
  id: string
): Promise<BlueprintRecord | null> {
  const results = await publicDb
    .select()
    .from(onboardingBlueprints)
    .where(eq(onboardingBlueprints.id, id))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  return {
    ...results[0],
    blueprint: JSON.parse(results[0].blueprint) as BlueprintTemplate,
    isDefault: results[0].isDefault === 'true',
  };
}

/**
 * Get default blueprint for a plan
 */
export async function getDefaultBlueprint(
  plan = 'free'
): Promise<BlueprintRecord | null> {
  const results = await publicDb
    .select()
    .from(onboardingBlueprints)
    .where(
      and(
        eq(onboardingBlueprints.isDefault, 'true'),
        eq(onboardingBlueprints.plan, plan)
      )
    )
    .limit(1);

  if (results.length === 0) {
    // Return any blueprint for this plan if no default
    const anyBlueprint = await publicDb
      .select()
      .from(onboardingBlueprints)
      .where(eq(onboardingBlueprints.plan, plan))
      .limit(1);

    if (anyBlueprint.length === 0) {
      // 🛡️ S21 FIX: Hardcoded fallback if database is empty
      return {
        id: 'hardcoded-default',
        name: defaultBlueprintTemplate.name,
        description: defaultBlueprintTemplate.description || null,
        blueprint: defaultBlueprintTemplate,
        isDefault: true,
        plan: plan,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return {
      ...anyBlueprint[0],
      blueprint: JSON.parse(anyBlueprint[0].blueprint) as BlueprintTemplate,
      isDefault: anyBlueprint[0].isDefault === 'true',
    };
  }

  return {
    ...results[0],
    blueprint: JSON.parse(results[0].blueprint) as BlueprintTemplate,
    isDefault: results[0].isDefault === 'true',
  };
}

/**
 * Update a blueprint
 */
export async function updateBlueprint(
  id: string,
  updates: {
    name?: string;
    description?: string;
    blueprint?: BlueprintTemplate;
    isDefault?: boolean;
    plan?: string;
  }
): Promise<BlueprintRecord | null> {
  // Validate if blueprint is being updated
  if (updates.blueprint) {
    validateBlueprint(updates.blueprint);
  }

  // If setting as default, unset others for this plan
  if (updates.isDefault && updates.plan) {
    await publicDb
      .update(onboardingBlueprints)
      .set({ isDefault: 'false' })
      .where(eq(onboardingBlueprints.plan, updates.plan));
  }

  const updateData: Record<string, string | null> = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.description !== undefined)
    updateData.description = updates.description;
  if (updates.blueprint)
    updateData.blueprint = JSON.stringify(updates.blueprint);
  if (updates.isDefault !== undefined)
    updateData.isDefault = updates.isDefault ? 'true' : 'false';
  if (updates.plan) updateData.plan = updates.plan;

  const result = await publicDb
    .update(onboardingBlueprints)
    .set(updateData)
    .where(eq(onboardingBlueprints.id, id))
    .returning();

  if (result.length === 0) {
    return null;
  }

  return {
    ...result[0],
    blueprint: JSON.parse(result[0].blueprint) as BlueprintTemplate,
    isDefault: result[0].isDefault === 'true',
  };
}

/**
 * Delete a blueprint
 */
export async function deleteBlueprint(id: string): Promise<boolean> {
  const result = await publicDb
    .delete(onboardingBlueprints)
    .where(eq(onboardingBlueprints.id, id))
    .returning({ id: onboardingBlueprints.id });

  return result.length > 0;
}

/**
 * Default blueprint template (minimal starter)
 */
export const defaultBlueprintTemplate: BlueprintTemplate = {
  version: '1.0',
  name: 'Default Starter',
  description: 'Basic setup with sample products and pages',
  products: [
    {
      name: 'Sample Product',
      description: 'This is a sample product to get you started',
      price: 29.99,
      category: 'General',
      inventory: 100,
    },
  ],
  pages: [
    {
      slug: 'about',
      title: 'About Us',
      content: '<h1>About Our Store</h1><p>Welcome to our online store!</p>',
      isPublished: true,
    },
  ],
  categories: [
    { name: 'General', slug: 'general', description: 'General products' },
  ],
  settings: {
    site_name: 'My New Store',
    currency: 'USD',
    timezone: 'UTC',
  },
  sampleOrders: false,
  navigation: [
    { label: 'Home', url: '/', position: 1 },
    { label: 'Products', url: '/products', position: 2 },
    { label: 'About', url: '/about', position: 3 },
  ],
};

/**
 * Initialize default blueprint if none exists
 */
export async function initializeDefaultBlueprint(): Promise<void> {
  const existing = await getDefaultBlueprint('free');
  if (!existing) {
    await createBlueprint('Default Free Blueprint', defaultBlueprintTemplate, {
      description: 'Default blueprint for free plan tenants',
      isDefault: true,
      plan: 'free',
    });
    console.log('✅ Default blueprint created');
  }
}
