/**
 * Migration Runner
 * Executes Atlas declarative migrations against tenant schemas (Enterprise 2026)
 */

import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';
import { sanitizeSchemaName } from './schema-manager';

const execFileAsync = promisify(execFile);

export interface MigrationResult {
  schemaName: string;
  appliedCount: number;
  durationMs: number;
}

/**
 * Run migrations for a specific tenant schema using Atlas
 * @param subdomain - Tenant identifier
 */
export async function runTenantMigrations(
  subdomain: string
): Promise<MigrationResult> {
  const startTime = Date.now();

  // 1. Strict Validation (Protocol Delta-Injection)
  const SubdomainSchema = z
    .string()
    .regex(/^[a-z0-9_-]+$/)
    .min(3)
    .max(50);
  const validatedSubdomain = SubdomainSchema.parse(subdomain);
  const schemaName = sanitizeSchemaName(validatedSubdomain);

  // 2. Resolve Paths
  const rootDir = path.resolve(
    new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
    '..' + '/..' + '/..'
  );

  // Source of Truth: storefront.hcl
  const hclPath = path.join(rootDir, 'packages/db/storefront.hcl');

  // 3. Construct Secure Connection String (Protocol Alpha-Secure)
  // We use the environment variables for database credentials
  const { env } = await import('@apex/config');

  const dbHost = process.env.DATABASE_URL?.includes('pgbouncer')
    ? 'apex-pgbouncer'
    : 'apex-postgres';
  const dbUrl = `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${dbHost}:5432/${env.POSTGRES_DB}?sslmode=require`;

  process.stdout.write(
    `[Runner] Orchestrating Atlas for schema: ${schemaName}\n`
  );

  try {
    // 4. Secure Atlas Execution (Process Isolation)
    const atlasEnv = {
      ...process.env,
      ATLAS_DB_URL: dbUrl,
      HOME: '/tmp',
      XDG_CACHE_HOME: '/tmp/.cache',
      ATLAS_CACHE: '/tmp/.atlas-cache',
      ATLAS_CONFIG: '/tmp/.atlas-config',
    };

    // Use execFile to prevent shell interpolation/injection
    const { stdout, stderr } = await execFileAsync(
      'atlas',
      [
        'schema',
        'apply',
        '--url',
        dbUrl,
        '--to',
        `file://${hclPath}`,
        '--dev-url',
        `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${dbHost}:5432/${env.POSTGRES_DB}?sslmode=require&search_path=public`, 
        '--var',
        `tenant_schema_name=${schemaName}`,
        '--auto-approve',
      ],
      { env: atlasEnv }
    );

    process.stdout.write(`[Runner] Atlas Output: ${stdout}\n`);
    if (stderr)
      process.stdout.write(`[Runner] Atlas Warning/Error: ${stderr}\n`);

    const durationMs = Date.now() - startTime;

    return {
      schemaName,
      appliedCount: 1,
      durationMs,
    };
  } catch (error) {
    process.stdout.write(
      `S2 ATLAS MIGRATION FAILURE for ${schemaName}: ${String(error)}\n`
    );
    // Sanitize error message before throwing to prevent credential leak in logs
    const sanitizedError = new Error(
      `Atlas Migration Failed for ${schemaName}. See internal logs.`
    );
    throw sanitizedError;
  }
}
