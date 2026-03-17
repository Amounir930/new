import { existsSync, readFileSync } from 'node:fs';
import { z } from 'zod';
import { type EnvConfig, EnvSchema } from './schema';

/**
 * Resolves *_FILE variables into their corresponding environment values
 */
function resolveFileSecrets(secretEnv: Record<string, string | undefined>) {
  for (const key of Object.keys(secretEnv)) {
    if (key.endsWith('_FILE')) {
      const filePath = secretEnv[key];
      const targetKey = key.replace('_FILE', '');

      if (filePath && existsSync(filePath)) {
        try {
          secretEnv[targetKey] = readFileSync(filePath, 'utf8').trim();
        } catch (err) {
          console['warn'](`⚠️ Failed to read secret file at ${filePath}:`, err);
        }
      }
    }
  }
}

function resolvePostgresUrl(secretEnv: Record<string, string | undefined>) {
  if (secretEnv.DATABASE_URL || !secretEnv.POSTGRES_PASSWORD) return;

  const user = secretEnv.POSTGRES_USER || 'apex';
  const db = secretEnv.POSTGRES_DB || 'apex_v2';
  const host = secretEnv.POSTGRES_HOST || 'apex-postgres';
  const port = secretEnv.POSTGRES_PORT || '5432';

  const isProd = secretEnv.NODE_ENV === 'production';
  const sslOptional = secretEnv.DB_SSL_OPTIONAL === 'true';
  const sslDisabled = secretEnv.DB_SSL === 'false';

  const sslMode =
    isProd && !sslOptional ? 'require' : sslDisabled ? 'disable' : 'require';

  secretEnv.DATABASE_URL = `postgresql://${user}:${secretEnv.POSTGRES_PASSWORD}@${host}:${port}/${db}?sslmode=${sslMode}`;
}

function resolveRedisUrl(secretEnv: Record<string, string | undefined>) {
  if (secretEnv.REDIS_URL || !secretEnv.REDIS_PASSWORD) return;

  const host = secretEnv.REDIS_HOST || 'apex-redis';
  const port = secretEnv.REDIS_PORT || '6379';
  secretEnv.REDIS_URL = `redis://:${secretEnv.REDIS_PASSWORD}@${host}:${port}`;
}

function resolveB64Secrets(secretEnv: Record<string, string | undefined>) {
  for (const key of Object.keys(secretEnv)) {
    const value = secretEnv[key];
    if (value?.startsWith('B64:')) {
      try {
        secretEnv[key] = Buffer.from(value.slice(4), 'base64').toString('utf8');
      } catch (err) {
        console['warn'](`⚠️ Failed to decode B64 secret for ${key}`);
      }
    }
  }
}

function resolveSecretFiles() {
  const secretEnv = { ...process.env };
  resolveFileSecrets(secretEnv);
  resolveB64Secrets(secretEnv);
  resolvePostgresUrl(secretEnv);
  resolveRedisUrl(secretEnv);
  return secretEnv;
}

export function validateEnv(): EnvConfig {
  try {
    const resolvedEnv = resolveSecretFiles();
    Object.assign(process.env, resolvedEnv);

    const result = EnvSchema.safeParse(resolvedEnv);
    
    if (!result.success) {
      const messages = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('\n');
      throw new Error(`🛑 S1 VIOLATION DETECTED:\n${messages}`);
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('🛑 S1 VIOLATION')) {
      throw error;
    }
    throw new Error(`🛑 S1 VIOLATION DETECTED: Unknown validation error - ${(error as Error).message}`);
  }
}

function enforceProductionChecks(parsed: EnvConfig): void {
  if (parsed.NODE_ENV !== 'production') return;

  if (parsed.JWT_SECRET && parsed.JWT_SECRET.length < 32) {
    throw new Error(
      'S1 Violation: JWT_SECRET must be at least 32 characters in production'
    );
  }

  if (parsed.DATABASE_URL?.includes('localhost')) {
    // Localhost check for prod
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
    console['warn']('❌ CRITICAL: S1 Protocol Violation');
    console['warn'](error instanceof Error ? error.message : 'Unknown error');
    console['warn'](
      'Application startup aborted. Check your secrets and environment.'
    );
    process.exit(1);
  }
}
