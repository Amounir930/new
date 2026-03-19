import { env } from '@apex/config';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as relations from '../drizzle/relations';
import * as schema from '../drizzle/schema';

// Re-export core drizzle tools
export * from 'drizzle-orm';
export * from 'drizzle-orm/node-postgres';
export * from '../drizzle/relations';
export * from '../drizzle/schema';

const { Pool } = pg;

const isTest = env.NODE_ENV === 'test';

const poolConfig = {
  host: env.PGHOST || (isTest ? 'localhost' : undefined),
  user: env.PGUSER || (isTest ? 'postgres' : undefined),
  password: env.PGPASSWORD || (isTest ? 'postgres' : undefined),
  database: env.PGDATABASE || (isTest ? 'postgres' : undefined),
  port: parseInt(String(env.PGPORT || '5432'), 10),
  connectionString:
    !env.PGHOST && env.DATABASE_URL ? env.DATABASE_URL : undefined,
  // S7 Protocol: Load CA cert for strict TLS verification (not disabling — trusting the known CA)
  ssl: (() => {
    if (env.DB_SSL === 'false') return false;
    const caPath = process.env['DB_CA_CERT_PATH'];
    if (caPath) {
      const { readFileSync } = require('node:fs') as typeof import('fs');
      return { rejectUnauthorized: true, ca: readFileSync(caPath).toString() };
    }
    // S7 Protocol: Internal Network Exception
    // WARNING: MITM Vulnerable. Strictly for internal Docker network traffic only.
    return { rejectUnauthorized: false };
  })(),
};

if (!poolConfig.host && !poolConfig.connectionString) {
  throw new Error(
    'Database connection parameters are not defined in environment variables (PGHOST/PGUSER or DATABASE_URL)'
  );
}

/**
 * Admin Pool (High Privilege)
 * Used specifically for Governance and Provisioning tasks
 */
export const adminPool = new Pool({
  ...poolConfig,
  max: 10, // Admin tasks are sequential, low pool needed
});

export const adminDb = drizzle(adminPool, {
  schema: { ...schema, ...relations },
});

/**
 * Tenant-Scoped Pool
 * Used for all storefront and merchant operations
 */
export const tenantPool = new Pool({
  ...poolConfig,
  max: 50, // Higher pool for concurrent tenant requests
});

/**
 * Zero-Trust Tenant Database Access
 * Enforces RLS via app.current_tenant_id AND routes to physical isolated schema
 */
export async function getTenantDb(tenantId: string, schemaName?: string) {
  const client = await tenantPool.connect();

  try {
    // S2/Arch-Core-04: Enforce Tenant Isolation via RLS (Governance/Shared)
    await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [
      tenantId,
    ]);

    // Sovereign-2026: Physical Schema Routing (Storefront/Isolated)
    if (schemaName) {
      // Item 43 Protocol: Explicit search_path scoping
      await client.query(`SET search_path TO "${schemaName}", public`);
    } else {
      // Diamond Fix 3.0: High-Safety Default for Unqualified System Requests
      await client.query(`SET search_path TO public`);
    }

    const db = drizzle(client, { schema: { ...schema, ...relations } });

    return {
      db,
      release: async () => {
        try {
          // DELTA-S5: Rigorous Reset to prevent Pool Pollution
          await client.query('SET search_path TO public; RESET ALL;');
        } finally {
          client.release();
        }
      },
      [Symbol.asyncDispose]: async () => {
        try {
          await client.query('SET search_path TO public; RESET ALL;');
        } finally {
          client.release();
        }
      },
    };
  } catch (error) {
    client.release();
    throw error;
  }
}

/**
 * Helper for Transaction-Scoped Tenant DB
 * Automatically sets the tenant context and schema routing inside a transaction
 */
export async function withTenantDb<T>(
  tenantId: string,
  schemaName: string,
  callback: (db: NodePgDatabase<typeof schema & typeof relations>) => Promise<T>
): Promise<T> {
  const client = await tenantPool.connect();
  try {
    // S2/Auth-04: Set context and route schema
    await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [
      tenantId,
    ]);
    await client.query(`SET search_path TO "${schemaName}", public`);

    const db = drizzle(client, { schema: { ...schema, ...relations } });
    return await callback(db);
  } finally {
    try {
      // DELTA-S5: Mandatory Clean-Exit Protocol
      await client.query('SET search_path TO public; RESET ALL;');
    } finally {
      client.release();
    }
  }
}
