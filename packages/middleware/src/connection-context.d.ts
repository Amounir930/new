/**
 * Connection Context Management
 * S2 Protocol: Tenant Isolation via AsyncLocalStorage
 *
 * Provides request-scoped tenant context for database operations
 */
import { AsyncLocalStorage } from 'node:async_hooks';
/**
 * Tenant context stored per request
 */
export interface TenantContext {
    readonly tenantId: string;
    readonly subdomain: string;
    readonly plan: 'free' | 'basic' | 'pro' | 'enterprise';
    readonly features: readonly string[];
    readonly createdAt: Date;
    readonly schemaName: string;
    readonly isActive: boolean;
}
/**
 * AsyncLocalStorage instance for tenant context
 * Usage: tenantStorage.run(context, () => { // your code here });
 */
export declare const tenantStorage: AsyncLocalStorage<TenantContext>;
/**
 * Execute function within a tenant context
 * @param context - Tenant context to set
 * @param callback - Function to execute within context
 * @returns Result of callback
 */
export declare function runWithTenantContext<T>(context: TenantContext, callback: () => T | Promise<T>): T | Promise<T>;
/**
 * Get current tenant ID from AsyncLocalStorage
 * @returns Tenant ID or null if not in context
 */
export declare function getCurrentTenantId(): string | null;
/**
 * Get full tenant context from AsyncLocalStorage
 * @returns TenantContext or null if not in context
 */
export declare function getCurrentTenantContext(): TenantContext | null;
/**
 * Require tenant context - alias for getTenantContext
 */
export declare const getTenantContext: typeof requireTenantContext;
/**
 * Require tenant context - throws if not present
 * @returns TenantContext (guaranteed)
 * @throws Error if no tenant context found
 */
export declare function requireTenantContext(): TenantContext;
/**
 * Check if currently running within a tenant context
 * @returns boolean indicating context presence
 */
export declare function hasTenantContext(): boolean;
//# sourceMappingURL=connection-context.d.ts.map