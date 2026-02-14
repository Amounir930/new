import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { RedisRateLimitStore } from './redis-rate-limit-store';

// Mock redis module
mock.module('redis', () => ({
  createClient: () => ({
    on: mock(),
    connect: mock().mockRejectedValue(new Error('Redis connection failed')),
    isOpen: false,
  }),
}));

describe('S6 Fail-Closed Behavior (Production)', () => {
  let store: RedisRateLimitStore;

  beforeEach(() => {
    // Mock ConfigService
    const mockConfig = {
      get: mock().mockReturnValue('redis://localhost:6379'),
    };
    store = new RedisRateLimitStore(mockConfig as any);
  });

  it('should reject requests (503) if Redis is unreachable in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      // @ts-expect-error - access private
      store.client = null;
      // @ts-expect-error
      store.fallbackToMemory = false;

      await store.increment('test-ip', 60000);
      expect(true).toBe(false); // Should not reach here
    } catch (e: any) {
      // NestJS HttpException uses getStatus()
      expect(e.getStatus()).toBe(503);
      expect(e.getResponse().message).toContain(
        'Rate limiting service unavailable'
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should allow memory fallback in non-production', async () => {
    process.env.NODE_ENV = 'development';

    // @ts-expect-error
    store.client = null;
    // @ts-expect-error
    store.fallbackToMemory = true;

    const result = await store.increment('test-ip', 60000);
    expect(result.count).toBe(1);
    // Should stay at 1 for new key
  });
});
