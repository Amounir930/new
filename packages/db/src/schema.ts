/**
 * Database Schema Index
 * Re-exports public and tenant schemas for backward compatibility
 */

// Comprehensive schema export for Drizzle Kit and Application
export * from './schema/index';

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
