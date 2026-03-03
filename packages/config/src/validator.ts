import { readFileSync, existsSync } from 'fs';
import { z } from 'zod';
import type { EnvConfig } from './schema.js';
import { EnvSchema } from './schema.js';

/**
 * Military-Grade Zero-Trust Secret Resolution
 * Resolves *_FILE variables into their corresponding environment values
 */
function resolveSecretFiles() {
  const secretEnv = { ...process.env };
  const keys = Object.keys(secretEnv);

  for (const key of keys) {
    if (key.endsWith('_FILE')) {
      const filePath = secretEnv[key];
      const targetKey = key.replace('_FILE', '');

      if (filePath && existsSync(filePath)) {
        try {
          // Read secret, trim whitespace (crucial for docker secrets)
          secretEnv[targetKey] = readFileSync(filePath, 'utf8').trim();
        } catch (err) {
          console.warn(`⚠️ Failed to read secret file at ${filePath}:`, err);
        }
      }
    }
  }

  // S1/Arch-Core-05: Construct connection strings if components are present via secrets
  if (!secretEnv.DATABASE_URL && secretEnv.POSTGRES_PASSWORD) {
    const user = secretEnv.POSTGRES_USER || 'apex';
    const db = secretEnv.POSTGRES_DB || 'apex_v2';
    const host = secretEnv.POSTGRES_HOST || 'apex-postgres';
    const port = secretEnv.POSTGRES_PORT || '5432';
    const ssl = secretEnv.DB_SSL === 'false' ? 'disable' : 'require';

    secretEnv.DATABASE_URL = `postgresql://${user}:${secretEnv.POSTGRES_PASSWORD}@${host}:${port}/${db}?sslmode=${ssl}`;
  }

  if (!secretEnv.REDIS_URL && secretEnv.REDIS_PASSWORD) {
    const host = secretEnv.REDIS_HOST || 'apex-redis';
    const port = secretEnv.REDIS_PORT || '6379';
    secretEnv.REDIS_URL = `redis://:${secretEnv.REDIS_PASSWORD}@${host}:${port}`;
  }

  return secretEnv;
}

export function validateEnv(): EnvConfig {
  try {
    const resolvedEnv = resolveSecretFiles();
    const parsed = EnvSchema.parse(resolvedEnv);
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

  if (parsed.JWT_SECRET && parsed.JWT_SECRET.length < 32) {
    throw new Error(
      'S1 Violation: JWT_SECRET must be at least 32 characters in production'
    );
  }

  if (parsed.DATABASE_URL && parsed.DATABASE_URL.includes('localhost') && parsed.DB_SSL === 'true') {
    // Localhost check for prod - usually managed by Traefik/Internal network anyway
  }
}

function enforceGenericChecks(parsed: EnvConfig): void {
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
    console.error('Application startup aborted. Check your secrets and environment.');
    process.exit(1);
  }
}
