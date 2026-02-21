// 🛡️ S1 Bypass: Ensure env validation doesn't crash simulation in CI
process.env.NODE_ENV = 'test';

/**
 * S6.3 - Active Throttling Stress Test
 * Simulates rapid requests to verify 429 Too Many Requests
 * This script interacts directly with the RateLimitStore to verify behavioral integrity.
 */
async function runTest() {
  // Dynamic imports ensure env vars are processed FIRST (before auto-enforcing S1)
  const { ConfigService } = await import('../../packages/config/src');
  const { RedisRateLimitStore } = await import(
    '../../packages/middleware/src/redis-rate-limit-store'
  );

  const maxRequests = Number.parseInt(process.env.MAX_REQUESTS || '10', 10);
  const store = new RedisRateLimitStore(new ConfigService());
  const testKey = 'stress:test:behavioral';
  const windowMs = 60000;

  console.log(
    `⚔️  S6.3: Starting Behavioral Throttling Test (Limit: ${maxRequests})`
  );

  // 1. Initial requests within limit
  for (let i = 1; i <= maxRequests; i++) {
    const { count } = await store.increment(testKey, windowMs);
    console.log(`[Request ${i}] Count: ${count}`);
    if (count > maxRequests) {
      console.error(`🚨 S6.3 FAILURE: Blocked too early at ${count}`);
      process.exit(1);
    }
  }

  // 2. The Throttling Request (Must reach 429 condition)
  const { count: finalCount } = await store.increment(testKey, windowMs);
  console.log(`[Request ${maxRequests + 1}] Final Count: ${finalCount}`);

  if (finalCount > maxRequests) {
    console.log(
      '✅ S6.3 SUCCESS: Behavioral Throttling verified (429 condition reached)'
    );

    // 3. Verify violations incremented
    const violations = await store.incrementViolations(testKey, 300000);
    console.log(`[Violations] Current: ${violations}`);
    if (violations > 0) {
      console.log('✅ S6.3: Behavioral Violation counter functional.');
    }

    // Surgical Fix: Explicitly close connections to prevent CI hang
    try {
      const client = await store.getClient();
      if (client) {
        await client.quit();
        console.log('📡 Redis connection closed.');
      }
    } catch (e) {
      console.warn('⚠️ Warning during Redis disconnection:', e);
    }

    process.exit(0);
  } else {
    console.error(
      '🚨 S6.3 FAILURE: Rate limiter allowed requests beyond threshold!'
    );
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('❌ S6.3 Stress Test Failed:', err);
  process.exit(1);
});
