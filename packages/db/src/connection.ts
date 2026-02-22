/**
 * S2: Tenant Isolation Protocol - Connection Management
 * Extracted to break circular dependencies with TenantRegistryService
 */

import { env } from '@apex/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';

const { Pool } = pkg;

// S1: Environment is already validated and exported by @apex/config
// No need for local validation logic here.

export const poolConfig: pkg.PoolConfig = {
  connectionString: env.DATABASE_URL,
  ssl:
    env.NODE_ENV === 'production' && env.DB_SSL !== 'false'
      ? { rejectUnauthorized: false }
      : false,
};

if (env.POSTGRES_USER) poolConfig.user = env.POSTGRES_USER;
if (env.POSTGRES_PASSWORD)
  poolConfig.password = env.POSTGRES_PASSWORD;
if (env.POSTGRES_DB) poolConfig.database = env.POSTGRES_DB;

// Connection pool for public schema (tenant management)
export const publicPool = new Pool(poolConfig);

// Drizzle instance for public schema
export const publicDb = drizzle(publicPool);

// Generic alias for main DB operations (Rule S2 context)
export const db = publicDb;
