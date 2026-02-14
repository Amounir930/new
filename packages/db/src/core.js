/**
 * S2: Tenant Isolation Protocol - Core Logic
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { publicDb, publicPool } from './connection.js';
/**
 * Verify tenant exists before allowing connection
 * S2: Prevents access to non-existent tenant schemas
 */
export async function verifyTenantExists(tenantId) {
    try {
        // S1: safe - Querying tenants table via publicPool which uses public schema
        // This is required for S2 tenant isolation verification
        const result = await publicPool.query('SELECT 1 FROM tenants WHERE id::text = $1 OR subdomain = $1 LIMIT 1', [tenantId]);
        return (result.rowCount ?? 0) > 0;
    }
    catch {
        return false;
    }
}
/**
 * Sanitize subdomain to valid PostgreSQL schema name
 * @param subdomain - Raw subdomain
 * @returns Valid schema name (tenant_{sanitized})
 */
export function sanitizeSchemaName(subdomain) {
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
 * Execute operation within tenant context using shared pool
 * S2: Verifies tenant validity before connection
 */
export async function withTenantConnection(tenantIdOrSubdomain, operation) {
    // 🔒 S2 Enforcement: Resolve tenant and verify existence
    const result = await publicPool.query('SELECT id, subdomain FROM tenants WHERE id::text = $1 OR subdomain = $1 LIMIT 1', [tenantIdOrSubdomain]);
    if (result.rowCount === 0) {
        throw new Error(`S2 Violation: Tenant '${tenantIdOrSubdomain}' not found or invalid`);
    }
    const tenant = result.rows[0];
    const client = await publicPool.connect();
    let cleanupSuccessful = false;
    try {
        // 🔒 S2 Enforcement: Switch to tenant context
        // Deep Security Fix: ALWAYS use subdomain for schema naming (S2 Consistency)
        const schemaName = sanitizeSchemaName(tenant.subdomain);
        await client.query(`SET search_path TO "${schemaName}", public`);
        const db = drizzle(client);
        const result = await operation(db);
        // S2 FIX: Reset context BEFORE returning result
        // Radical Fix: Use RESET search_path to clear all session-level path settings
        await client.query('RESET search_path');
        cleanupSuccessful = true;
        return result;
    }
    catch (error) {
        // S2 FIX: Attempt cleanup even on error
        try {
            await client.query('RESET search_path');
            cleanupSuccessful = true;
        }
        catch (cleanupError) {
            console.error('S2 CRITICAL: Failed to reset search_path after error. Connection will be destroyed to prevent leak.', cleanupError);
            // cleanupSuccessful remains false, triggering connection destruction in finally
        }
        throw error;
    }
    finally {
        // 🔒 S2 Protocol: Destroy connection if cleanup failed to prevent context leakage
        // Radical Fix: client.release(true) physically closes the connection to purge logic state
        if (!cleanupSuccessful) {
            // Verify we are destroying the connection
            console.warn('S2 WARNING: Destroying connection due to potential context leak');
            client.release(true);
        }
        else {
            client.release();
        }
    }
}
/**
 * Create a Drizzle instance for a specific tenant
 * Note: For production, use withTenantConnection for proper isolation.
 * This helper is for one-off operations like seeding.
 */
export function createTenantDb(_tenantId) {
    // In a real implementation, this would return a proxy or handle search_path
    // For now, we return publicDb but the caller must be aware or use withTenantConnection
    return publicDb;
}
//# sourceMappingURL=core.js.map