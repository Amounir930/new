import { EnvSchema } from '@apex/config/schema'; // Adjust path
import { EncryptionService } from '@apex/security/encryption'; // Adjust path

process.stdout.write('🛡️ Verifying Defense-in-Depth Fixes...');

// Mock process.env for testing
const originalEnv = process.env;

// --- S1: Config Schema Verification ---
process.stdout.write('\n🔍 S1: Config Schema Verification');

// Test Case 1: Loose Test Mode (Should Pass)
process.stdout.write('  Testing Loose Test Mode...');
process.env['NODE_ENV'] = 'test';
process.env['ENABLE_S1_ENFORCEMENT'] = 'false';
try {
  EnvSchema.parse({
    // Regex still applies if not conditional. Let's check logic.
    // Length check is NOT conditional in schema.ts, only specific "test" keyword checks
    // So we use valid length but "test" keyword
    JWT_SECRET: 'valid_length_key_that_contains_word_test_12345',
    ENCRYPTION_MASTER_KEY: // gitleaks:allow
      'valid_length_key_that_contains_word_test_12345_very_long',
    DATABASE_URL: 'postgresql://localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    MINIO_ENDPOINT: 'localhost',
    MINIO_ACCESS_KEY: 'admin',
    MINIO_SECRET_KEY: 'password',
  });
  process.stdout.write('  ✅ Loose Test Mode: PASSED (As expected)');
} catch (e) {
  process.stdout.write('  ❌ Loose Test Mode: FAILED', e);
}

// Test Case 2: Strict Production Mode (Should Fail)
process.stdout.write('  Testing Strict Production Mode...');
process.env['NODE_ENV'] = 'production';
process.env['ENABLE_S1_ENFORCEMENT'] = 'true';
try {
  EnvSchema.parse({
    JWT_SECRET: 'valid_length_key_that_contains_word_test_12345',
    ENCRYPTION_MASTER_KEY: // gitleaks:allow
      'valid_length_key_that_contains_word_test_12345_very_long', // Contains 'test'
    DATABASE_URL: 'postgresql://localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    MINIO_ENDPOINT: 'localhost',
    MINIO_ACCESS_KEY: 'admin',
    MINIO_SECRET_KEY: 'password',
  });
  process.stdout.write(
    '  ❌ Strict Production Mode: FAILED (Should have thrown error)'
  );
} catch (e: unknown) {
  if (e.issues?.some((i: unknown) => i.message.includes('S1 Violation'))) {
    process.stdout.write(
      '  ✅ Strict Production Mode: PASSED (Caught expected S1 Violation)'
    );
  } else {
    process.stdout.write(
      '  ❌ Strict Production Mode: FAILED (Unexpected error)',
      e
    );
  }
}

// --- S7: Encryption Verification ---
process.stdout.write('\n🔍 S7: Encryption Verification');

process.env['NODE_ENV'] = 'production';
process.env['ENCRYPTION_MASTER_KEY'] = 'WeakKey'; // gitleaks:allow

try {
  new EncryptionService();
  process.stdout.write(
    '  ❌ Weak Key Check: FAILED (Should have thrown error)'
  );
} catch (e: unknown) {
  if (
    e.message.includes('S1 Violation') &&
    e.message.includes('32 characters')
  ) {
    process.stdout.write('  ✅ Weak Key Check (Length): PASSED');
  } else {
    process.stdout.write(
      '  ❌ Weak Key Check (Length): FAILED (Unexpected error)',
      e
    );
  }
}

process.env['ENCRYPTION_MASTER_KEY'] = // gitleaks:allow
  'ThisKeyIsLongEnoughButHasNoNumbersOrSpecials';
try {
  new EncryptionService();
  process.stdout.write(
    '  ❌ Complexity Check: FAILED (Should have thrown error)'
  );
} catch (e: unknown) {
  if (e.message.includes('complexity')) {
    process.stdout.write('  ✅ Complexity Check: PASSED');
  } else {
    // Ensure we catch the specific complexity error
    if (e.message.includes('S1 Violation')) {
      process.stdout.write('  ✅ Complexity Check: PASSED (Caught violation)');
    } else {
      process.stdout.write(
        '  ❌ Complexity Check: FAILED (Unexpected error)',
        e
      );
    }
  }
}

process.stdout.write('\n🎉 Verification Complete!');
process.env = originalEnv;
