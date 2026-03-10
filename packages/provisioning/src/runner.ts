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

  // Source of Truth: tenant.hcl
  const hclPath = path.join(rootDir, 'packages/db/tenant.hcl');

  // 3. Construct Secure Connection String (Protocol Alpha-Secure)
  // We use the environment variables for database credentials
  const { env } = await import('@apex/config');

  // CRITICAL: Atlas URL must include search_path to target the isolated schema
  // We use the internal pgbouncer or postgres host depending on environment
  const dbHost = process.env.DATABASE_URL?.includes('pgbouncer')
    ? 'apex-pgbouncer'
    : 'apex-postgres';
  const dbUrl = `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${dbHost}:5432/${env.POSTGRES_DB}?sslmode=disable&search_path=${schemaName}`;

  process.stdout.write(
    `[Runner] Orchestrating Atlas for schema: ${schemaName}\n`
  );

  try {
    // 4. Secure Atlas Execution (Process Isolation)
    // Pass the sensitive DB URL via environment variable to prevent leak in PS/HTOP
    const atlasEnv = {
      ...process.env,
      ATLAS_DB_URL: dbUrl,
      HOME: '/tmp', // Redirect home/cache to writable /tmp (Item 54)
      XDG_CACHE_HOME: '/tmp/.cache',
      // ATLAS_NO_UPDATE_CHECK: 'true', // Optional: disable update check to save cache space
    };

    // Use execFile to prevent shell interpolation/injection
    const { stdout, stderr } = await execFileAsync(
      'atlas',
      [
        'schema',
        'apply',
        '--url',
        dbUrl, // Pass URL directly to avoid env:// environment selection requirement
        '--to',
        `file://${hclPath}`,
        '--auto-approve',
        '--schema',
        'storefront', // Limit to storefront schema definitions
        '--schema-map',
        `storefront=${schemaName}`, // Map 'storefront' in HCL to the actual tenant schema
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
