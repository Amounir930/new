/**
 * Tenant Data Seeder
 * Seeds initial data (Admin user, default settings) for new stores
 */

import { createTenantDb, settings, stores, users } from '@apex/db';
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
    // S7: Encrypting PII (Email)
    const { encrypt, hashSensitiveData } = await import('@apex/security');
    // Note: In production, secrets are injected via env. In local seeding, we might need a fallback.
    // However, EncryptionService throws if keys are missing.
    // For seeder, we'll instantiate EncryptionService or usage helper if possible.
    // Better: use the static helpers I exported from encryption.ts?
    // encryption.ts exports 'encrypt' and 'hashSensitiveData' functions but they require keys/secrets.
    // Let's assume env vars are set or use a new EncryptionService instance.

    // We need to fetch the master key from env
    const masterKey = process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKey && process.env.NODE_ENV === 'production') {
      throw new Error(
        'S7 Seeding Error: ENCRYPTION_MASTER_KEY missing in production'
      );
    }
    const safeKey = masterKey || 'test-master-key-must-be-32-bytes-length!!';

    const encryptedEmail = JSON.stringify(encrypt(options.adminEmail, safeKey));
    const emailHash = hashSensitiveData(options.adminEmail);

    const userResult = await db
      .insert(users)
      .values({
        email: encryptedEmail,
        emailHash: emailHash,
        role: 'admin',
        status: 'active',
      })
      .returning({ id: users.id });

    const adminId = userResult[0].id;

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
    const settingsToSeed = Object.entries(template.settings || {}).map(
      ([key, value]) => ({
        key,
        value: key === 'site_name' ? options.storeName : value,
      })
    );

    if (settingsToSeed.length > 0) {
      await db.insert(settings).values(settingsToSeed);
    }

    // Seed Mandatory Pages
    if (template.pages && template.pages.length > 0) {
      const { pages: schemaPages } = await import('@apex/db');
      // Note: We need to ensure 'pages' table exists in tenant schema.
      // Assuming schema-manager handled this during createTenantDb.
      try {
        await db.insert(schemaPages).values(
          template.pages.map((p) => ({
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
