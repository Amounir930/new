import { env } from '@apex/config';
import { createClient } from 'redis';

/**
 * S6: Redis Health Verification Script
 * Used by CI gate to verify active connectivity
 */
async function verifyRedis() {
  const redisUrl = env.REDIS_URL || 'redis://localhost:6379';
  console.log(`🔍 S6: Verifying Redis connectivity at ${redisUrl}...`);

  const client = createClient({ url: redisUrl });

  try {
    await client.connect();
    const result = await client.ping();
    if (result === 'PONG') {
      console.log('✅ S6: Redis connection verified (PONG)');
      process.exit(0);
    } else {
      console.error(`❌ S6: Redis returned unexpected result: ${result}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(
      `❌ S6: Redis connectivity failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
    process.exit(1);
  } finally {
    if (client.isOpen) {
      await client.disconnect();
    }
  }
}

verifyRedis();
