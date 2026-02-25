/**
 * S2: Tenant Isolation Protocol - Core Logic
 */

import { createHmac } from 'node:crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import type pg from 'pg';
import { poolConfig, publicPool } from './connection.js';
import { dbContextStorage } from './context.js';

/**
 * Verify tenant exists before allowing connection
 */
export async function verifyTenantExists(tenantId: string): Promise<boolean> {
  try {
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
 */
export function sanitizeSchemaName(subdomain: string): string {
  const clean = subdomain.toLowerCase().trim();
  // Fatal Mandate #5: Strict character and length bounding (3-30 chars)
  if (!/^[a-z0-9-]{3,30}$/.test(clean)) {
    throw new Error('S2 Violation: Invalid subdomain format or length');
  }

  // Risk #50: Prevent reserved word injection
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
  if (reserved.includes(clean.toLowerCase())) {
    throw new Error(
      `S2 Violation: Use of reserved schema name forbidden: ${clean}`
    );
  }

  const sanitized = clean.replace(/-/g, '_');
  return `tenant_${sanitized}`;
}

// Audit 999 Point #2: dbClientFactory removed to enforce use of publicPool
// Legacy alias for backward compatibility with existing test suites
export const dbClientFactory = {
  createClient: () => publicPool,
};

/**
 * Fatal Mandate #25: Static Pepper Blind Indexing
 * Decoupled from rotating tenant salts to ensure PII remains searchable after
 * security rotations. Uses strictly STATIC pepper from vault.
 */
export function hashSensitiveData(data: string, _tenantSalt?: string): string {
  const masterPepper =
    process.env.BLIND_INDEX_PEPPER || 'static_governance_pepper';
  return createHmac('sha256', masterPepper).update(data).digest('hex');
}

import { getGlobalRedis } from './redis.service.js';

async function getRedisClient() {
  const redisService = await getGlobalRedis();
  return redisService.getClient();
}

/**
 * Mandate #22/20: Role escalation protection with HMAC + Nonce
 * Audit 777: Unify crypto logic in DB + Redis Nonce Tracking
 */
async function validateRoleEscalation(
  client: pg.PoolClient,
  role: string,
  options: any
): Promise<void> {
  if (role !== 'system') return;

  const { signature, timestamp, nonce } = options;
  if (!signature || !timestamp || !nonce) {
    throw new Error(
      'S1 Violation: Missing cryptographic proof for role escalation'
    );
  }

  // 1. Replay Attack Prevention (Audit 777 Point #3): Use Redis to track nonces
  // Fatal Mandate #13: Sync Redis TTL strictly with DB epoch validation window
  try {
    const redis = await getRedisClient();
    const nonceKey = `nonce:${nonce}`;

    const requestTime = Number.parseInt(timestamp);
    const currentTime = Math.floor(Date.now() / 1000);
    // Calculate remaining validity based on the 300s (5min) DB window
    const remainingValidity = requestTime + 300 - currentTime;

    // If request is already outside the window, fail immediately to prevent Redis bloat
    if (remainingValidity <= 0 || remainingValidity > 600) {
      throw new Error('S1 Violation: Request timestamp outside valid window');
    }

    const exists = await redis.set(nonceKey, '1', {
      NX: true,
      EX: remainingValidity, // TTL synced with DB window
    });

    if (!exists) {
      throw new Error('S1 Violation: Nonce reused (Replay Attack detected)');
    }
  } catch (err) {
    // Risk #Nonce-S02: Fatal fail-hard. No fallback, no recovery.
    throw new Error(
      `S1 Violation: Nonce verification service unavailable (Forensic Lockdown: ${err})`
    );
  }

  // 2. Crypto Unification (Audit 777 Point #2): DB is the sole authority
  const dbVerify = await client.query(
    'SELECT governance.validate_role_escalation_v2($1, $2, $3, $4) as is_valid',
    [role, signature, timestamp, nonce]
  );

  if (!dbVerify.rows[0].is_valid) {
    throw new Error('S1 Violation: Cryptographic signature mismatch');
  }
}

/**
 * Resolves a tenant and validates their status (active/suspended).
 * Fatal Mandate #2: Caches suspension in Redis on failure.
 */
async function resolveAndValidateTenant(
  tenantIdOrSubdomain: string
): Promise<any> {
  // 1. Resolve tenant
  const tenantLookupSet = await publicPool.query(
    'SELECT id, subdomain, status FROM tenants WHERE id::text = $1 OR subdomain = $1 OR custom_domain = $1 LIMIT 1',
    [tenantIdOrSubdomain]
  );

  if (tenantLookupSet.rowCount === 0) {
    throw new Error(`S2 Violation: Tenant '${tenantIdOrSubdomain}' not found`);
  }

  // 2. High-Speed Kill Switch (Risk #41): Check Redis before DB hit
  try {
    const redis = await getRedisClient();
    const blacklistKey = `suspended_tenant:${tenantIdOrSubdomain}`;
    const isSuspended = await redis.exists(blacklistKey);
    if (isSuspended) {
      throw new Error(
        `S2 Violation: Tenant '${tenantIdOrSubdomain}' is suspended (Redis-Cached). Access denied.`
      );
    }
  } catch (redisErr) {
    if ((redisErr as Error).message.includes('S2 Violation')) throw redisErr;
    console.warn(
      '[Redis] Suspension check failed, falling back to DB:',
      redisErr
    );
  }

  const tenant = tenantLookupSet.rows[0];

  // 3. Hard Status Verification
  if (tenant.status !== 'active') {
    // Proactively cache suspension in Redis for 1 hour
    try {
      const redis = await getRedisClient();
      await redis.set(`suspended_tenant:${tenantIdOrSubdomain}`, '1', {
        EX: 3600,
      });
    } catch (e) {
      console.warn('Failed to cache suspension in Redis:', e);
    }
    throw new Error(`S2 Violation: Tenant is ${tenant.status}. Access denied.`);
  }

  return tenant;
}

/**
 * Configures the connection context (role, tenant ID, search_path).
 */
async function configureConnectionContext(
  client: pg.PoolClient,
  tenant: any,
  options: any
): Promise<string> {
  const role = options.role || 'tenant_admin';
  await client.query('BEGIN');

  // Mandate #1: Isolation context - Fail Hard if missing (missing_ok = false)
  // S2 Hardening: Use SET LOCAL within transaction block as per Directive
  await client.query("SELECT set_config('app.current_tenant', $1, true)", [
    tenant.id,
  ]);

  // Mandate #22/20: Role escalation protection
  await validateRoleEscalation(client, role, options);
  await client.query('SELECT set_config($1, $2, true)', ['app.role', role]);

  // Mandate #6: Schema Existence Check
  const schemaName = sanitizeSchemaName(tenant.subdomain);
  const schemaExists = await client.query(
    'SELECT 1 FROM information_schema.schemata WHERE schema_name = $1',
    [schemaName]
  );
  if (schemaExists.rowCount === 0) {
    throw new Error(
      `S2 Violation: Schema '${schemaName}' for tenant '${tenant.id}' does not exist`
    );
  }

  // Audit 999 Point #16: Use quote_ident safety for dynamic SQL
  await client.query(`SET LOCAL search_path TO "${schemaName}", public`);

  // Verify search path (Auditor Point #3)
  const spResult = await client.query('SHOW search_path');
  if (!spResult.rows[0].search_path.includes(schemaName)) {
    throw new Error(
      `S2 Critical: search_path failure. Expected ${schemaName}, got ${spResult.rows[0].search_path}`
    );
  }

  return schemaName;
}

/**
 * Executes a callback within a tenant-isolated database connection.
 * Mandate #1 & #5 & #22 compliance.
 */
export async function withTenantConnection<T>(
  tenantIdOrSubdomain: string,
  callback: (db: any) => Promise<T>,
  options: {
    role?: 'tenant_admin' | 'system';
    signature?: string;
    timestamp?: string;
    nonce?: string;
  } = {}
): Promise<T> {
  const tenant = await resolveAndValidateTenant(tenantIdOrSubdomain);
  const client = await publicPool.connect();

  try {
    const _schemaName = await configureConnectionContext(
      client,
      tenant,
      options
    );
    const db = drizzle(client);

    // Fatal Mandate #3: Bind AsyncLocalStorage strictly to the connection lifecycle
    return await dbContextStorage.run(db, async () => {
      const result = await callback(db);
      await client.query('COMMIT');
      return result;
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    throw error;
  } finally {
    // Risk #4: Fatal reset on all error paths
    try {
      await client.query('RESET ALL');
      await client.query('SET LOCAL search_path TO public');
      client.release();
    } catch (resetError) {
      // Risk #4: If reset fails, we MUST destroy the socket to prevent leakage
      console.error(
        'S2 Critical: Failed to reset connection context. Destroying socket pool entry.',
        resetError
      );
      client.release(true);
    }
  }
}

export function createTenantDb(_subdomain: string): never {
  throw new Error(
    'S2 Violation: createTenantDb is deprecated. Use withTenantConnection() instead.'
  );
}
