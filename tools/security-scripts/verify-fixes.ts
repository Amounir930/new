import { EnvSchema } from '../../packages/config/src/schema'; // Adjust path
import { EncryptionService } from '../../packages/security/src/encryption'; // Adjust path
import { z } from 'zod';

console.log('🛡️ Verifying Defense-in-Depth Fixes...');

// Mock process.env for testing
const originalEnv = process.env;

// --- S1: Config Schema Verification ---
console.log('\n🔍 S1: Config Schema Verification');

// Test Case 1: Loose Test Mode (Should Pass)
console.log('  Testing Loose Test Mode...');
process.env.NODE_ENV = 'test';
process.env.ENABLE_S1_ENFORCEMENT = 'false';
try {
  EnvSchema.parse({
    JWT_SECRET: 'short', // Invalid but ignored in loose test mode? No, regex still applies?
    // Wait, regex might still apply if not conditional. Let's check logic.
    // Length check is NOT conditional in schema.ts, only specific "test" keyword checks
    // So we use valid length but "test" keyword
    JWT_SECRET: 'valid_length_key_that_contains_word_test_12345',
    ENCRYPTION_MASTER_KEY:
      'valid_length_key_that_contains_word_test_12345_very_long',
    DATABASE_URL: 'postgresql://localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    MINIO_ENDPOINT: 'localhost',
    MINIO_ACCESS_KEY: 'admin',
    MINIO_SECRET_KEY: 'password',
  });
  console.log('  ✅ Loose Test Mode: PASSED (As expected)');
} catch (e) {
  console.error('  ❌ Loose Test Mode: FAILED', e);
}

// Test Case 2: Strict Production Mode (Should Fail)
console.log('  Testing Strict Production Mode...');
process.env.NODE_ENV = 'production';
process.env.ENABLE_S1_ENFORCEMENT = 'true';
try {
  EnvSchema.parse({
    JWT_SECRET: 'valid_length_key_that_contains_word_test_12345',
    ENCRYPTION_MASTER_KEY:
      'valid_length_key_that_contains_word_test_12345_very_long', // Contains 'test'
    DATABASE_URL: 'postgresql://localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    MINIO_ENDPOINT: 'localhost',
    MINIO_ACCESS_KEY: 'admin',
    MINIO_SECRET_KEY: 'password',
  });
  console.error(
    '  ❌ Strict Production Mode: FAILED (Should have thrown error)'
  );
} catch (e: any) {
  if (
    e.issues &&
    e.issues.some((i: any) => i.message.includes('S1 Violation'))
  ) {
    console.log(
      '  ✅ Strict Production Mode: PASSED (Caught expected S1 Violation)'
    );
  } else {
    console.error('  ❌ Strict Production Mode: FAILED (Unexpected error)', e);
  }
}

// --- S7: Encryption Verification ---
console.log('\n🔍 S7: Encryption Verification');

process.env.NODE_ENV = 'production';
process.env.ENCRYPTION_MASTER_KEY = 'WeakKey';

try {
  new EncryptionService();
  console.error('  ❌ Weak Key Check: FAILED (Should have thrown error)');
} catch (e: any) {
  if (
    e.message.includes('S1 Violation') &&
    e.message.includes('32 characters')
  ) {
    console.log('  ✅ Weak Key Check (Length): PASSED');
  } else {
    console.error('  ❌ Weak Key Check (Length): FAILED (Unexpected error)', e);
  }
}

process.env.ENCRYPTION_MASTER_KEY =
  'ThisKeyIsLongEnoughButHasNoNumbersOrSpecials'; // gitleaks:allow
try {
  new EncryptionService();
  console.error('  ❌ Complexity Check: FAILED (Should have thrown error)');
} catch (e: any) {
  if (e.message.includes('complexity')) {
    console.log('  ✅ Complexity Check: PASSED');
  } else {
    // Ensure we catch the specific complexity error
    if (e.message.includes('S1 Violation')) {
      console.log('  ✅ Complexity Check: PASSED (Caught violation)');
    } else {
      console.error('  ❌ Complexity Check: FAILED (Unexpected error)', e);
    }
  }
}

console.log('\n🎉 Verification Complete!');
process.env = originalEnv;
