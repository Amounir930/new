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
