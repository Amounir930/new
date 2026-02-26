/**
 * Tenant Data Seeder
 * Seeds initial data (Admin user, default settings) for new stores
 */

import {
  NodePgDatabase,
  drizzle,
  eq,
  onboardingBlueprints,
  publicPool,
  sql,
  tenantQuotas,
  tenants,
} from '@apex/db';
import { BlueprintExecutor } from './blueprint/executor';
import { CatalogModule } from './blueprint/modules/catalog';
import { CoreModule } from './blueprint/modules/core';
import type { BlueprintConfig, BlueprintTemplate } from './blueprint/types';
import { sanitizeSchemaName } from './schema-manager';

export interface SeedOptions {
  subdomain: string;
  adminEmail: string;
  storeName: string;
  plan?: 'free' | 'basic' | 'pro' | 'enterprise';
  password?: string; // S7: Hashed password for admin user
  nicheType?: string; // S2.5: Industry classification
  uiConfig?: Record<string, unknown>; // S2.5: SDUI/Theme configuration
  blueprint?: BlueprintTemplate; // S3: Custom blueprint payload
}

export interface SeedResult {
  adminId: string;
  storeId: string;
  seededAt: Date;
}

/**
 * Seed initial data using the Modular Blueprint Engine
 */
export async function seedTenantData(
  options: SeedOptions
): Promise<SeedResult> {
  const schemaName = sanitizeSchemaName(options.subdomain);
  const client = await publicPool.connect();

  try {
    await client.query(`SET search_path TO "${schemaName}"`);
    const db = drizzle(client);

    const template = await resolveTemplate(options);
    const config = buildBlueprintConfig(options, template);
    const storeId = await resolveStore(db, options);

    const executor = new BlueprintExecutor();
    executor.register(new CoreModule());
    executor.register(new CatalogModule());

    await db.transaction(async (tx) => {
      await executor.execute(
        {
          subdomain: options.subdomain,
          db: tx as any, // Use transaction client
          schema: schemaName,
          plan: (options.plan || 'free') as
            | 'free'
            | 'basic'
            | 'pro'
            | 'enterprise',
          adminEmail: options.adminEmail,
          password: options.password,
          storeId: storeId,
          nicheType: config.nicheType,
          uiConfig: config.uiConfig,
        },
        config
      );
    });

    const { users } = await import('@apex/db');
    const firstUser = await db.select({ id: users.id }).from(users).limit(1);

    if (!firstUser || firstUser.length === 0) {
      throw new Error('CoreModule failed to create Admin User.');
    }

    return {
      adminId: firstUser[0].id,
      storeId,
      seededAt: new Date(),
    };
  } catch (error) {
    console.error(`Seeding failed for ${options.subdomain}:`, error);
    throw new Error(
      `Seeding Failure: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    try {
      await client.query('SET search_path TO public');
    } catch (_e) {
      // Ignore reset errors
    }
    client.release();
  }
}

/**
 * Helper to resolve blueprint template
 */
async function resolveTemplate(
  options: SeedOptions
): Promise<BlueprintTemplate> {
  if (options.blueprint) {
    return options.blueprint;
  }
  const { getDefaultBlueprint } = await import('./blueprint.js');
  const blueprintRecord = await getDefaultBlueprint(
    (options.plan || 'free') as 'free' | 'basic' | 'pro' | 'enterprise'
  );

  if (!blueprintRecord) {
    throw new Error(
      `Critical Failure (S21): No blueprint found for plan ${options.plan || 'free'}`
    );
  }
  return blueprintRecord.blueprint;
}

/**
 * Helper to build configuration
 */
function buildBlueprintConfig(
  options: SeedOptions,
  template: BlueprintTemplate
): BlueprintConfig {
  return {
    modules: { core: true, catalog: true },
    settings: { ...template.settings, site_name: options.storeName },
    pages: template.pages,
    products: template.products,
    categories: template.categories,
    nicheType: options.nicheType || template.nicheType,
    uiConfig: options.uiConfig || template.uiConfig,
  };
}

/**
 * Helper to resolve store record (Idempotency)
 */
async function resolveStore(
  db: NodePgDatabase<Record<string, unknown>>,
  options: SeedOptions
): Promise<string> {
  const { stores } = await import('@apex/db');
  const existingStore = await db
    .select({ id: stores.id })
    .from(stores)
    .limit(1);

  if (existingStore.length > 0) {
    return existingStore[0].id;
  }

  const [newStore] = await db
    .insert(stores)
    .values({
      name: options.storeName,
      subdomain: options.subdomain,
      status: 'active',
      plan: (options.plan || 'free') as 'free' | 'basic' | 'pro' | 'enterprise',
    })
    .returning({ id: stores.id });

  return newStore.id;
}

/**
 * Verify if tenant has been seeded
 * @param subdomain - Tenant subdomain
 */
export async function isSeeded(subdomain: string): Promise<boolean> {
  const { users } = await import('@apex/db');
  const schemaName = sanitizeSchemaName(subdomain);
  const client = await publicPool.connect();
  const db = drizzle(client);

  try {
    await client.query(`SET search_path TO "${schemaName}"`);
    const result = await db.select({ count: sql`count(*)` }).from(users);
    return Number(result[0].count) > 0;
  } catch (_e) {
    return false;
  } finally {
    try {
      await client.query('SET search_path TO public');
    } catch (_e) {
      // Ignore reset errors
    }
    client.release();
  }
}
