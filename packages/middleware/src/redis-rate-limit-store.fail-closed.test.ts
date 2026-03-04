import { describe, expect, it, mock } from 'bun:test';
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

  it('should reject requests (503) if Redis is unreachable in production', async () => {
    const mockConfig = {
      get: mock((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        return 'redis://localhost:6379';
      }),
    };
    store = new RedisRateLimitStore(mockConfig as never);

    try {
      // Access private
      (store as unknown as Record<string, unknown>).client = null;
      (store as unknown as Record<string, unknown>).fallbackToMemory = false;

      await store.increment('test-ip', 60000);
      expect(true).toBe(false); // Should not reach here
    } catch (e: unknown) {
      // NestJS HttpException uses getStatus()
      expect(e.getStatus()).toBe(503);
      expect(e.getResponse().message).toContain(
        'Rate limiting service unavailable'
      );
    }
  });

  it('should allow memory fallback in non-production', async () => {
    const mockConfig = {
      get: mock((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        return 'redis://localhost:6379';
      }),
    };
    store = new RedisRateLimitStore(mockConfig as never);

    (store as unknown as Record<string, unknown>).client = null;
    (store as unknown as Record<string, unknown>).fallbackToMemory = true;

    const result = await store.increment('test-ip', 60000);
    expect(result.count).toBe(1);
  });
});
