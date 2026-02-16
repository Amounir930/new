/**
 * Blueprint Validator (Frontend)
 * Mirrors logic from @apex/provisioning/src/blueprint.ts
 */

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
