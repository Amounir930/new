#!/usr/bin/env bun
/**
 * S2 FIX 9A: Migration with Advisory Lock
 *
 * Prevents race conditions when multiple API replicas boot simultaneously.
 * Uses PostgreSQL advisory locks to ensure only ONE container runs migrations.
 *
 * Usage: bun scripts/migrate-with-lock.ts
 * Run this as an init-container BEFORE the API containers start.
 */

import pkg from 'pg';

const { Client } = pkg;

const LOCK_ID = 605360; // Unique advisory lock ID for 60sec.shop migrations

async function migrateWithLock() {
  const client = new Client({
    connectionString: process.env['DATABASE_URL'],
  });

  await client.connect();
  process.stdout.write('🔒 Attempting to acquire migration advisory lock...');

  try {
    // Try to acquire advisory lock (non-blocking)
    const lockResult = await client.query(
      'SELECT pg_try_advisory_lock($1) AS acquired',
      [LOCK_ID]
    );

    if (!lockResult.rows[0].acquired) {
      process.stdout.write('⏳ Another instance is running migrations. Waiting...');

      // Blocking wait for the lock
      await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
      process.stdout.write('✅ Lock acquired (previous migration finished).');

      // At this point, migrations are already done by the other instance.
      // We can safely skip.
      process.stdout.write(
        '✅ Migrations already applied by another instance. Skipping.'
      );
      return;
    }

    process.stdout.write('✅ Advisory lock acquired. Running migrations...');

    // Run Drizzle migrations
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');

    const db = drizzle(client);
    await migrate(db, {
      migrationsFolder: './packages/db/drizzle',
    });

    process.stdout.write('✅ Migrations completed successfully!');
  } catch (error) {
    process.stdout.write('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Release advisory lock
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]);
    await client.end();
    process.stdout.write('🔓 Advisory lock released.');
  }
}

migrateWithLock().catch((err) => {
  process.stdout.write('❌ Fatal migration error:', err);
  process.exit(1);
});
