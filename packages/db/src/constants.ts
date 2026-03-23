/**
 * 🛡️ Apex System Constants
 * Protocol: S1/S2 - Sentinel Integrity
 */

/**
 * Universal System Tenant ID
 * Used for system-level governance and feature gate bypass.
 * Prevents 22P02 UUID validation errors in PostgreSQL.
 */
export const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';
