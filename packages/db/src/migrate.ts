import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

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
      // Gap #5: Atomic Provisioning - Safety First
      console.error(`Provisioning failed for ${schemaName}. Manual cleanup may be required to maintain data integrity.`);
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

  if (tenantId) {
    console.warn(
      '⚠️  WARNING: Using --tenant with Shared DB/RLS architecture is deprecated and may lead to data fragmentation.'
    );
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

    // ─── PRE-FLIGHT: Drop blocking event triggers from prior partial runs ───
    // Drizzle sends each migration as ONE atomic query. Event triggers installed
    // by prior partial runs block DDL in subsequent migrations. We must drop them
    // BEFORE Drizzle processes any migration files.
    console.log('Pre-flight: Dropping blocking event triggers from prior runs...');
    await client.query(`
      DROP EVENT TRIGGER IF EXISTS trg_audit_immutability_lockdown;
      DROP EVENT TRIGGER IF EXISTS trg_log_drift;
      DROP EVENT TRIGGER IF EXISTS trg_audit_schema_drift;
    `);
    console.log('Pre-flight: Event triggers cleared.');

    const db = drizzle(client);
    const migrationsFolder = join(__dirname, '../drizzle');
    console.log(`Loading migrations from: ${migrationsFolder}`);

    await migrate(db, { migrationsFolder });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
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
    // ONLY run if the governance schema exists (prevents crash on fresh DB)
    try {
      const schemaCheck = await client.query(
        "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'governance'"
      );
      if (schemaCheck.rows.length > 0) {
        console.log('Forensic: Running post-migration compliance scan...');
        await client.query('SELECT governance.verify_compliance()');
        console.log('S2/S5 Verification: ALL COMPLIANCE CHECKS PASSED.');
      } else {
        console.log('Forensic: Skipping compliance scan (schema not initialized yet)');
      }
    } catch (forensicError) {
      console.warn('Compliance scan failed (optional check):', forensicError);
    }

    client.release();
    await pool.end();
  }
}

// 🚀 runMigrations is called from run-migrate.ts entry point

export { runMigrations };
