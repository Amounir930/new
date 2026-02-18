/**
 * Database Schema Index
 * Re-exports public and tenant schemas for backward compatibility
 */

// Governance tables (from existing governance.ts)
export * from './schema/governance';
// Public schema tables (global, system-wide)
export * from './schema/public';
// Tenant schema tables (per-tenant isolation)
export * from './schema/tenant';

/**
 * S2 Compliance Helpers
 */
export function getTenantTableName(
  tableName: string,
  subdomain: string
): string {
  const schema = `tenant_${subdomain.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  return `"${schema}"."${tableName}"`;
}

export function setTenantSearchPath(subdomain: string): string {
  const schema = `tenant_${subdomain.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  return `SET search_path TO "${schema}", public`;
}
