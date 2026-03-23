/**
 * 🛡️ Sovereign Security Utilities
 * Protocol Reference: S1
 */

/**
 * S1: Strict UUID Validation
 * Prevents 22P02 Type Mismatch errors in PostgreSQL Governance DB
 */
export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

/**
 * Normalizes subdomain to official tenant schema name
 * Protocol: S2 - Case Insensitive + Regex Sanitized
 */
export function toSchemaName(subdomain: string): string {
  if (!subdomain) return 'public';
  if (subdomain.toLowerCase() === 'system') return 'public';

  const normalized = subdomain
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/^_+|_+$/g, '');

  return `tenant_${normalized}`;
}
