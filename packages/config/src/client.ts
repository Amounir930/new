import { validateClientEnv } from './validator';

/**
 * 🛡️ Strictly Typed Client Environment
 * S1: Validates ONLY NEXT_PUBLIC_* variables.
 * Rule: Accessing backend secrets here results in Compile-Time Errors.
 */
export const env = validateClientEnv();
