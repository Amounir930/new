/**
 * S2: Tenant Isolation Protocol - Core Logic
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';

const { Client } = pkg;

import { poolConfig, publicDb, publicPool } from './connection.js';

/**
 * Verify tenant exists before allowing connection
 * S2: Prevents access to non-existent tenant schemas
 */
export async function verifyTenantExists(tenantId: string): Promise<boolean> {
  try {
    // S1: safe - Querying tenants table via publicPool which uses public schema
    // This is required for S2 tenant isolation verification
    const result = await publicPool.query(
      'SELECT 1 FROM tenants WHERE id::text = $1 OR subdomain = $1 LIMIT 1',
      [tenantId]
    );
    return (result.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Sanitize subdomain to valid PostgreSQL schema name
 * @param subdomain - Raw subdomain
 * @returns Valid schema name (tenant_{sanitized})
 */
export function sanitizeSchemaName(subdomain: string): string {
  const clean = subdomain.toLowerCase().trim();

  // Strict S2 Validation: Reject special characters
  if (!/^[a-z0-9_-]+$/.test(clean)) {
    throw new Error('Invalid subdomain');
  }

  // PG identifiers can't start with numbers (but we prefix with tenant_ so it's usually safe)
  const sanitized = clean.replace(/^[0-9]/, '_$&');

  if (sanitized.length < 3) {
    throw new Error('Invalid subdomain: too short');
  }

  if (sanitized.length > 50) {
    throw new Error('Invalid subdomain: exceeds 50 character limit');
  }

  return `tenant_${sanitized}`;
}

/**
 * Execute operation within tenant context using isolated connection
 * S2: Prevents context leakage by using fresh connections and explicit cleanup
 */
export async function withTenantConnection<T>(
  tenantIdOrSubdomain: string,
  operation: (db: any) => Promise<T>
): Promise<T> {
  // 1. Resolve tenant and verify status (via public pool)
  const result = await publicPool.query(
    'SELECT id, subdomain, status FROM tenants WHERE id::text = $1 OR subdomain = $1 LIMIT 1',
    [tenantIdOrSubdomain]
  );

  if (result.rowCount === 0) {
    throw new Error(
      `S2 Violation: Tenant '${tenantIdOrSubdomain}' not found or invalid`
    );
  }

  const tenant = result.rows[0];

  // S2: Hard Status Verification
  if (tenant.status !== 'active') {
    throw new Error(
      `S2 Violation: Tenant '${tenantIdOrSubdomain}' is ${tenant.status}. Access denied.`
    );
  }
  const schemaName = sanitizeSchemaName(tenant.subdomain);

  // 2. Create isolated connection (NOT from pool)
  const client = new Client(poolConfig);
  await client.connect();

  try {
    // 3. Set secure context with local search_path
    await client.query(`SET LOCAL search_path TO "${schemaName}", public`);

    // 4. Double-check verification: Verify we are in the correct schema
    const checkResult = await client.query('SELECT current_schema()');
    const actualSchema = checkResult.rows[0].current_schema;

    if (actualSchema !== schemaName) {
      throw new Error(
        `S2 CRITICAL: Schema isolation failed. Expected '${schemaName}', got '${actualSchema}'`
      );
    }

    const db = drizzle(client);
    return await operation(db);
  } finally {
    // 5. Hard Closure: Always destroy connection to purge state
    try {
      await client.end();
    } catch (cleanupError) {
      console.error(
        'S2 WARNING: Failed to close isolated connection',
        cleanupError
      );
    }
  }
}

/**
 * Create a Drizzle instance for a specific tenant
 * Note: For production, use withTenantConnection for proper isolation.
 * This helper is for one-off operations like seeding.
 */
export function createTenantDb(_tenantId: string) {
  // In a real implementation, this would return a proxy or handle search_path
  // For now, we return publicDb but the caller must be aware or use withTenantConnection
  return publicDb;
}
