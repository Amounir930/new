import { AsyncLocalStorage } from 'node:async_hooks';
export interface TenantContext {
    tenantId: string;
    subdomain: string;
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    features: string[];
}
export declare const tenantStorage: AsyncLocalStorage<TenantContext>;
/**
 * Helper to get the current tenant context.
 * Throws if called outside of a tenant context (S2 Enforcement).
 */
export declare function getTenantContext(): TenantContext;
/**
 * Helper to check if we are strictly inside a tenant context
 */
export declare function hasTenantContext(): boolean;
//# sourceMappingURL=tenant-context.d.ts.map