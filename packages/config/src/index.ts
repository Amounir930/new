/**
 * S1: Environment Verification Protocol
 * Constitution Reference: Article S1
 * Rule: Application MUST crash on invalid environment configuration
 */

import { z } from 'zod';
import type { EnvConfig } from './schema';
import { EnvSchema } from './schema';

export * from './schema';

/**
 * Validates environment variables at boot time
 * @throws Error with 'S1 Violation' prefix on validation failure
 * @returns Validated environment configuration
 */
export function validateEnv(): EnvConfig {
  try {
    const parsed = EnvSchema.parse(process.env);
    enforceProductionChecks(parsed);
    enforceGenericChecks(parsed);

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw new Error(
        `S1 Violation: Environment validation failed - ${issues}`
      );
    }
    throw error;
  }
}

function enforceProductionChecks(parsed: EnvConfig): void {
  if (parsed.NODE_ENV !== 'production') return;

  if (parsed.JWT_SECRET.length < 32) {
    throw new Error(
      'S1 Violation: JWT_SECRET must be at least 32 characters in production'
    );
  }
  if (
    parsed.JWT_SECRET.includes('default') ||
    parsed.JWT_SECRET.includes('test')
  ) {
    throw new Error(
      'S1 Violation: JWT_SECRET appears to be a default/test value in production'
    );
  }

  if (
    parsed.DATABASE_URL.includes('localhost') &&
    !parsed.DATABASE_URL.includes('ssl')
  ) {
    throw new Error('S1 Violation: Production database must use SSL');
  }
}

function enforceGenericChecks(parsed: EnvConfig): void {
  // Common checks for all environments (including test/dev)
  if (parsed.JWT_SECRET.length < 8) {
    throw new Error('S1 Violation: JWT_SECRET is too short (min 8 chars)');
  }

  const dbUrl = parsed.DATABASE_URL;
  if (
    dbUrl &&
    !dbUrl.startsWith('postgres://') &&
    !dbUrl.startsWith('postgresql://')
  ) {
    throw new Error('S1 Violation: Invalid DATABASE_URL protocol');
  }
}

export function enforceS1Compliance(): void {
  try {
    validateEnv();
  } catch (error) {
    console.error('❌ CRITICAL: S1 Protocol Violation');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    console.error('Application startup aborted. Check your .env file.');
    process.exit(1);
  }
}

// Auto-execute on import for fail-fast behavior
// CRITICAL FIX (S1): Always enforce in production, respect flag only in non-production
if (process.env.NODE_ENV !== 'test') {
  if (process.env.NODE_ENV === 'production') {
    enforceS1Compliance();
  } else if (process.env.ENABLE_S1_ENFORCEMENT !== 'false') {
    enforceS1Compliance();
  }
}

/**
 * Global validated environment configuration
 * (Fail-fast initialization)
 * In TEST mode, we fallback to process.env if parsing fails to avoid breaking module load
 */
export const env: EnvConfig = (() => {
  if (process.env.NODE_ENV === 'test') {
    try {
      return EnvSchema.parse(process.env);
    } catch (_e) {
      return process.env as unknown as EnvConfig;
    }
  }
  return validateEnv();
})();

export * from './config.service';
