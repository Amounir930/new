import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Config for TENANT schema migrations
 * Generates migrations for tenant-specific tables ONLY
 */
export default defineConfig({
  schema: './src/schema/tenant.ts',
  out: './drizzle/tenant',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://apex:apex_dev@localhost:5432/apex_v2',
  },
  verbose: true,
  strict: true,
});
