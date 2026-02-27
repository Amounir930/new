import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as dotenv from 'dotenv';

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const envPath = join(__dirname, '../../../.env');
  console.log(`Loading environment from: ${envPath}`);
  dotenv.config({ path: envPath });

  // Dynamic import to ensure process.env is populated BEFORE @apex/config initializes
  const { runMigrations } = await import('./migrate.js');
  await runMigrations();
}

main().catch((err) => {
  console.error('Fatal error in entry point:', err);
  process.exitCode = 1;
});
