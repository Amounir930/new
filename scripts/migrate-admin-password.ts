#!/usr/bin/env bun
/**
 * Migration Utility: S7/S15 - Graceful Admin Password Hashing
 * Hashes the current SUPER_ADMIN_PASSWORD using bcrypt (12 rounds)
 * to prevent access loss during the V4.0 security hardening.
 */

import bcrypt from 'bcrypt';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SALT_ROUNDS = 12;
const ENV_PATH = join(process.cwd(), '.env');

async function migrate() {
    console.log('🛡️  Apex v2: Graceful Password Migration Starting...');

    if (!existsSync(ENV_PATH)) {
        console.error('❌ Error: .env file not found at root.');
        process.exit(1);
    }

    const envContent = readFileSync(ENV_PATH, 'utf-8');
    const passwordMatch = envContent.match(/^SUPER_ADMIN_PASSWORD=(.*)$/m);

    if (!passwordMatch) {
        console.error('❌ Error: SUPER_ADMIN_PASSWORD not found in .env');
        process.exit(1);
    }

    const plaintextPassword = passwordMatch[1].trim();

    if (plaintextPassword.startsWith('$2b$')) {
        console.log('✅ Password already appears to be hashed. Skipping.');
        return;
    }

    console.log(`🔒 Hashing plaintext password with ${SALT_ROUNDS} rounds...`);
    const startTime = Date.now();
    const hash = await bcrypt.hash(plaintextPassword, SALT_ROUNDS);
    const duration = Date.now() - startTime;

    console.log(`✅ Hash generated in ${duration}ms!`);
    console.log(`📝 Resulting Hash: ${hash}`);

    // Update .env file
    const newEnvContent = envContent.replace(
        /^SUPER_ADMIN_PASSWORD=.*$/m,
        `SUPER_ADMIN_PASSWORD=${hash}`
    );

    writeFileSync(ENV_PATH, newEnvContent);
    console.log('🚀 .env updated successfully! You can now use this hash with the hardened AuthController.');
}

migrate().catch(err => {
    console.error('❌ Fatal Migration Error:', err);
    process.exit(1);
});
