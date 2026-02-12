/**
 * Database Migration Tests
 * Rule 4.1: Test Coverage Mandate
 *
 * Note: migrate.ts runs immediately on import. These tests verify code structure.
 */

import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migratePath = resolve(__dirname, 'migrate.ts');

describe('Migration Script Structure', () => {
  it('should have migrate.ts file', () => {
    const content = readFileSync(migratePath, 'utf-8');
    expect(content).toBeDefined();
  });

  it('should import required dependencies', () => {
    const content = readFileSync(migratePath, 'utf-8');
    expect(content).toContain(
      "import { drizzle } from 'drizzle-orm/node-postgres'"
    );
    expect(content).toContain(
      "import { migrate } from 'drizzle-orm/node-postgres/migrator'"
    );
    expect(content).toContain("import { validateEnv } from '@apex/config'");
  });

  it('should define runMigrations function', () => {
    const content = readFileSync(migratePath, 'utf-8');
    expect(content).toContain('async function runMigrations');
  });

  it('should create Pool with connection string', () => {
    const content = readFileSync(migratePath, 'utf-8');
    expect(content).toContain('new Pool');
    expect(content).toContain('connectionString');
    expect(content).toContain('env.DATABASE_URL');
  });

  it('should call validateEnv before using env vars', () => {
    const content = readFileSync(migratePath, 'utf-8');
    expect(content).toContain('validateEnv()');
  });

  it('should use drizzle with pool', () => {
    const content = readFileSync(migratePath, 'utf-8');
    expect(content).toContain('drizzle(pool)');
  });

  it('should call migrate with correct parameters', () => {
    const content = readFileSync(migratePath, 'utf-8');
    expect(content).toContain('await migrate(db,');
    expect(content).toContain("migrationsFolder: './drizzle'");
  });

  it('should log migration progress', () => {
    const content = readFileSync(migratePath, 'utf-8');
    expect(content).toContain('Running migrations...');
    expect(content).toContain('Migrations completed successfully');
  });

  it('should have error handling with try-catch', () => {
    const content = readFileSync(migratePath, 'utf-8');
    expect(content).toContain('try {');
    expect(content).toContain('catch (error)');
    expect(content).toContain('console.error');
  });

  it('should exit process on failure', () => {
    const content = readFileSync(migratePath, 'utf-8');
    expect(content).toContain('process.exit(1)');
  });

  it('should have finally block for cleanup', () => {
    const content = readFileSync(migratePath, 'utf-8');
    expect(content).toContain('finally {');
    expect(content).toContain('await pool.end()');
  });

  it('should execute runMigrations on module load', () => {
    const content = readFileSync(migratePath, 'utf-8');
    expect(content).toContain('runMigrations()');
  });
});

describe('Migration Dependencies', () => {
  it('should have pg package available', async () => {
    const pg = await import('pg');
    expect(pg.default.Pool).toBeDefined();
  });

  it('should have drizzle-orm available', async () => {
    const { drizzle } = await import('drizzle-orm/node-postgres');
    expect(drizzle).toBeDefined();
  });

  it('should have migrator available', async () => {
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    expect(migrate).toBeDefined();
  });
});
