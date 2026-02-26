import type { ExtractTablesWithRelations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { NodePgTransaction } from 'drizzle-orm/node-postgres';
import type { db } from './index';

/**
 * Enterprise Decision #1: Zero-Trust Connection Pool Isolation
 * ARCHITECTURE MANDATE: Connection Pool Poisoning Mitigation.
 *
 * Node.js async operations can leak `app.current_tenant` to another user if set
 * globally on a pooled client.
 *
 * EXECUTION LAW:
 * ALL tenant queries MUST be wrapped in a transaction block.
 * `SET LOCAL` guarantees that the variable only exists for the duration of that
 * specific transaction.
 */
export async function withTenantContext<T>(
  client: typeof db,
  tenantId: string,
  callback: (
    tx: NodePgTransaction<
      Record<string, unknown>,
      ExtractTablesWithRelations<Record<string, unknown>>
    >
  ) => Promise<T>
): Promise<T> {
  return await client.transaction(async (tx) => {
    // Mandate #1 & #2: STRICT LOCAL TRANSACTION SCOPE + NOT NULL BYPASS
    await tx.execute(
      sql`SET LOCAL app.current_tenant = '${sql.raw(tenantId)}'`
    );

    // Execute the user's isolated operations
    return await callback(tx);
  });
}
