import { resolve } from 'node:path';
import * as dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';

dotenv.config({ path: resolve(__dirname, '../../.env') });

export default {
  schema: [
    './src/schema/global.ts',
    './src/schema/storefront/*.ts',
    './src/schema/v5-core.ts',
    './src/schema/governance.ts',
    './src/schema/tenant.ts',
    './src/schema/vault.ts',
  ],
  // Risk #1: Enforce Single Source of Truth.
  // Keep ORM from managing tables defined in raw SQL baseline.
  tablesFilter: ['!pg_cron', '!audit_logs_partition_*', '!outbox_events'],
  // Audit Problem #9: Ignore custom type drift for money_amount
  // Drizzle Kit 0.30+ handles this, but we maintain strict audit compliance.
  out: './drizzle',
  dialect: 'postgresql',
  // Fatal Lock: Prevent Drizzle from attempting to manage tenant schemas
  migrations: {
    schema: 'external',
  },
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
} satisfies Config;
