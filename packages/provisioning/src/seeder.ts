/**
 * Tenant Data Seeder
 * Seeds initial data (Admin user, default settings) for new stores
 */

import {
  adminDb,
  adminPool,
  drizzle,
  eq,
  type NodePgDatabase,
  sql,
  tenantsInGovernance,
  tenantQuotasInGovernance,
} from '@apex/db';
import { encrypt, hashSensitiveData } from '@apex/security';
import { BlueprintExecutor } from './blueprint/executor';
import { CatalogModule } from './blueprint/modules/catalog';
import { CoreModule } from './blueprint/modules/core';
import type { BlueprintConfig, BlueprintTemplate } from './blueprint/types';
import { sanitizeSchemaName } from './schema-manager';

export interface SeedOptions {
  subdomain: string;
  adminEmail: string;
  adminId: string; // S7: Central Identity UUID
  storeName: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise'; // S21: Plan is now MANDATORY
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

  // S2/Arch-Core-04: Use adminPool for global provisioning but specify tenant during seed
  const client = await adminPool.connect();

  try {
    // S2 Protocol: Strict Usage of Search Path for tenant creation
    await client.query(`SET search_path TO "${schemaName}"`);

    // For seeding, we use high-privilege admin context but scoped to schema
    const _db = adminDb; // Reuse adminDb instance but it uses the pool's client when pooled?
    // Actually, drizzle(client) is safer when manually setting search_path on a specific client
    const tenantScopedAdminDb = drizzle(client);

    const template = await resolveTemplate(options);
    const config = buildBlueprintConfig(options, template);

    // Note: resolveStore needs to check governance/public registry
    const storeId = await resolveStore(tenantScopedAdminDb, options);

    const executor = new BlueprintExecutor();
    
    // 1. Mandatory Core Injection (Sovereign Mandate)
    // CoreModule is NEVER optional as it establishes the merchant identity.
    executor.register(new CoreModule());

    // 2. Dynamic Register (Selective Feature Empowerment)
    // Only register backend modules permitted by the Blueprint.
    // Frontend pages (pdp, cart, etc.) are NOT registered here.
    const moduleRegistry: Record<string, any> = {
      catalog: CatalogModule,
    };

    for (const [moduleName, enabled] of Object.entries(config.modules)) {
      if (enabled && moduleRegistry[moduleName]) {
        executor.register(new moduleRegistry[moduleName]());
      }
    }

    await tenantScopedAdminDb.transaction(async (tx) => {
      // S2/Auth-04: Ensure the transaction also knows about the tenant context for RLS-protected tables
      await tx.execute(
        sql`SELECT set_config('app.current_tenant_id', ${storeId}, true)`
      );

      await executor.execute(
        {
          subdomain: options.subdomain,
          db: tx,
          schema: schemaName,
          plan: options.plan as
            | 'free'
            | 'basic'
            | 'pro'
            | 'enterprise',
          adminEmail: options.adminEmail,
          adminId: options.adminId,
          password: options.password,
          storeId: storeId,
          nicheType: config.nicheType,
          uiConfig: config.uiConfig,
        },
        config
      );
    });

    // S2/Auth-04: Set current_tenant_id before verification query to bypass RLS in Governance
    await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [
      storeId,
    ]);

    // S2 FIX: Admin Verification Blindspot - Querying the active search path directly
    // bypasses Drizzle's rigid schema-bound object (which targets the default 'storefront')
    const firstUser = await tenantScopedAdminDb.execute(
      sql`SELECT id FROM "staff_members" LIMIT 1`
    );

    if (!firstUser || !firstUser.rows || firstUser.rows.length === 0) {
      throw new Error(
        `CoreModule failed to create Admin User - Record not found in tenant schema ${schemaName}.`
      );
    }

    return {
      adminId: options.adminId, // Return the central ID mapped to this tenant
      storeId,
      seededAt: new Date(),
    };
  } catch (error) {
    process.stdout.write(
      `Seeding failed for ${options.subdomain}: ${String(error)}`
    );
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
  const { getDefaultBlueprint } = await import('./blueprint');
  const blueprintRecord = await getDefaultBlueprint(
    options.plan as 'free' | 'basic' | 'pro' | 'enterprise'
  );

  if (!blueprintRecord) {
    throw new Error(
      `Critical Failure (S21): No blueprint found for plan ${options.plan ?? 'free'}`
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
    // S21 FIX: Remove hardcoded modules. Use Blueprint's logical configuration.
    modules: template.modules,
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
  _db: NodePgDatabase<Record<string, unknown>>,
  options: SeedOptions
): Promise<string> {
  // Check global registry first
  const [existingTenant] = await adminDb
    .select({ id: tenantsInGovernance.id })
    .from(tenantsInGovernance)
    .where(eq(tenantsInGovernance.subdomain, options.subdomain))
    .limit(1);

  if (existingTenant) {
    return existingTenant.id;
  }

  // 1. Insert Tenant
  const encResult = encrypt(options.adminEmail);
  const emailHash = hashSensitiveData(options.adminEmail);

  const [newStore] = await adminDb
    .insert(tenantsInGovernance)
    .values({
      name: options.storeName,
      subdomain: options.subdomain,
      status: 'active',
      plan: options.plan as 'free' | 'basic' | 'pro' | 'enterprise',
      nicheType: (options.nicheType || 'retail') as string,
      ownerEmail: JSON.stringify(encResult),
      ownerEmailHash: emailHash,
    })
    .returning({ id: tenantsInGovernance.id });

  // 2. S21 MANDATE: Logic Isolation - Seed Quotas from Blueprint!
  const template = await resolveTemplate(options);
  const quotas = template.quotas as any; // Map Blueprint quotas to Governance schema

  await adminDb.insert(tenantQuotasInGovernance).values({
    tenantId: newStore.id,
    maxProducts: quotas.max_products || 50,
    maxOrders: quotas.max_orders || 100,
    maxStaff: quotas.max_staff || 1,
    maxPages: quotas.max_pages || 5,
    maxCategories: quotas.max_categories || 10,
    maxCoupons: quotas.max_coupons || 0,
    storageLimitGb: quotas.storage_limit_gb || 1,
    apiRateLimit: quotas.api_rate_limit || 60,
  });

  return newStore.id;
}

/**
 * Verify if tenant has been seeded
 * @param subdomain - Tenant subdomain
 */
export async function isSeeded(subdomain: string): Promise<boolean> {
  const schemaName = sanitizeSchemaName(subdomain);
  const client = await adminPool.connect();

  try {
    const { drizzle, staffMembersInStorefront } = await import('@apex/db');
    await client.query(`SET search_path TO "${schemaName}"`);
    const db = drizzle(client);
    const result = await db
      .select({ count: sql`count(*)` })
      .from(staffMembersInStorefront);
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
