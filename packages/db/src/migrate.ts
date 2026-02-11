import { validateEnv } from '@apex/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pkg from 'pg';

const { Pool } = pkg;

async function runMigrations() {
  console.log('Running migrations...');

  let env: any;
  try {
    env = validateEnv();
  } catch (error) {
    if (process.env.NODE_ENV === 'test') {
      console.warn('⚠️ Skipping migrations in test mode due to invalid env');
      return;
    }
    throw error;
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    // This will run all migrations from the migrations folder
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Only auto-run if this script is executed directly
if (import.meta.url.endsWith('migrate.ts') || process.env.NODE_ENV !== 'test') {
  runMigrations();
}

export { runMigrations };
