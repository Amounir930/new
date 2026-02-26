/**
 * S2: Tenant Isolation Protocol - Connection Management
 * Only RAW connection/pool initialization to ensure NO circular dependencies.
 */

import { env } from '@apex/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import type { PoolClientLike } from './types.js';

const { Pool } = pkg;

export const poolConfig: pkg.PoolConfig = {
  connectionString: env.DATABASE_URL,
  max: 15,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000,
  statement_timeout: 30000,
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

export const publicPool = new Pool(poolConfig);

publicPool.on('connect', (client: pkg.PoolClient) => {
  client
    .query(
      "SET search_path TO public; SET TIME ZONE 'UTC'; SET lock_timeout = '30s'; SELECT 1"
    )
    .catch((err) => console.error('S2: Pool validation failed:', err));
});

publicPool.on('error', (err) => {
  console.error('S2: Unexpected error on idle client:', err);
});

publicPool.on('release', (_err: Error | undefined, client: PoolClientLike) => {
  if (client) {
    try {
      client
        .query('RESET ALL; SET search_path TO public')
        .catch((resetErr: unknown) => {
          console.error(
            'S2 Critical: Reset failed, destroying connection:',
            resetErr
          );
          client.release(true);
        });
    } catch (syncErr) {
      console.error('S2 Critical: Synchro reset failure:', syncErr);
      client.release(true);
    }
  }
});

export const readPool = new Pool({
  ...poolConfig,
  connectionString: env.READ_REPLICA_URL || env.DATABASE_URL,
  max: 50,
});

export const publicDb = drizzle(publicPool);
export const readDb = drizzle(readPool);
export const db = publicDb;

/**
 * Legacy alias for backward compatibility.
 */
export const dbClientFactory = {
  createClient: () => publicPool,
};
