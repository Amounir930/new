/**
 * Vitest Global Setup
 * satisfy S1 Environmental Validation Protocol (Rule S1)
 * S1 FIX: Using cryptographically secure random generation for test secrets
 */

import { randomBytes } from 'node:crypto';

// S1 FIX: Generate secure random secrets instead of predictable patterns
// These are test-only values generated at runtime, never hardcoded
const generateTestSecret = (length: number): string => {
  return randomBytes(length).toString('base64url').slice(0, length);
};

// JWT_SECRET must be >= 32 chars and match /^[A-Za-z0-9-_]+$/
process.env.JWT_SECRET = generateTestSecret(32);

process.env.DATABASE_URL =
  process.env.CI_DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/apex_test';
process.env.REDIS_URL = process.env.CI_REDIS_URL || 'redis://localhost:6379';
process.env.MINIO_ENDPOINT = process.env.CI_MINIO_ENDPOINT || 'localhost';
process.env.MINIO_PORT = '9000';
process.env.MINIO_USE_SSL = 'false';
process.env.MINIO_ACCESS_KEY =
  process.env.CI_MINIO_ACCESS_KEY || generateTestSecret(20);
process.env.MINIO_SECRET_KEY =
  process.env.CI_MINIO_SECRET_KEY || generateTestSecret(40);
process.env.MINIO_BUCKET_NAME = 'test-bucket';
process.env.MINIO_REGION = 'us-east-1';
process.env.TENANT_ISOLATION_MODE = 'strict';
process.env.RATE_LIMIT_TTL = '60';
process.env.RATE_LIMIT_MAX = '100';

// Vitest sets NODE_ENV to 'test' automatically
process.env.JWT_EXPIRES_IN = '1h';
process.env.ENABLE_S1_ENFORCEMENT = 'false';

// S7 FIX: Generate secure encryption key for tests (32+ chars with mixed case, numbers, special chars)
process.env.ENCRYPTION_MASTER_KEY = `${generateTestSecret(
  16
)}A1!${generateTestSecret(16)}`;

/**
 * Radical Stabilization: Global Mocking Bridge
 * Enables 80% coverage goal in Sandbox environment without Docker
 */
import { vi } from 'vitest';

// 🛡️ Mock Bun global for non-Bun environments or CI
if (typeof global.Bun === 'undefined') {
  (global as any).Bun = {
    spawn: vi.fn().mockReturnValue({
      exited: Promise.resolve(),
      exitCode: 0,
      stdout: new ReadableStream(),
      stderr: new ReadableStream(),
    }),
    write: vi.fn().mockResolvedValue(100),
    file: vi.fn().mockReturnValue({
      exists: vi.fn().mockResolvedValue(true),
      size: 1024,
      text: vi.fn().mockResolvedValue('mock content'),
      json: vi.fn().mockResolvedValue({}),
      stream: vi.fn().mockReturnValue(new ReadableStream()),
    }),
    $: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
  };
}

// 🛡️ Mock pg Pool globally to prevent connection failures hanging tests
vi.mock('pg', () => {
  const mClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    release: vi.fn(),
    on: vi.fn(),
  };
  const mPool = {
    connect: vi.fn().mockResolvedValue(mClient),
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    on: vi.fn(),
    end: vi.fn().mockResolvedValue(undefined),
  };
  return {
    default: { Pool: vi.fn(() => mPool) },
    Pool: vi.fn(() => mPool),
  };
});
// 🛡️ Mock ioredis globally to prevent connection failures hanging tests
vi.mock('ioredis', () => {
  const mRedis = {
    on: vi.fn(),
    quit: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    defineCommand: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return {
    default: vi.fn(() => mRedis),
    Redis: vi.fn(() => mRedis),
  };
});

// 🛡️ Mock bullmq globally to prevent background Redis connection attempts
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
    getJob: vi.fn(),
    getJobs: vi.fn().mockResolvedValue([]),
    close: vi.fn().mockResolvedValue(undefined),
  })),
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  })),
  Job: vi.fn(),
}));
