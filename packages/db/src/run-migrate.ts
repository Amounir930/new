import { resolve } from 'node:path';
import * as dotenv from 'dotenv';

async function main() {
  const envPath = resolve(process.cwd(), '../../.env');
  console.log(`Loading environment from: ${envPath}`);
  dotenv.config({ path: envPath });

  // Dynamic import to ensure process.env is populated BEFORE @apex/config initializes
  const { runMigrations } = await import('./migrate.js');
  await runMigrations();
}

main().catch((err) => {
  console.error('Fatal error in entry point:', err);
  process.exit(1);
});
