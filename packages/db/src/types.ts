/**
 * Shared strict TypeScript types for @apex/db
 * Replaces `any` usages across core, connection, services, and schema files.
 * S1/S2/S7 compliance — no implicit any allowed.
 */
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

// ---------------------------------------------------------------------------
// Tenant types
// ---------------------------------------------------------------------------

/**
 * Minimal tenant row shape as returned from the public.tenants table.
 * Used in core.ts to replace `any` on resolved tenant objects.
 */
export interface TenantRow {
  id: string;
  subdomain: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Connection options
// ---------------------------------------------------------------------------

/**
 * Options for withTenantConnection — replaces `options: any`.
 * When role is 'system', signature + timestamp + nonce are required for
 * HMAC-based role escalation (Mandate #22/20).
 */
export interface ConnectionOptions {
  role?: 'tenant_admin' | 'system';
  signature?: string;
  timestamp?: string;
  nonce?: string;
}

// ---------------------------------------------------------------------------
// Pool client duck-type
// ---------------------------------------------------------------------------

/**
 * Minimal duck-type for a PostgreSQL pool client as used in pool event
 * handlers (connection.ts). Replaces `client: any`.
 */
export interface PoolClientLike {
  query(sql: string): Promise<unknown>;
  release(destroy?: boolean): void;
}

// ---------------------------------------------------------------------------
// S7 Encryption envelope
// ---------------------------------------------------------------------------

/**
 * AES-256-GCM ciphertext envelope shape stored in the DB.
 * Every encrypted column must validate against this structure.
 */
export interface EncryptedEnvelope {
  enc: true;
  iv: string;
  tag: string;
  data: string;
}

// ---------------------------------------------------------------------------
// Drizzle raw-client access shape
// ---------------------------------------------------------------------------

/**
 * Shape used to access the raw pg client from a Drizzle NodePgDatabase
 * instance for pg_notify subscriptions (governance.service.ts).
 * Replaces `{ $client?: any }` casts.
 */
export interface PgNotificationMessage {
  channel: string;
  payload: string;
}

export interface RawPgClientShape {
  $client?: {
    on?: (event: string, cb: (msg: PgNotificationMessage) => void) => void;
    query?: (sql: string) => Promise<unknown>;
  };
}

// ---------------------------------------------------------------------------
// Generic tenant DB type alias
// ---------------------------------------------------------------------------

/**
 * Typed alias for a tenant-scoped Drizzle database instance.
 * Prefer this over `NodePgDatabase<any>`.
 */
export type TenantDb = NodePgDatabase<Record<string, unknown>>;
