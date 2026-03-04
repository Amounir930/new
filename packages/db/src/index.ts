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

function parseAndEncodeConnectionString(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  if (!rawUrl.includes('@')) return rawUrl;

  try {
    const parsedUrl = new URL(rawUrl);
    if (parsedUrl.password) {
      // Only encode if it isn't already encoded (contains raw special chars)
      if (parsedUrl.password.includes('!') || parsedUrl.password.includes('@') || parsedUrl.password.includes('#')) {
        parsedUrl.password = encodeURIComponent(parsedUrl.password);
      }
    }
    return parsedUrl.toString();
  } catch (error) {
    // Fallback if the URL parser chokes
    return rawUrl;
  }
}

// Database URL from environment with automatic URI encoding for special characters
const connectionString = parseAndEncodeConnectionString(
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV === 'test'
    ? 'postgres://postgres:postgres@localhost:5432/postgres'
    : undefined)
);

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

/**
 * Admin Pool (High Privilege)
 * Used specifically for Governance and Provisioning tasks
 */
export const adminPool = new Pool({
  connectionString,
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
  connectionString,
  max: 50, // Higher pool for concurrent tenant requests
});

/**
 * Zero-Trust Tenant Database Access
 * Enforces RLS by setting the app.current_tenant context
 */
export async function getTenantDb(tenantId: string) {
  const client = await tenantPool.connect();

  try {
    // S2/Arch-Core-04: Enforce Tenant Isolation via RLS
    await client.query(`SELECT set_config('app.current_tenant', $1, true)`, [
      tenantId,
    ]);

    const db = drizzle(client, { schema: { ...schema, ...relations } });

    // Note: The client MUST be released when the caller is done.
    // However, to make it compatible with Drizzle's transaction pattern,
    // it's better to pass the client to drizzle and let the caller handle it or wrap it.

    return {
      db,
      release: () => client.release(),
      [Symbol.asyncDispose]: async () => client.release(),
    };
  } catch (error) {
    client.release();
    throw error;
  }
}

/**
 * Helper for Transaction-Scoped Tenant DB
 * Automatically sets the tenant context inside a transaction
 */
export async function withTenantDb<T>(
  tenantId: string,
  callback: (db: any) => Promise<T>
): Promise<T> {
  const client = await tenantPool.connect();
  try {
    await client.query(`SELECT set_config('app.current_tenant', $1, true)`, [
      tenantId,
    ]);
    const db = drizzle(client, { schema: { ...schema, ...relations } });
    return await callback(db);
  } finally {
    client.release();
  }
}
