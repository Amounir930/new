/**
 * Migration Runner
 * Executes Atlas declarative migrations against tenant schemas (Enterprise 2026)
 */

import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { Client } from 'pg';
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

  // 3. Construct Secure Connection Strings (Protocol Alpha-Secure)
  const { env } = await import('@apex/config');

  const dbHost = process.env.DATABASE_URL?.includes('pgbouncer')
    ? 'apex-pgbouncer'
    : 'apex-postgres';

  // Sovereign Split SSL Policy: PgBouncer requires SSL, raw Postgres does not.
  const mainUrl = `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${dbHost}:5432/${env.POSTGRES_DB}?sslmode=require`;

  // Engineer's Fix: Explicit search_path=public so Atlas resolves vector(1536) → public.vector
  const devUrl = `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@apex-postgres:5432/apex_dev_blank?sslmode=disable&options=-c%20search_path%3Dpublic`;

  process.stdout.write(
    `[Runner] Orchestrating Atlas for schema: ${schemaName}\n`
  );

  // 4. Self-Healing Dev DB Pre-flight (Engineer's Fix)
  // Ensures the pgvector extension exists in apex_dev_blank before every Atlas run,
  // regardless of container restarts or volume state.
  const devClient = new Client({ connectionString: devUrl });
  try {
    await devClient.connect();
    await devClient.query(
      'CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;'
    );
    process.stdout.write(
      `[Runner] Dev DB pre-flight: vector extension ready.\n`
    );
  } catch (err) {
    // Non-fatal warning: Atlas may still succeed if extension was already installed
    const safeErr = String(err).replace(
      /postgres:\/\/[^@]+@/g,
      'postgres://***:***@'
    );
    process.stdout.write(
      `[Runner] Warning: Dev DB pre-flight partial failure: ${safeErr}\n`
    );
  } finally {
    await devClient.end();
  }

  try {
    // 5. Secure Atlas Execution (Process Isolation)
    const atlasEnv = {
      ...process.env,
      ATLAS_DB_URL: mainUrl,
      HOME: '/tmp',
      XDG_CACHE_HOME: '/tmp/.cache',
      ATLAS_CACHE: '/tmp/.atlas-cache',
      ATLAS_CONFIG: '/tmp/.atlas-config',
    };

    // Use execFile to prevent shell interpolation/injection (Protocol Beta)
    const { stdout, stderr } = await execFileAsync(
      'atlas',
      [
        'schema',
        'apply',
        '--url',
        mainUrl,
        '--to',
        `file://${hclPath}`,
        '--dev-url',
        devUrl,
        '--var',
        `tenant_schema_name=${schemaName}`,

        // 🔒 الحصار المعماري الإلزامي (Blast-Radius Containment)
        '--schema',
        schemaName, // التصريح بإنشاء وإدارة مخطط التاجر الجديد فقط
        '--schema',
        'public', // التصريح بقراءة الأنواع من العام فقط

        // ⛔ مناطق محرمة (No-Fly Zones) - منع المساس بالمخططات السيادية
        '--exclude',
        'public.*', // يمنع إنشاء/حذف جداول داخل public
        '--exclude',
        'governance.*',
        '--exclude',
        'vault.*',
        '--exclude',
        'shared.*',

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
    // SECURITY P0: Sanitize credentials before logging (Protocol Alpha-S7)
    const rawError = String(error);
    const maskedError = rawError.replace(
      /postgres:\/\/[^@]+@/g,
      'postgres://***:***@'
    );

    process.stdout.write(
      `[S2] ATLAS MIGRATION FAILURE for ${schemaName}: ${maskedError}\n`
    );

    throw new Error(
      `Atlas Migration Failed for ${schemaName}. See internal logs.`
    );
  }
}
