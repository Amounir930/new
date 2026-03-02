import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { EnvConfig } from './schema.js';
import { EnvSchema } from './schema.js';

/**
 * S1: Secret File Resolution
 * Resolves environment variables ending in _FILE by reading their file content.
 */
function resolveSecretFiles(): void {
  for (const [key, value] of Object.entries(process.env)) {
    if (key.endsWith('_FILE') && value) {
      processSecretFile(key, value);
    }
  }

  // S1: Intelligent Patching for Connection URLs
  patchRedisUrl();
  patchDatabaseUrl();
}

function processSecretFile(key: string, value: string): void {
  try {
    const secretKey = key.replace('_FILE', '');
    if (!process.env[secretKey]) {
      process.env[secretKey] = readFileSync(value, 'utf8').trim();
    }
  } catch (error) {
    console.warn(`⚠️ Failed to resolve secret file for ${key}:`, error);
  }
}

function patchRedisUrl(): void {
  if (!process.env.REDIS_PASSWORD || !process.env.REDIS_URL?.includes('@')) {
    return;
  }

  const url = process.env.REDIS_URL;
  if (url.startsWith('redis://@')) {
    process.env.REDIS_URL = url.replace(
      'redis://@',
      `redis://:${encodeURIComponent(process.env.REDIS_PASSWORD)}@`
    );
  }
}

function patchDatabaseUrl(): void {
  if (
    !process.env.POSTGRES_PASSWORD ||
    !process.env.DATABASE_URL?.includes('@')
  ) {
    return;
  }

  const url = process.env.DATABASE_URL;
  const regex = /(postgresql?:\/\/)([^:/@]+)@/;
  if (regex.test(url)) {
    process.env.DATABASE_URL = url.replace(
      regex,
      `$1$2:${encodeURIComponent(process.env.POSTGRES_PASSWORD)}@`
    );
  }
}

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
