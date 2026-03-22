/**
 * @apex/db — Database Migration Runner
 *
 * Single Source of Truth: drizzle/ folder
 * Run this script on a FRESH database to apply all schema files in order.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... bun run db:migrate
 *
 * Migration Order:
 *   0001_baseline.sql       → Core schema, types, extensions
 *   0002-0011_*.sql         → Incremental security and feature patches
 *
 * NOTE: 0000_handy_whizzer.sql is intentionally SKIPPED (it is a
 * commented-out introspection snapshot, not meant for execution).
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from '@apex/config';
import pg from 'pg';

const { Client } = pg;

const DATABASE_URL = env.DATABASE_URL;

if (!DATABASE_URL) {
  process.stdout.write('❌ FATAL: DATABASE_URL is not defined.');
  process.exit(1);
}

// Ordered list of SQL files to apply (0000 is intentionally excluded)
const DRIZZLE_DIR = join(import.meta.dir, '..', 'drizzle');

function getSqlFiles(): string[] {
  const all = readdirSync(DRIZZLE_DIR)
    .filter((f) => f.endsWith('.sql') && !f.startsWith('master_rollback'))
    .sort();

  // Exclude 0000 (commented-out introspection snapshot)
  return all.filter((f) => !f.startsWith('0000_'));
}

async function runMigrations() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    process.stdout.write('✅ Connected to database.');

    // Create migration tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.apex_migrations (
        id          SERIAL PRIMARY KEY,
        filename    TEXT NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ DEFAULT now() NOT NULL
      );
    `);

    const files = getSqlFiles();
    process.stdout.write(
      `📋 Found ${files.length} migration files to process.\n`
    );

    for (const filename of files) {
      // Check if already applied
      const result = await client.query(
        'SELECT 1 FROM public.apex_migrations WHERE filename = $1',
        [filename]
      );

      if (result.rowCount && result.rowCount > 0) {
        process.stdout.write(`⏭️  SKIP  ${filename} (already applied)`);
        continue;
      }

      const filePath = join(DRIZZLE_DIR, filename);
      const sql = readFileSync(filePath, 'utf-8');

      process.stdout.write(`⏳ APPLY ${filename} ...`);

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO public.apex_migrations (filename) VALUES ($1)',
          [filename]
        );
        await client.query('COMMIT');
        process.stdout.write(`✅ DONE  ${filename}`);
      } catch (err) {
        await client.query('ROLLBACK');
        process.stdout.write(`❌ FAILED ${filename}: ${String(err)}`);
        process.stdout.write(
          '\n🛑 Migration aborted. Fix the error above and re-run.'
        );
        process.exit(1);
      }
    }

    process.stdout.write('\n🎉 All migrations applied successfully.');
  } finally {
    await client.end();
  }
}

runMigrations();
