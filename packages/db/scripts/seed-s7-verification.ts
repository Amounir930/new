import { publicPool } from '../src/connection';
import { EncryptionService } from '@apex/security';

const TABLE_NAME = 'public.s7_verification_data';
const KNOWN_PLAINTEXT = 'S7_VERIFICATION_SECRET_PLAINTEXT_2026';

async function seed() {
    console.log('🌱 Seeding S7 verification data...');
    const client = await publicPool.connect();

    try {
        // 1. Ensure Table Exists
        await client.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id SERIAL PRIMARY KEY,
        label TEXT NOT NULL,
        encrypted_payload TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
        console.log('✅ Table verified');

        // 2. Encrypt Data
        // Initialize service (it will read ENCRYPTION_MASTER_KEY from env)
        const encryptionService = new EncryptionService();
        const { encrypted, iv, tag, salt } = encryptionService.encrypt(KNOWN_PLAINTEXT);

        // Store as JSON or defined format? 
        // The check uses "grep" for known plaintext markers.
        // We should verify what format the check expects. 
        // The check just expects bytes. Standard format is usually: salt:iv:tag:encrypted
        // But let's check what the encryption service returns. It returns an object.

        // Simplest format compatible with "grep" check (checking it's NOT plaintext)
        const payload = JSON.stringify({ encrypted, iv, tag, salt });
        console.log('✅ Data encrypted');

        // 3. Insert Data
        await client.query(
            `INSERT INTO ${TABLE_NAME} (label, encrypted_payload) VALUES ($1, $2)`,
            ['s7_gate_test', payload]
        );

        console.log('✅ Verification data seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to seed data:', error);
        process.exit(1);
    } finally {
        client.release();
        await publicPool.end();
    }
}

seed();
