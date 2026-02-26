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
  readonly isSuspended: boolean; // S15 FIX 19A: Steel Control flag (enforced by Guards, not Middleware)
  readonly executor?: any; // Drizzle executor/client for stickiness (S2)
}

/**
 * AsyncLocalStorage instance for tenant context
 * Usage: tenantStorage.run(context, () => { // your code here });
 */
export const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Execute function within a tenant context
 * @param context - Tenant context to set
 * @param callback - Function to execute within context
 * @returns Result of callback
 */
export function runWithTenantContext<T>(
  context: TenantContext,
  callback: () => T | Promise<T>
): T | Promise<T> {
  // S2 FIX 24A: Fortress-Grade Immutability (The Proxy Shield)
  // Destructive Object.freeze (deleted previously) breaks teardown lifecycle (Fix 18B).
  // A read-only Proxy allows the middleware to mutate isActive/executor internally,
  // while the application gets a strictly immutable view.
  const readonlyView = new Proxy(context, {
    set: () => {
      throw new Error('S2 VIOLATION: TenantContext is immutable at runtime.');
    },
    defineProperty: () => {
      throw new Error('S2 VIOLATION: TenantContext is immutable at runtime.');
    },
    deleteProperty: () => {
      throw new Error('S2 VIOLATION: TenantContext is immutable at runtime.');
    },
  });

  return tenantStorage.run(readonlyView, callback);
}

/**
 * Get current tenant ID from AsyncLocalStorage
 * @returns Tenant ID or null if not in context
 */
export function getCurrentTenantId(): string | null {
  const store = tenantStorage.getStore();
  return store?.tenantId ?? null;
}

/**
 * Get full tenant context from AsyncLocalStorage
 * @returns TenantContext or null if not in context
 */
export function getCurrentTenantContext(): TenantContext | null {
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
export function requireTenantContext(): TenantContext {
  const context = getCurrentTenantContext();
  if (!context) {
    throw new Error(
      'S2 Violation: Tenant context required but not found. Ensure middleware is configured.'
    );
  }
  return context;
}

/**
 * Check if currently running within a tenant context
 * @returns boolean indicating context presence
 */
export function hasTenantContext(): boolean {
  return tenantStorage.getStore() !== undefined;
}
