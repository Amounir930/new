/**
 * S1: Environment Verification Protocol
 * Constitution Reference: Article S1
 * Rule: Application MUST crash on invalid environment configuration
 */

import { z } from 'zod';
import { Global, Module } from '@nestjs/common';
import { type EnvConfig, EnvSchema } from './schema';

export * from './schema';

/**
 * Validates environment variables at boot time
 * @throws Error with 'S1 Violation' prefix on validation failure
 * @returns Validated environment configuration
 */
export function validateEnv(): EnvConfig {
  try {
    const parsed = EnvSchema.parse(process.env);

    // Additional S1 Security Checks
    if (parsed.NODE_ENV === 'production') {
      // JWT Secret Strength Check
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

      // Database Security Check
      if (
        parsed.DATABASE_URL.includes('localhost') &&
        !parsed.DATABASE_URL.includes('ssl')
      ) {
        throw new Error('S1 Violation: Production database must use SSL');
      }
    }

    // Generic Checks (All Environments)
    if (parsed.JWT_SECRET.length < 8) {
      throw new Error('S1 Violation: JWT_SECRET is too short (min 8 chars)');
    }

    if (
      !parsed.DATABASE_URL.startsWith('postgres://') &&
      !parsed.DATABASE_URL.startsWith('postgresql://')
    ) {
      throw new Error('S1 Violation: Invalid DATABASE_URL protocol');
    }

    console.warn(
      '✅ S1 Compliance: Environment variables validated successfully'
    );
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

/**
 * Boot-time environment checker
 * Usage: Import this at the very top of your main.ts
 * Effect: Application will crash immediately if env is invalid
 */
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
// Skip auto-enforcement during tests to allow mocking
if (process.env.NODE_ENV !== 'test') {
  if (process.env.NODE_ENV === 'production') {
    // In production, S1 is ALWAYS enforced - no bypass allowed
    enforceS1Compliance();
  } else if (process.env.ENABLE_S1_ENFORCEMENT !== 'false') {
    // In non-production, respect the flag (default to enforce)
    enforceS1Compliance();
  }
}

/**
 * Cached environment configuration
 * Use this for direct access to env vars after validation
 */
export const env: EnvConfig = validateEnv();

/**
 * NestJS-compatible ConfigService
 * Provides typed access to environment variables
 */
export class ConfigService {
  private readonly config: EnvConfig;

  constructor() {
    this.config = env;
  }

  /**
   * Get a configuration value by key
   */
  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }

  /**
   * Get a configuration value with a default fallback
   */
  getWithDefault<K extends keyof EnvConfig>(
    key: K,
    defaultValue: EnvConfig[K]
  ): EnvConfig[K] {
    return this.config[key] ?? defaultValue;
  }
}

@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule { }
