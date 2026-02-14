import { createClient } from 'redis';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RedisRateLimitStore } from './redis-rate-limit-store.js';

// Mock redis
vi.mock('redis', () => ({
  createClient: vi.fn(),
}));

describe('RedisRateLimitStore', () => {
  let store: RedisRateLimitStore;
  let mockRedisClient: any;
  let mockMulti: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup redis mock
    mockMulti = {
      incr: vi.fn().mockReturnThis(),
      ttl: vi.fn().mockReturnThis(),
      zRemRangeByScore: vi.fn().mockReturnThis(),
      zAdd: vi.fn().mockReturnThis(),
      zCard: vi.fn().mockReturnThis(),
      pExpire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([0, 0, 1, true]), // results[2] is zCard count
    };

    mockRedisClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      isOpen: false,
      multi: vi.fn().mockReturnValue(mockMulti),
      expire: vi.fn(),
      get: vi.fn(),
      setEx: vi.fn(),
      incr: vi.fn(),
      ttl: vi.fn(),
    };

    (createClient as any).mockReturnValue(mockRedisClient);

    const mockConfigService = {
      get: vi.fn(),
    };
    mockConfigService.get.mockReturnValue('redis://localhost:6379');

    store = new RedisRateLimitStore(mockConfigService as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(store).toBeDefined();
  });

  describe('connect', () => {
    it('should connect to redis', async () => {
      await (store as any).connect();
      expect(createClient).toHaveBeenCalled();
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should handle connection error and fallback to memory in dev', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));
      await (store as any).connect();

      // Should set fallbackToMemory to true
      expect((store as any).fallbackToMemory).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle connection error and NOT fallback in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));
      await (store as any).connect();

      // Should set fallbackToMemory to false (strict)
      expect((store as any).fallbackToMemory).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('increment', () => {
    it('should use redis if available', async () => {
      mockRedisClient.isOpen = true;
      // Force client injection
      (store as any).client = mockRedisClient;

      const res = await store.increment('key', 60000);

      expect(mockMulti.zAdd).toHaveBeenCalled();
      expect(mockMulti.zCard).toHaveBeenCalled();
      expect(mockMulti.exec).toHaveBeenCalled();
      expect(res).toEqual({ count: 1, ttl: 60 });
    });

    it('should use memory if fallback is active', async () => {
      (store as any).fallbackToMemory = true;
      (store as any).client = null;

      const res1 = await store.increment('key', 60000);
      expect(res1.count).toBe(1);

      const res2 = await store.increment('key', 60000);
      expect(res2.count).toBe(2);
    });

    it('should throw in production if redis unavailable', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      (store as any).fallbackToMemory = false;
      (store as any).client = null;

      await expect(store.increment('key', 60000)).rejects.toThrow(
        'Rate limiting service unavailable'
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('getViolations', () => {
    it('should get from redis if available', async () => {
      mockRedisClient.isOpen = true;
      (store as any).client = mockRedisClient;
      mockRedisClient.get.mockResolvedValue('5');

      const violations = await store.getViolations('key');
      expect(violations).toBe(5);
      expect(mockRedisClient.get).toHaveBeenCalledWith('key:violations');
    });

    it('should get from memory if fallback', async () => {
      (store as any).fallbackToMemory = true;
      (store as any).client = null;

      // Seed memory
      (store as any).memoryStore.set('key', {
        count: 1,
        resetTime: Date.now() + 1000,
        violations: 3,
      });

      const violations = await store.getViolations('key');
      expect(violations).toBe(3);
    });
  });

  describe('incrementViolations', () => {
    it('should use redis if available', async () => {
      mockRedisClient.isOpen = true;
      (store as any).client = mockRedisClient;
      mockRedisClient.incr.mockResolvedValue(1);

      const v = await store.incrementViolations('key', 30000);
      expect(v).toBe(1);
      expect(mockRedisClient.incr).toHaveBeenCalledWith('key:violations');
      expect(mockRedisClient.expire).toHaveBeenCalled();
    });

    it('should use memory if fallback', async () => {
      (store as any).fallbackToMemory = true;
      (store as any).client = null;

      // Seed memory
      (store as any).memoryStore.set('key', {
        count: 1,
        resetTime: Date.now() + 1000,
        violations: 0,
      });

      const v = await store.incrementViolations('key', 30000);
      expect(v).toBe(1);

      const v2 = await store.incrementViolations('key', 30000);
      expect(v2).toBe(2);
    });
  });

  describe('block/isBlocked', () => {
    it('should block and check via redis', async () => {
      mockRedisClient.isOpen = true;
      (store as any).client = mockRedisClient;

      await store.block('key', 300000);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'key:blocked',
        300,
        '1'
      );

      mockRedisClient.ttl.mockResolvedValue(299);
      const check = await store.isBlocked('key', 300000);
      expect(check.blocked).toBe(true);
      expect(check.retryAfter).toBe(299);
    });

    it('should block and check via memory', async () => {
      (store as any).fallbackToMemory = true;
      (store as any).client = null;

      // Seed memory
      (store as any).memoryStore.set('key', {
        count: 1,
        resetTime: Date.now(),
        violations: 5,
      });

      await store.block('key', 1000); // 1 sec block

      const check = await store.isBlocked('key', 1000);
      expect(check.blocked).toBe(true);
    });
  });

  describe('getRemaining', () => {
    it('should calculate remaining', async () => {
      mockRedisClient.isOpen = true;
      (store as any).client = mockRedisClient;
      // increment(key, 0) -> results[2] is count
      mockMulti.exec.mockResolvedValue([0, 0, 5, true]);

      const remaining = await store.getRemaining('key', 100);
      expect(remaining).toBe(100 - 5 + 1); // 96
    });
  });
});
