/**
 * Tenant Data Seeder
 * Seeds initial data (Admin user, default settings) for new stores
 */

import {
  categories,
  createTenantDb,
  products,
  settings,
  stores,
  users,
} from '@apex/db';
import { sql } from 'drizzle-orm';

export interface SeedOptions {
  subdomain: string;
  adminEmail: string;
  storeName: string;
  plan?: string;
}

export interface SeedResult {
  adminId: string;
  storeId: string;
  seededAt: Date;
}

/**
 * Seed initial data for a new tenant
 * @param options - Seeding
 * configuration
 * @returns Seeding metadata
 */
export async function seedTenantData(
  options: SeedOptions
): Promise<SeedResult> {
  const db = createTenantDb(options.subdomain);

  try {
    // 1. Create Default Store Record
    const storeResult = await db
      .insert(stores)
      .values({
        name: options.storeName,
        subdomain: options.subdomain,
        status: 'active',
        plan: 'free',
      })
      .returning({ id: stores.id });

    const storeId = storeResult[0].id;

    // 2. Create Initial Admin User
    const adminId = await seedAdminUser(db, options.adminEmail);

    // 3. Seed Default Settings & Pages from Blueprint
    const { getDefaultBlueprint } = await import('./blueprint.js');

    // Fetch the default blueprint for the plan (defaults to 'free' if not provided)
    const blueprintRecord = await getDefaultBlueprint(options.plan || 'free');

    if (!blueprintRecord) {
      throw new Error(
        `S21 Critical Failure: No blueprint found for plan ${options.plan || 'free'}`
      );
    }

    const template = blueprintRecord.blueprint;

    // Seed Settings
    await seedSettings(db, template.settings, options.storeName);

    // Seed Mandatory Pages
    await seedPages(db, template.pages);

    // 4. Seed Categories (Super-#21)
    const categoryMap = await seedCategories(db, template.categories);

    // 5. Seed Products (Super-#21)
    await seedProducts(db, template.products, categoryMap);

    return {
      adminId,
      storeId,
      seededAt: new Date(),
    };
  } catch (error) {
    console.error(`Seeding failed for ${options.subdomain}:`, error);
    throw new Error(
      `Seeding Failure: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function seedAdminUser(db: any, email: string): Promise<string> {
  // S7: Encrypting PII (Email)
  const { encrypt, hashSensitiveData } = await import('@apex/security');

  // We need to fetch the master key from env
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;
  if (!masterKey && process.env.NODE_ENV === 'production') {
    throw new Error(
      'S7 Seeding Error: ENCRYPTION_MASTER_KEY missing in production'
    );
  }
  const safeKey = masterKey || 'test-master-key-must-be-32-bytes-length!!';

  const encryptedEmail = JSON.stringify(encrypt(email, safeKey));
  const emailHash = hashSensitiveData(email);

  const userResult = await db
    .insert(users)
    .values({
      email: encryptedEmail,
      emailHash: emailHash,
      role: 'admin',
      status: 'active',
    })
    .returning({ id: users.id });

  return userResult[0].id;
}

async function seedSettings(
  db: any,
  settingsData: Record<string, string> | undefined,
  storeName: string
) {
  const settingsToSeed = Object.entries(settingsData || {}).map(
    ([key, value]) => ({
      key,
      value: key === 'site_name' ? storeName : value,
    })
  );

  if (settingsToSeed.length > 0) {
    await db.insert(settings).values(settingsToSeed);
  }
}

async function seedPages(db: any, pagesList: any[] | undefined) {
  if (pagesList && pagesList.length > 0) {
    const { pages: schemaPages } = await import('@apex/db');
    try {
      await db.insert(schemaPages).values(
        pagesList.map((p) => ({
          ...p,
          content: p.content || '',
        }))
      );
    } catch (_e) {
      console.warn(
        'Could not seed pages, table might not exist in tenant schema yet'
      );
    }
  }
}

async function seedCategories(
  db: any,
  categoriesList: any[] | undefined
): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>(); // slug -> id
  if (categoriesList && categoriesList.length > 0) {
    try {
      const categoriesToInsert = categoriesList.map((c) => ({
        name: c.name,
        slug: c.slug,
        description: c.description,
        isActive: true,
      }));

      const insertedCategories = await db
        .insert(categories)
        .values(categoriesToInsert)
        .returning({ id: categories.id, slug: categories.slug });

      for (const cat of insertedCategories) {
        categoryMap.set(cat.slug, cat.id);
      }
    } catch (e) {
      console.warn('Failed to seed categories:', e);
    }
  }
  return categoryMap;
}

async function seedProducts(
  db: any,
  productsList: any[] | undefined,
  categoryMap: Map<string, string>
) {
  if (productsList && productsList.length > 0) {
    try {
      const productsToInsert = productsList.map((p) => ({
        name: p.name,
        slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: p.description,
        price: p.price.toString(),
        currency: 'USD', // Default
        categoryId: p.category
          ? categoryMap.get(p.category.toLowerCase())
          : null,
        inventory: p.inventory || 0,
        isActive: true,
      }));

      await db.insert(products).values(productsToInsert);
    } catch (e) {
      console.warn('Failed to seed products:', e);
    }
  }
}

/**
 * Verify if tenant has been seeded
 * @param subdomain - Tenant subdomain
 */
export async function isSeeded(subdomain: string): Promise<boolean> {
  const db = createTenantDb(subdomain);
  try {
    const result = await db.select({ count: sql`count(*)` }).from(users);
    return Number(result[0].count) > 0;
  } catch (_e) {
    return false;
  }
}
