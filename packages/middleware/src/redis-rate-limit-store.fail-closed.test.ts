import { describe, expect, it, mock } from 'bun:test';
import type { ConfigService } from '@apex/config/server';
import { MockFactory } from '@apex/test-utils';
import type { HttpException } from '@nestjs/common';
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
    const mockConfig = MockFactory.createConfigService();
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'production';
      return 'redis://localhost:6379';
    });
    store = new RedisRateLimitStore(mockConfig as unknown as ConfigService);

    try {
      // Access private via @ts-expect-error to avoid unsafe casts
      // @ts-expect-error - accessing private member
      store.client = null;
      // @ts-expect-error - accessing private member
      store.fallbackToMemory = false;

      await store.increment('test-ip', 60000);
      expect(true).toBe(false); // Should not reach here
    } catch (e: unknown) {
      const error = e as HttpException;
      // NestJS HttpException uses getStatus()
      expect(error.getStatus()).toBe(503);
      expect(
        (error.getResponse() as Record<string, unknown>).message
      ).toContain('Rate limiting service unavailable');
    }
  });

  it('should allow memory fallback in non-production', async () => {
    const mockConfig = MockFactory.createConfigService();
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'development';
      return 'redis://localhost:6379';
    });
    store = new RedisRateLimitStore(mockConfig as unknown as ConfigService);

    // @ts-expect-error - accessing private member
    store.client = null;
    // @ts-expect-error - accessing private member
    store.fallbackToMemory = true;

    const result = await store.increment('test-ip', 60000);
    expect(result.count).toBe(1);
  });
});
