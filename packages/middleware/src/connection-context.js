/**
 * Connection Context Management
 * S2 Protocol: Tenant Isolation via AsyncLocalStorage
 *
 * Provides request-scoped tenant context for database operations
 */
import { AsyncLocalStorage } from 'node:async_hooks';
/**
 * AsyncLocalStorage instance for tenant context
 * Usage: tenantStorage.run(context, () => { // your code here });
 */
export const tenantStorage = new AsyncLocalStorage();
/**
 * Execute function within a tenant context
 * @param context - Tenant context to set
 * @param callback - Function to execute within context
 * @returns Result of callback
 */
export function runWithTenantContext(context, callback) {
    // 🔒 S2 Enforcement: Ensure context is immutable at runtime
    Object.freeze(context);
    return tenantStorage.run(context, callback);
}
/**
 * Get current tenant ID from AsyncLocalStorage
 * @returns Tenant ID or null if not in context
 */
export function getCurrentTenantId() {
    const store = tenantStorage.getStore();
    return store?.tenantId ?? null;
}
/**
 * Get full tenant context from AsyncLocalStorage
 * @returns TenantContext or null if not in context
 */
export function getCurrentTenantContext() {
    return tenantStorage.getStore() ?? null;
}
/**
 * Require tenant context - alias for getTenantContext
 */
export const getTenantContext = requireTenantContext;
/**
 * Require tenant context - throws if not present
 * @returns TenantContext (guaranteed)
 * @throws Error if no tenant context found
 */
export function requireTenantContext() {
    const context = getCurrentTenantContext();
    if (!context) {
        throw new Error('S2 Violation: Tenant context required but not found. Ensure middleware is configured.');
    }
    return context;
}
/**
 * Check if currently running within a tenant context
 * @returns boolean indicating context presence
 */
export function hasTenantContext() {
    return tenantStorage.getStore() !== undefined;
}
//# sourceMappingURL=connection-context.js.map