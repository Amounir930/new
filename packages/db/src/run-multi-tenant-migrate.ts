/**
 * @apex/db — Multi-Tenant Migration Runner
 * 
 * Securely applies SQL migrations across all isolated tenant schemas (S2 Protocol).
 * Iterates through all schemas matching 'tenant_%' and executes migrations in order.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from '@apex/config';
import pg from 'pg';

const { Client } = pg;
const DATABASE_URL = env.DATABASE_URL;

if (!DATABASE_URL) {
  process.stderr.write('❌ FATAL: DATABASE_URL is not defined.\n');
  process.exit(1);
}

const DRIZZLE_DIR = join(import.meta.dir, '..', 'drizzle');

/**
 * Get ordered list of SQL migration files
 */
function getSqlFiles(): string[] {
  return readdirSync(DRIZZLE_DIR)
    .filter((f) => f.endsWith('.sql') && f !== 'relations.ts' && f !== 'schema.ts')
    .sort();
}

/**
 * Execute migrations across all tenant schemas
 */
async function runMultiTenantMigrations() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    process.stdout.write('✅ Connected to database.\n');

    // 1. Fetch all tenant schemas
    const schemaResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      ORDER BY schema_name
    `);
    
    const schemas = schemaResult.rows.map(r => r.schema_name);
    process.stdout.write(`📋 Found ${schemas.length} tenant schemas to process.\n`);

    const files = getSqlFiles();
    process.stdout.write(`📜 Found ${files.length} migration files to apply.\n`);

    for (const schemaName of schemas) {
      process.stdout.write(`\n🚀 Processing Schema: ${schemaName}\n`);

      // Ensure the schema has its own migration tracking table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".apex_migrations (
          id          SERIAL PRIMARY KEY,
          filename    TEXT NOT NULL UNIQUE,
          applied_at  TIMESTAMPTZ DEFAULT now() NOT NULL
        );
      `);

      for (const filename of files) {
        // Check if already applied to THIS tenant
        const checkResult = await client.query(
          `SELECT 1 FROM "${schemaName}".apex_migrations WHERE filename = $1`,
          [filename]
        );

        if (checkResult.rowCount && checkResult.rowCount > 0) {
          process.stdout.write(`  ⏭️  SKIP  ${filename} (already applied)\n`);
          continue;
        }

        const sql = readFileSync(join(DRIZZLE_DIR, filename), 'utf-8');
        process.stdout.write(`  ⏳ APPLY ${filename} ... `);

        try {
          await client.query('BEGIN');
          
          // CRITICAL S2: Scope execution to tenant schema
          await client.query(`SET search_path TO "${schemaName}", "public"`);
          
          // Execute migration SQL
          await client.query(sql);

          // Track migration
          await client.query(
            `INSERT INTO "${schemaName}".apex_migrations (filename) VALUES ($1)`,
            [filename]
          );

          await client.query('COMMIT');
          process.stdout.write(`✅ DONE\n`);
        } catch (err) {
          await client.query('ROLLBACK');
          process.stderr.write(`❌ FAILED ${filename}: ${String(err)}\n`);
          process.stderr.write(`🛑 Rollback complete for ${schemaName}. Continuing to next tenant...\n`);
          // We continue to next tenant even if one fails to isolate failures (S2 Protocol)
          break; 
        } finally {
          await client.query('SET search_path TO public');
        }
      }
    }

    process.stdout.write('\n🎉 Multi-tenant migrations cycle completed.\n');
  } finally {
    await client.end();
  }
}

runMultiTenantMigrations().catch(err => {
  process.stderr.write(`❌ UNHANDLED ERROR: ${String(err)}\n`);
  process.exit(1);
});
