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
  max: 15, // Fatal Mandate #35: Compatibility with PgBouncer/Microservices
  idleTimeoutMillis: 10000, // Fatal Mandate #38: Aggressively free RAM in Node.js layer
  connectionTimeoutMillis: 2000,
  statement_timeout: 30000, // Fatal Mandate #16: Production-grade timeout for migrations
  ssl:
    env.NODE_ENV === 'production' && env.DB_SSL !== 'false'
      ? {
        rejectUnauthorized: true,
        ca: env.DB_CA_CERT || undefined,
      }
      : false,
};

if (env.POSTGRES_USER) poolConfig.user = env.POSTGRES_USER;
if (env.POSTGRES_PASSWORD) poolConfig.password = env.POSTGRES_PASSWORD;
if (env.POSTGRES_DB) poolConfig.database = env.POSTGRES_DB;

// Connection pool for public schema (tenant management)
export const publicPool = new Pool(poolConfig);

// Mandate #38: Pool Life-cycle Validation
publicPool.on('connect', (client: pkg.PoolClient) => {
  // Risk #19: Set lock_timeout on connection since it's not a PoolConfig property
  // We also set the search_path to public as a safe default for new connections.
  client
    .query(
      "SET search_path TO public; SET TIME ZONE 'UTC'; SET lock_timeout = '30s'; SELECT 1"
    )
    .catch((err) => console.error('S2: Pool validation failed:', err));
});

publicPool.on('error', (err) => {
  console.error('S2: Unexpected error on idle client:', err);
});

/**
 * Fatal Mandate #38: Pool Poisoning Backstop (Risk #5)
 * Ensures every client returned to the pool is surgically cleaned.
 */
publicPool.on('release', (_err: any, client: any) => {
  // Risk #5: Absolute forensic reset including error paths
  if (client) {
    client
      .query('RESET ALL; SET search_path TO public')
      .catch((resetErr: any) => {
        console.error(
          'S2 Critical: Forensic reset failed, destroying connection:',
          resetErr
        );
        client.release(true); // Force destruction on any reset failure
      });
  }
});

// Mandate #34: Read-Replica connection splitting
export const readPool = new Pool({
  ...poolConfig,
  connectionString: (env as any).READ_REPLICA_URL || env.DATABASE_URL,
  max: 50, // Risk #Pool-S01: Capped to 50 per auditor mandate to prevent replica exhaustion
});

/**
 * Fatal Mandate #34: Read Pool Forensic Reset
 */
readPool.on('release', (_err: any, client: any) => {
  if (client) {
    client
      .query('RESET ALL; SET search_path TO public')
      .catch((resetErr: any) => {
        console.error(
          'S2 Critical: Read pool reset failed, destroying:',
          resetErr
        );
        client.release(true);
      });
  }
});

// Drizzle instance for public schema
export const publicDb = drizzle(publicPool);
export const readDb = drizzle(readPool);

// Generic alias for main DB operations (Rule S2 context)
export const db = publicDb;
