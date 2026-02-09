/**
 * Vitest Global Setup
 * satisfy S1 Environmental Validation Protocol (Rule S1)
 * S1 FIX: Using cryptographically secure random generation for test secrets
 */

import { randomBytes } from 'crypto';

// S1 FIX: Generate secure random secrets instead of predictable patterns
// These are test-only values generated at runtime, never hardcoded
const generateTestSecret = (length: number): string => {
  return randomBytes(length).toString('base64url').slice(0, length);
};

// JWT_SECRET must be >= 32 chars and match /^[A-Za-z0-9-_]+$/
process.env.JWT_SECRET = generateTestSecret(32);

// S1 FIX: Use environment variables from CI if available, otherwise generate secure random values
process.env.DATABASE_URL =
  process.env.CI_DATABASE_URL || 'postgresql://localhost:5432/test';
process.env.MINIO_ENDPOINT = process.env.CI_MINIO_ENDPOINT || 'localhost';
process.env.MINIO_ACCESS_KEY =
  process.env.CI_MINIO_ACCESS_KEY || generateTestSecret(20);
process.env.MINIO_SECRET_KEY =
  process.env.CI_MINIO_SECRET_KEY || generateTestSecret(40);
// Vitest sets NODE_ENV to 'test' automatically
process.env.JWT_EXPIRES_IN = '1h';
process.env.ENABLE_S1_ENFORCEMENT = 'false';

// S7 FIX: Generate secure encryption key for tests (32+ chars with mixed case, numbers, special chars)
process.env.ENCRYPTION_MASTER_KEY =
  `${generateTestSecret(16)}A1!${generateTestSecret(16)}`;
