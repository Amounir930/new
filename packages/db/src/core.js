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
 * Execute operation within tenant context using shared pool
 * S2: Verifies tenant validity before connection
 */
export async function withTenantConnection(tenantId, operation) {
    // 🔒 S2 Enforcement: Verify tenant exists first
    const exists = await verifyTenantExists(tenantId);
    if (!exists) {
        throw new Error(`S2 Violation: Tenant '${tenantId}' not found or invalid`);
    }
    const client = await publicPool.connect();
    let cleanupSuccessful = false;
    try {
        // 🔒 S2 Enforcement: Switch to tenant context
        // Radical Fix: Sanitize tenantId and use quoted identifiers to prevent SQL injection or path escape
        const safeTenantId = tenantId.replace(/[^a-z0-9_-]/gi, '');
        await client.query(`SET search_path TO "tenant_${safeTenantId}", public`);
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
            console.error('S2 CRITICAL: Failed to reset search_path after error', cleanupError);
            // cleanupSuccessful remains false, triggering connection destruction in finally
        }
        throw error;
    }
    finally {
        // 🔒 S2 Protocol: Destroy connection if cleanup failed to prevent context leakage
        // Radical Fix: client.release(true) physically closes the connection to purge logic state
        if (!cleanupSuccessful) {
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