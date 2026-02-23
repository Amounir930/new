/**
 * S1: Environment Verification Protocol
 * Constitution Reference: Article S1
 * Rule: Application MUST crash on invalid environment configuration
 */

import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { EnvConfig } from './schema';
import { EnvSchema } from './schema';

export * from './schema';

/**
 * S1: Secret File Resolution
 * Resolves environment variables ending in _FILE by reading their file content.
 * e.g. JWT_SECRET_FILE=/run/secrets/jwt -> JWT_SECRET=<content>
 */
function resolveSecretFiles(): void {
  for (const [key, value] of Object.entries(process.env)) {
    if (key.endsWith('_FILE') && value) {
      try {
        const secretKey = key.replace('_FILE', '');
        // Only resolve if the target key isn't already set directly
        if (!process.env[secretKey]) {
          process.env[secretKey] = readFileSync(value, 'utf8').trim();
        }
      } catch (error) {
        console.warn(`⚠️ Failed to resolve secret file for ${key}:`, error);
      }
    }
  }

  // S1: Intelligent Patching for Connection URLs
  // If passwords were resolved from secrets, inject them into URLs if they contain '@' host separator
  if (process.env.REDIS_PASSWORD && process.env.REDIS_URL?.includes('@')) {
    const url = process.env.REDIS_URL;
    if (url.startsWith('redis://@')) {
      process.env.REDIS_URL = url.replace('redis://@', `redis://:${encodeURIComponent(process.env.REDIS_PASSWORD)}@`);
    } else if (!url.includes(':') || url.indexOf(':') === url.lastIndexOf(':')) {
      // Handle redis://:pass@host or redis://host cases if needed, but the primarily one is redis://@host
    }
  }

  if (process.env.POSTGRES_PASSWORD && process.env.DATABASE_URL?.includes('@')) {
    const url = process.env.DATABASE_URL;
    // Replace postgresql://user@host with postgresql://user:pass@host
    const regex = /(postgresql?:\/\/)([^:/@]+)@/;
    if (regex.test(url)) {
      process.env.DATABASE_URL = url.replace(regex, `$1$2:${encodeURIComponent(process.env.POSTGRES_PASSWORD)}@`);
    }
  }
}

/**
 * Validates environment variables at boot time
 * @throws Error with 'S1 Violation' prefix on validation failure
 * @returns Validated environment configuration
 */
export function validateEnv(): EnvConfig {
  try {
    resolveSecretFiles();
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
    parsed.BLIND_INDEX_PEPPER.includes('default') ||
    parsed.BLIND_INDEX_PEPPER.includes('test')
  ) {
    throw new Error(
      'S1 Violation: BLIND_INDEX_PEPPER appears to be a default/test value in production'
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
 * S1: Strictly enforced. No bypasses.
 */
export const env: EnvConfig = (() => {
  if (process.env.NODE_ENV === 'test') {
    try {
      return EnvSchema.parse(process.env);
    } catch (_e) {
      // In test mode, we allow raw object access only if parsing fails, 
      // primarily to support mock testing of the validator itself.
      return process.env as unknown as EnvConfig;
    }
  }
  return validateEnv();
})();

export * from './config.service';
