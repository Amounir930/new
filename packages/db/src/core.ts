/**
 * S2: Tenant Isolation Protocol - Core Logic
 * Depends on connection.ts (Pool) and context.ts (AsyncLocalStorage)
 */

import { createHmac } from 'node:crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import type pg from 'pg';
import { publicPool } from './connection.js';
import { dbContextStorage } from './context.js';
import { getGlobalRedis } from './redis.service.js';
import type { ConnectionOptions, TenantDb, TenantRow } from './types.js';

/**
 * Sanitize subdomain to valid PostgreSQL schema name
 */
export function sanitizeSchemaName(subdomain: string): string {
  const clean = subdomain.toLowerCase().trim();
  if (!/^[a-z0-9-]{3,30}$/.test(clean)) {
    throw new Error('S2 Violation: Invalid subdomain format or length');
  }

  const reserved = [
    'public',
    'governance',
    'vault',
    'pg_catalog',
    'information_schema',
    'partman',
    'cron',
    'postgres',
    'admin',
  ];
  if (reserved.includes(clean)) {
    throw new Error(
      `S2 Violation: Use of reserved schema name forbidden: ${clean}`
    );
  }

  return `tenant_${clean.replace(/-/g, '_')}`;
}

async function getRedisClient() {
  const redisService = await getGlobalRedis();
  return redisService.getClient();
}

/**
 * Resolves a tenant and validates their status.
 */
export async function resolveAndValidateTenant(
  tenantIdOrSubdomain: string
): Promise<TenantRow> {
  const result = await publicPool.query(
    'SELECT id, subdomain, status FROM tenants WHERE id::text = $1 OR subdomain = $1 OR custom_domain = $1 LIMIT 1',
    [tenantIdOrSubdomain]
  );

  if (result.rowCount === 0) {
    throw new Error(`S2 Violation: Tenant '${tenantIdOrSubdomain}' not found`);
  }

  const tenant = result.rows[0];
  if (tenant.status !== 'active') {
    throw new Error(`S2 Violation: Tenant is ${tenant.status}. Access denied.`);
  }

  return tenant;
}

/**
 * Validates role escalation with HMAC + Nonce
 */
export async function validateRoleEscalation(
  client: pg.PoolClient,
  role: string,
  options: ConnectionOptions
): Promise<void> {
  if (role !== 'system') return;

  const { signature, timestamp, nonce } = options;
  if (!signature || !timestamp || !nonce) {
    throw new Error(
      'S1 Violation: Missing cryptographic proof for role escalation'
    );
  }

  try {
    const redis = await getRedisClient();
    const nonceKey = `nonce:${nonce}`;
    const requestTime = Number.parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const remainingValidity = requestTime + 300 - currentTime;

    if (remainingValidity <= 0 || remainingValidity > 600) {
      throw new Error('S1 Violation: Request timestamp outside valid window');
    }

    const exists = await redis.set(nonceKey, '1', {
      NX: true,
      EX: remainingValidity,
    });
    if (!exists) throw new Error('S1 Violation: Nonce reused');
  } catch (err) {
    throw new Error(
      `S1 Violation: Nonce verification service unavailable: ${err}`
    );
  }

  const dbVerify = await client.query(
    'SELECT governance.validate_role_escalation_v2($1, $2, $3, $4) as is_valid',
    [role, signature, timestamp, nonce]
  );

  if (!dbVerify.rows[0].is_valid)
    throw new Error('S1 Violation: Cryptographic signature mismatch');
}

/**
 * Configures the connection context
 */
export async function configureConnectionContext(
  client: pg.PoolClient,
  tenant: TenantRow,
  options: ConnectionOptions
): Promise<string> {
  const role = options.role || 'tenant_admin';
  await client.query('BEGIN');
  await client.query("SELECT set_config('app.current_tenant', $1, true)", [
    tenant.id,
  ]);
  await validateRoleEscalation(client, role, options);
  await client.query('SELECT set_config($1, $2, true)', ['app.role', role]);

  const schemaName = sanitizeSchemaName(tenant.subdomain);
  const schemaExists = await client.query(
    'SELECT 1 FROM information_schema.schemata WHERE schema_name = $1',
    [schemaName]
  );
  if (schemaExists.rowCount === 0)
    throw new Error(`S2 Violation: Schema '${schemaName}' does not exist`);

  await client.query(`SET LOCAL search_path TO "${schemaName}"`);
  const spResult = await client.query('SHOW search_path');
  if (!spResult.rows[0].search_path.includes(schemaName))
    throw new Error('S2 Critical: search_path failure');
  if (spResult.rows[0].search_path.includes('public'))
    throw new Error('S2 Critical: public schema leaked');

  return schemaName;
}

/**
 * Main entry point for tenant-isolated DB access
 */
export async function withTenantConnection<T>(
  tenantIdOrSubdomain: string,
  callback: (db: TenantDb) => Promise<T>,
  options: ConnectionOptions = {}
): Promise<T> {
  const tenant = await resolveAndValidateTenant(tenantIdOrSubdomain);
  const client = await publicPool.connect();

  try {
    await configureConnectionContext(client, tenant, options);
    const db = drizzle(client) as unknown as TenantDb;

    return await dbContextStorage.run(db, async () => {
      const result = await callback(db);
      await client.query('COMMIT');
      return result;
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    throw error;
  } finally {
    try {
      await client.query('RESET ALL');
      client.release();
    } catch (resetError) {
      console.error(
        'S2 Critical: Reset failed, destroying socket:',
        resetError
      );
      client.release(true);
    }
  }
}

/**
 * Hash utility for blind indexing
 */
export function hashSensitiveData(data: string): string {
  const masterPepper = process.env.BLIND_INDEX_PEPPER;
  if (!masterPepper || masterPepper.trim().length < 32) {
    throw new Error('S1 Violation: BLIND_INDEX_PEPPER is missing or too short');
  }
  return createHmac('sha256', masterPepper).update(data).digest('hex');
}
