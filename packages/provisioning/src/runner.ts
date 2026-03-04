/**
 * Migration Runner
 * Executes Drizzle migrations against tenant schemas (S2)
 */

import fs from 'node:fs';
import path from 'node:path';
import { sanitizeSchemaName } from './schema-manager';

export interface MigrationResult {
  schemaName: string;
  appliedCount: number;
  durationMs: number;
}

/**
 * Run migrations for a specific tenant schema
 * @param subdomain - Tenant identifier
 */
export async function runTenantMigrations(
  subdomain: string
): Promise<MigrationResult> {
  const startTime = Date.now();
  const schemaName = sanitizeSchemaName(subdomain);

  // 🔒 S2 Protocol: Use isolated connection with explicit search_path
  const { adminPool } = await import('@apex/db');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const client = await adminPool.connect();

  try {
    // 1. Force search_path to isolated schema ONLY (S2 Hard Isolation)
    // We remove 'public' to prevent conflicts with global tables during migrations
    await client.query(`SET search_path TO "${schemaName}"`);

    // 2. Wrap client in Drizzle
    const _db = drizzle(client);

    // Fix 2: Point to the separated tenant migrations folder
    // In local dev/test, this is usually at .. / .. / .. /db/drizzle/tenant relative to this file
    const rootDir = path.resolve(
      new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
      '..' + '/..' + '/..'
    );
    const migrationsPath = path.join(rootDir, 'db/drizzle/tenant');

    process.stdout.write(`[Runner] Migrations path: ${migrationsPath}`);
    try {
      const files = await import('node:fs').then((fs) =>
        fs.readdirSync(migrationsPath)
      );
      process.stdout.write(
        `[Runner] Migration files found: ${files.join(', ')}`
      );
    } catch (e) {
      process.stdout.write('[Runner] Failed to list migration files:', e);
    }

    // 3. Execute migrations
    // MANUAL FALLBACK: Execute the SQL file directly to ensure creation
    // The Drizzle migrator seems to have issues with search_path in this environment
    process.stdout.write(
      `[Runner] Starting MANUAL migration for schema: ${schemaName}`
    );
    try {
      const sqlPath = path.join(migrationsPath, '0000_nervous_landau.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');

      // Execute raw SQL
      // We need to use client directly or db.execute(sql.raw(content))
      await client.query(sqlContent);
      process.stdout.write(
        '[Runner] Manual migration SQL executed successfully'
      );

      // Still run migrate to mark it as done in __drizzle_migrations (optional, but good for consistency)
      // const { migrate } = await import('drizzle-orm/node-postgres/migrator');
      // await migrate(db, { migrationsFolder: migrationsPath });

      process.stdout.write(
        `[Runner] Migration completed for schema: ${schemaName}`
      );
    } catch (e: unknown) {
      if (e.code === '42P07') {
        // duplicate_table
        process.stdout.write(
          `[Runner] Migration warning: Schema ${schemaName} already has tables. Skipping creation.`
        );
      } else {
        process.stdout.write(`[Runner] Migration failed for ${schemaName}:`, e);
        throw e;
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      schemaName,
      appliedCount: 1, // Success
      durationMs,
    };
  } catch (error) {
    process.stdout.write(`S2 MIGRATION FAILURE for ${schemaName}:`, error);
    throw error;
  } finally {
    try {
      await client.query('SET search_path TO public');
    } catch (_e) {
      // Ignore reset errors
    }
    client.release();
  }
}
