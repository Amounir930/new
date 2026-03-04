#!/usr/bin/env bun

/**
 * Migration Utility: S7/S15 - Graceful Admin Password Hashing
 * Hashes the current SUPER_ADMIN_PASSWORD using bcrypt (12 rounds)
 * to prevent access loss during the V4.0 security hardening.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const ENV_PATH = join(process.cwd(), '.env');

async function migrate() {
  process.stdout.write('🛡️  Apex v2: Graceful Password Migration Starting...');

  if (!existsSync(ENV_PATH)) {
    process.stdout.write('❌ Error: .env file not found at root.');
    process.exit(1);
  }

  const envContent = readFileSync(ENV_PATH, 'utf-8');
  const passwordMatch = envContent.match(/^SUPER_ADMIN_PASSWORD=(.*)$/m);

  if (!passwordMatch) {
    process.stdout.write('❌ Error: SUPER_ADMIN_PASSWORD not found in .env');
    process.exit(1);
  }

  const plaintextPassword = passwordMatch[1].trim();

  if (plaintextPassword.startsWith('$2b$')) {
    process.stdout.write('✅ Password already appears to be hashed. Skipping.');
    return;
  }

  process.stdout.write(`🔒 Hashing plaintext password with ${SALT_ROUNDS} rounds...`);
  const startTime = Date.now();
  const hash = await bcrypt.hash(plaintextPassword, SALT_ROUNDS);
  const duration = Date.now() - startTime;

  process.stdout.write(`✅ Hash generated in ${duration}ms!`);
  process.stdout.write(`📝 Resulting Hash: ${hash}`);

  // Update .env file
  const newEnvContent = envContent.replace(
    /^SUPER_ADMIN_PASSWORD=.*$/m,
    `SUPER_ADMIN_PASSWORD=${hash}`
  );

  writeFileSync(ENV_PATH, newEnvContent);
  process.stdout.write(
    '🚀 .env updated successfully! You can now use this hash with the hardened AuthController.'
  );
}

migrate().catch((err) => {
  process.stdout.write('❌ Fatal Migration Error:', err);
  process.exit(1);
});
