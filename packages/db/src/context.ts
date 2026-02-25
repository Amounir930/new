import { AsyncLocalStorage } from 'node:async_hooks';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Storage for request-scoped database executors (Stickiness S2)
 */
export const dbContextStorage = new AsyncLocalStorage<NodePgDatabase<any>>();

/**
 * Get the current scoped database executor if available
 */
export function getScopedDb<T extends Record<string, any>>(
  defaultDb: NodePgDatabase<T>
): NodePgDatabase<T> {
  const scoped = dbContextStorage.getStore();
  return (scoped as NodePgDatabase<T>) || defaultDb;
}
