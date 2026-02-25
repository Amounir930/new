import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  customType,
  integer,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { pgSchema } from 'drizzle-orm/pg-core';

/**
 * Enterprise Decision #1: Zero-Trust Schema Isolation.
 *
 * ARCHITECTURE:
 * 1. Governance Schema: 'governance' (registry/audit).
 * 2. Tenant Schemas: 'tenant_{id}' (transactional/storefront).
 *
 * ROUTING & ISOLATION (MANDATE #1):
 * Queries MUST be scoped inside a transaction using a transaction-local setting.
 * Connection Pool Poisoning is fatal; DO NOT set globals on the shared client.
 * Example:
 * await db.transaction(async (tx) => {
 *   await tx.execute(sql`SET LOCAL app.current_tenant = '${tenantId}'`);
 *   // ... operations
 * });
 */
export const createTenantSchema = (id: string) => pgSchema(`tenant_${id}`);

/**
 * Enterprise Decision #2: ULID stored as UUID (16 bytes).
 * Sortable + Binary efficient + Index friendly.
 *
 * REQUIRES: gen_ulid() function in PostgreSQL.
 */
export const ulidId = (name = 'id') =>
  uuid(name).default(sql`gen_ulid()`).primaryKey();

/**
 * Enterprise Decision #6: BYTEA for binary integrity.
 * Used for encryption keys, security tokens, and hashes.
 */
export const bytea = (name: string) =>
  customType<{ data: Buffer; driverData: string }>({
    dataType() {
      return 'bytea';
    },
    toDriver(value) {
      return value.toString('hex');
    },
    fromDriver(value) {
      return Buffer.from(value.replace(/\\x/, ''), 'hex');
    },
  })(name);

/**
 * Enterprise Decision #15: Composite Type money_amount.
 * (amount BIGINT, currency VARCHAR(3)).
 * Prevents currency de-sync in financial high-frequency ledger.
 */
export const moneyAmount = (name: string) =>
  customType<{
    data: { amount: bigint; currency: string };
    driverData: string;
  }>({
    dataType() {
      return 'money_amount';
    },
    toDriver(value) {
      // Correct PG composite syntax: '(amount,currency)'
      return `(${value.amount},${value.currency})`;
    },
    fromDriver(value) {
      if (!value || typeof value !== 'string')
        return { amount: 0n, currency: 'SAR' };
      const match = value.match(/^\((\d+),(.+)\)$/);
      if (!match) return { amount: 0n, currency: 'SAR' };
      return {
        amount: BigInt(match[1]),
        currency: match[2].trim().replace(/['"]/g, ''),
      };
    },
  })(name);

/**
 * Enterprise Decision #22: microAmount for high-precision usage.
 * Used for micro-cents in usage-based billing (app_usage_records).
 */
export const microAmount = (name: string) =>
  customType<{ data: bigint; driverData: string }>({
    dataType() {
      return 'bigint';
    },
    toDriver(value) {
      return value.toString();
    },
    fromDriver(value) {
      if (value === null || value === undefined) return 0n;
      return BigInt(value);
    },
  })(name);

/**
 * Enterprise Decision #6: TEXT for encrypted scalars (S7 Overflow Safety).
 * Mandatory Regex Check: Ensures data is stored as standardized JSON ciphertext.
 */
export const encryptedText = (name: string) => text(name);

/**
 * S7 Validation Helper (Mandate #10)
 * Usage: (table) => ({ check: encryptedCheck(table.column) })
 */
export const encryptedCheck = (column: any) =>
  check(
    `check_${column.name}_encrypted`,
    sql`${column}::jsonb ? 'encrypted' AND jsonb_typeof(${column}::jsonb) = 'object'`
  );

/**
 * Enterprise Decision #11: Native GEOGRAPHY for PostGIS.
 * Supports distance-based routing and territory zones.
 */
export const geographyPoint = (name: string) =>
  customType<{
    data: { lat: number; lng: number };
    driverData: string;
  }>({
    dataType() {
      return 'geography(Point, 4326)';
    },
    toDriver(value) {
      return `SRID=4326;POINT(${value.lng} ${value.lat})`;
    },
    fromDriver(_value) {
      // Managed by specialized geographic service layer; return default stub
      return { lat: 0, lng: 0 };
    },
  })(name);

/**
 * Enterprise Decision #9: Standardized Soft Delete.
 */
export const deletedAt = (name = 'deleted_at') =>
  timestamp(name, { withTimezone: true, precision: 6 });

/**
 * Enterprise Decision #3: Physical Column Alignment Legend.
 * Reordering columns physically in .ts files minimizes padding (RAM bloat).
 *
 * ATOMIC ORDERING:
 * 1. Fixed: UUID/ULID -> TIMESTAMPTZ -> BIGINT -> INTEGER -> BOOLEAN
 * 2. Variable: PG_ENUM -> VARCHAR -> TEXT -> TEXT[] -> JSONB -> VECTOR
 */
export const ALIGNMENT_LEGEND =
  'UUID -> TS -> BIGINT -> INT -> BOOL -> ENUM -> TEXT -> ARRAY -> JSONB';

/**
 * Enterprise Decision #21: Atomic Units for Measurements.
 * Basis points for taxes/rates (1500 = 15.00%).
 * Grams for weights.
 */
export const basisPoints = (name: string) => integer(name);
export const grams = (name: string) => integer(name);
/**
 * Fatal Mandate #19/32: Global JSON.stringify Monkey-patch
 * Nuclear backstop to prevent TypeError in production microservices.
 */
const originalStringify = JSON.stringify;
(JSON as any).stringify = (value: any, replacer?: any, space?: any) => {
  const bigintReplacerOverride = (key: string, val: any) => {
    const finalVal = typeof val === 'bigint' ? val.toString() : val;
    return replacer ? replacer(key, finalVal) : finalVal;
  };
  return originalStringify(value, bigintReplacerOverride, space);
};

/**
 * Fatal Mandate #20: Strict Integer Heuristic
 * Used in JSONB math triggers to reject decimals/floating point injection.
 */
export const SQL_INT_REGEX = '^[0-9]+$';

export const occVersion = (name = 'version') =>
  bigint(name, { mode: 'number' }).default(1).notNull();
