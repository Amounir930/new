import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as dotenv from 'dotenv';
import { Client } from 'pg';

async function applyMigration() {
  // Load .env from root
  const rootDir = join(__dirname, '../../../');
  const envPath = join(rootDir, '.env');
  console.log(`Loading env from: ${envPath}`);
  dotenv.config({ path: envPath });

  const dbUrl = process.env['DATABASE_URL'];
  if (!dbUrl) {
    console.error('DATABASE_URL not found in process.env');
    console.log(
      'Available env keys:',
      Object.keys(process.env).filter((k) => !k.startsWith('BUN'))
    );
    process.exit(1);
  }

  console.log(
    'Database URL found (masked):',
    dbUrl.replace(/:[^@]+@/, ':****@')
  );

  // Sanitize URL for local connection if needed (handling Docker hostnames vs 127.0.0.1)
  const sanitizedUrl = dbUrl
    .replace('apex-pgbouncer', '127.0.0.1')
    .replace('localhost', '127.0.0.1')
    .replace('sslmode=require', 'sslmode=disable')
    .replace('sslmode=verify-full', 'sslmode=disable');

  console.log(
    'Sanitized URL (masked):',
    sanitizedUrl.replace(/:[^@]+@/, ':****@')
  );

  console.log('Connecting to database...');
  const client = new Client({
    connectionString: sanitizedUrl,
  });

  try {
    await client.connect();
    console.log('Connected successfully.');

    const sqlPath = join(__dirname, '../drizzle/0012_central_identity.sql');
    console.log(`Reading migration: ${sqlPath}`);
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL...');
    await client.query(sql);
    console.log('✅ Migration executed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
