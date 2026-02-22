import { env } from '@apex/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Config for PUBLIC schema migrations
 * Generates migrations for global system tables ONLY
 */
export default defineConfig({
  schema: './src/schema/public.ts',
  out: './drizzle/public',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      env.DATABASE_URL ||
      'postgresql://apex:apex_dev@localhost:5432/apex_v2',
  },
  verbose: true,
  strict: true,
});
