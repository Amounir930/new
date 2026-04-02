import { validateServerEnv } from './validator';
export { type EnvConfig } from './schema';
export { validateServerEnv };

/**
 * 🛡️ Strictly Typed Server Environment
 * S1: Validates the full server-side schema (Secrets + Public).
 * Used by API, Workers, and Node.js Runtimes.
 */
export const env = validateServerEnv();
