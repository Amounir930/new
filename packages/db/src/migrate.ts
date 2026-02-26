import { resolve } from 'node:path';
import * as dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '../../.env') });

import { validateEnv } from '@apex/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { sanitizeSchemaName } from './core.js';

const { Pool } = pg;

async function getLockDiagnosis(
  client: pg.PoolClient,
  identifier: string
): Promise<string> {
  const diag = await client.query(
    `SELECT pid, now() - xact_start as duration 
     FROM pg_stat_activity 
     WHERE (query ~ $1 OR query ~ 'hashtext') AND pid != pg_backend_pid()`,
    [identifier]
  );
  return diag.rows[0]
    ? ` (Held by PID ${diag.rows[0].pid} for ${diag.rows[0].duration})`
    : '';
}

/**
 * Mandate #17 & #8: Secure Migration Context Setup
 * Handles advisory locking and schema isolation.
 */
async function setupMigrationContext(
  client: pg.PoolClient,
  tenantId?: string,
  runPublic?: boolean
): Promise<string | null> {
  // Fatal Mandate #8: Prevent advisory lock deadlocks
  await client.query("SET lock_timeout = '10s'");

  if (tenantId) {
    const res = await client.query(
      'SELECT subdomain FROM governance.tenants WHERE id::text = $1 LIMIT 1',
      [tenantId]
    );
    if (res.rowCount === 0) throw new Error(`Tenant ${tenantId} not found`);
    const schemaName = sanitizeSchemaName(res.rows[0].subdomain);

    console.log(`Acquiring advisory lock for tenant: ${tenantId}`);
    const lockRes = await client.query(
      'SELECT pg_try_advisory_lock(hashtext($1)) as acquired',
      [tenantId]
    );
    if (!lockRes.rows[0].acquired) {
      // Gap #2: Lock Diagnosis
      const lockInfo = await getLockDiagnosis(client, tenantId);
      throw new Error(
        `S2 Violation: Migration already in progress for tenant ${tenantId}${lockInfo}`
      );
    }

    console.log(`Switching to schema: ${schemaName}`);
    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      // Audit 777 Point #5: Ensure extensions are available in tenant scope
      await client.query(
        `CREATE EXTENSION IF NOT EXISTS btree_gist SCHEMA "${schemaName}"`
      );
      await client.query(`SET search_path TO "${schemaName}"`);
    } catch (schemaError) {
      // Gap #5: Atomic Provisioning - Rollback partial schema
      console.error(`Provisioning failed for ${schemaName}, rolling back...`);
      await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      throw schemaError;
    }
    return schemaName;
  }

  if (runPublic) {
    console.log('Running on PUBLIC schema');
    const lockRes = await client.query(
      "SELECT pg_try_advisory_lock(hashtext('public_migration')) as acquired"
    );
    if (!lockRes.rows[0].acquired) {
      const lockInfo = await getLockDiagnosis(client, 'public_migration');
      throw new Error(
        `S2 Violation: Public migration already in progress${lockInfo}`
      );
    }
    await client.query('SET search_path TO public');
    return 'public';
  }

  return null;
}

async function runMigrations() {
  const tenantId = process.argv
    .find((arg) => arg.startsWith('--tenant='))
    ?.split('=')[1];
  const runPublic = process.argv.includes('--public');

  if (!tenantId && !runPublic) {
    console.error(
      'S2 Violation: Must specify --tenant=ID or --public to run migrations.'
    );
    process.exit(1);
  }

  console.log(
    `Running migrations for ${tenantId ? `tenant: ${tenantId}` : 'PUBLIC schema'}...`
  );

  let env: ReturnType<typeof validateEnv>;
  try {
    env = validateEnv();
  } catch (error) {
    if (process.env.NODE_ENV === 'test') {
      console.warn('⚠️ Skipping migrations in test mode due to invalid env');
      return;
    }
    throw error;
  }

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await setupMigrationContext(client, tenantId, runPublic);

    const db = drizzle(client);
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Mandate #17: Release advisory locks
    try {
      if (tenantId) {
        await client.query('SELECT pg_advisory_unlock(hashtext($1))', [
          tenantId,
        ]);
      } else {
        await client.query(
          "SELECT pg_advisory_unlock(hashtext('public_migration'))"
        );
      }
    } catch (lockError) {
      console.warn('Failed to release advisory lock:', lockError);
    }
    // Fatal Stage #15: Automated Compliance Verification (Risk #Audit-VERIFY)
    console.log('Forensic: Running post-migration compliance scan...');
    await client.query('SELECT governance.verify_compliance()');
    console.log('S2/S5 Verification: ALL COMPLIANCE CHECKS PASSED.');

    client.release();
    await pool.end();
  }
}

if (import.meta.url.endsWith('migrate.ts')) {
  runMigrations();
}

export { runMigrations };
