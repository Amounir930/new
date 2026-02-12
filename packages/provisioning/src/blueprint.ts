/**
 * Super-#21: Onboarding Blueprint Editor
 * Constitution Reference: plan.md (Super-#21)
 * Purpose: JSON editor UI in Super Admin for tenant provisioning templates
 */

import { onboardingBlueprints, publicDb } from '@apex/db';
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
  name: 'Master Core Blueprint',
  description: 'Mandatory base data for all 51 core features',
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
    { slug: 'home', title: 'Home Page', content: 'Welcome to our store', isPublished: true },
    { slug: 'search', title: 'Search Results', content: 'Search for products', isPublished: true },
    { slug: 'cart', title: 'Shopping Cart', content: 'Your selected items', isPublished: true },
    { slug: 'checkout', title: 'Checkout', content: 'Complete your purchase', isPublished: true },
    { slug: 'order-success', title: 'Order Confirmed', content: 'Thank you for your order!', isPublished: true },
    { slug: 'payment-failure', title: 'Payment Failed', content: 'Please try another payment method', isPublished: true },
    { slug: 'about-us', title: 'About Us', content: 'Our story and mission', isPublished: true },
    { slug: 'contact-us', title: 'Contact Us', content: 'Get in touch with us', isPublished: true },
    { slug: 'privacy-policy', title: 'Privacy Policy', content: 'How we handle your data', isPublished: true },
    { slug: 'terms-conditions', title: 'Terms & Conditions', content: 'Rules for using our store', isPublished: true },
    { slug: 'refund-policy', title: 'Refund Policy', content: 'Our return and refund rules', isPublished: true },
    { slug: 'faq', title: 'FAQ', content: 'Frequently asked questions', isPublished: true },
    { slug: 'blog', title: 'Blog', content: 'Latest articles and news', isPublished: true },
    { slug: 'store-locations', title: 'Store Locations', content: 'Find us near you', isPublished: true },
    { slug: 'track-order', title: 'Track Order', content: 'Track your shipment status', isPublished: true },
    { slug: 'wishlist', title: 'My Wishlist', content: 'Your favorite items', isPublished: true },
    { slug: 'wallet', title: 'My Wallet', content: 'Your balance and credits', isPublished: true },
    { slug: 'loyalty', title: 'Loyalty Program', content: 'Earn and spend points', isPublished: true },
    { slug: 'referral', title: 'Refer a Friend', content: 'Invite friends and earn rewards', isPublished: true },
  ],
  categories: [
    { name: 'General', slug: 'general', description: 'General products' },
    { name: 'Fashion', slug: 'fashion', description: 'Clothing and accessories' },
  ],
  settings: {
    // Basic Info
    site_name: 'My Apex Store',
    currency: 'USD',
    timezone: 'UTC',
    maintenance_mode: 'false',

    // Feature Toggles (Global Defaults)
    feature_whatsapp_float: 'true',
    feature_newsletter_popup: 'true',
    feature_cookie_consent: 'true',
    feature_mega_menu: 'true',
    feature_quick_view: 'true',
    feature_smart_filters: 'true',
    feature_toast_notifications: 'true',
    feature_social_wall: 'false',
    feature_out_of_stock_notify: 'true',
    feature_ai_personalization: 'false',
    feature_bnpl_enabled: 'false',
    feature_size_guide_enabled: 'true',
    feature_gift_hub_enabled: 'true',
    feature_order_timeline_visible: 'true',

    // Contact Info
    contact_email: 'support@example.com',
    contact_phone: '+123456789',
    whatsapp_number: '+123456789',
  },
  sampleOrders: false,
  navigation: [
    { label: 'Home', url: '/', position: 1 },
    { label: 'Products', url: '/products', position: 2 },
    { label: 'About', url: '/about-us', position: 3 },
    { label: 'Contact', url: '/contact-us', position: 4 },
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
