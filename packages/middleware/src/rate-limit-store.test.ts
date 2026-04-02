import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  mock,
} from 'bun:test';
import type { ConfigService } from '@apex/config/server';
import { type Mocked, MockFactory } from '@apex/test-utils';
import { createClient, type RedisClientType } from 'redis';
import { RedisRateLimitStore } from './redis-rate-limit-store';

// Mock redis
mock.module('redis', () => ({
  createClient: mock(),
}));

describe('RedisRateLimitStore', () => {
  let store: RedisRateLimitStore;
  let mockRedisClient: Mocked<Record<string, unknown>>;
  let mockMulti: Mocked<Record<string, unknown>>;

  // No asPrivate helper needed, use @ts-expect-error

  beforeEach(() => {
    mock.restore();

    // Setup redis mock
    const multiMock = {
      incr: mock().mockReturnThis(),
      ttl: mock().mockReturnThis(),
      zRemRangeByScore: mock().mockReturnThis(),
      zAdd: mock().mockReturnThis(),
      zCard: mock().mockReturnThis(),
      pExpire: mock().mockReturnThis(),
      exec: mock().mockResolvedValue([0, 0, 1, true]), // results[2] is zCard count
    };
    const isMulti = (m: unknown): m is Mocked<Record<string, unknown>> => true;
    mockMulti = isMulti(multiMock)
      ? multiMock
      : (() => {
          throw new Error('Unreachable');
        })();

    const redisMock = {
      connect: mock().mockResolvedValue(undefined),
      on: mock(),
      isOpen: false,
      multi: mock().mockReturnValue(mockMulti),
      expire: mock(),
      get: mock(),
      setEx: mock(),
      incr: mock(),
      ttl: mock(),
    };
    const isRedis = (r: unknown): r is Mocked<Record<string, unknown>> => true;
    mockRedisClient = isRedis(redisMock)
      ? redisMock
      : (() => {
          throw new Error('Unreachable');
        })();

    // createClient is mocked by mock.module, so it's a mock function
    const isMock = (f: unknown): f is Mock<() => unknown> => true;
    if (isMock(createClient)) {
      createClient.mockReturnValue(mockRedisClient);
    }

    const mockConfigService = MockFactory.createConfigService();
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV')
        // @ts-expect-error - accessing private member
        return store._mockNodeEnv || 'development';
      if (key === 'REDIS_URL') return 'redis://localhost:6379';
      return null;
    });

    const isConfig = (c: unknown): c is ConfigService => true;
    store = new RedisRateLimitStore(
      isConfig(mockConfigService)
        ? mockConfigService
        : (() => {
            throw new Error('Unreachable');
          })()
    );
    // @ts-expect-error - accessing private member
    store._mockNodeEnv = 'development';
  });

  afterEach(() => {
    mock.restore();
  });

  it('should be defined', () => {
    expect(store).toBeDefined();
  });

  describe('connect', () => {
    it('should connect to redis', async () => {
      // @ts-expect-error - accessing private member
      await store.connect();
      expect(createClient).toHaveBeenCalled();
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should handle connection error and fallback to memory in development', async () => {
      // @ts-expect-error - accessing private member
      store._mockNodeEnv = 'development';
      (mockRedisClient.connect as Mock<any>).mockRejectedValue(
        new Error('Connection failed')
      );
      // @ts-expect-error - accessing private member
      await store.connect();

      // Should set fallbackToMemory to true
      // Note: We should probably mock ConfigService to return 'development' here
      // if it checks it dynamically.
      // @ts-expect-error - accessing private member
      expect(store.fallbackToMemory).toBe(true);
    });

    it('should handle connection error and NOT fallback in production', async () => {
      // @ts-expect-error - accessing private member
      store._mockNodeEnv = 'production';
      (mockRedisClient.connect as Mock<any>).mockRejectedValue(
        new Error('Connection failed')
      );
      // @ts-expect-error - accessing private member
      await store.connect();

      // Should set fallbackToMemory to false (strict)
      // The implementation checks process.env['NODE_ENV'] in the constructor
      // @ts-expect-error - accessing private member
      expect(store.fallbackToMemory).toBe(false);
    });
  });

  describe('increment', () => {
    it('should use redis if available', async () => {
      mockRedisClient.isOpen = true;
      const isRedisClient = (c: unknown): c is RedisClientType => true;
      // @ts-expect-error - accessing private member
      store.client = isRedisClient(mockRedisClient)
        ? mockRedisClient
        : (() => {
            throw new Error('Unreachable');
          })();

      const res = await store.increment('key', 60000);

      expect(mockMulti.zAdd).toHaveBeenCalled();
      expect(mockMulti.zCard).toHaveBeenCalled();
      expect(mockMulti.exec).toHaveBeenCalled();
      expect(res).toEqual({ count: 1, ttl: 60 });
    });

    it('should use memory if fallback is active', async () => {
      // @ts-expect-error - accessing private member
      store.fallbackToMemory = true;
      // @ts-expect-error - accessing private member
      store.client = null;

      const res1 = await store.increment('key', 60000);
      expect(res1.count).toBe(1);

      const res2 = await store.increment('key', 60000);
      expect(res2.count).toBe(2);
    });

    it('should throw in production if redis unavailable', async () => {
      // @ts-expect-error - accessing private member
      store._mockNodeEnv = 'production';
      // @ts-expect-error - accessing private member
      store.fallbackToMemory = false;
      // @ts-expect-error - accessing private member
      store.client = null;

      await expect(store.increment('key', 60000)).rejects.toThrow(
        'Rate limiting service unavailable'
      );
    });
  });

  describe('getViolations', () => {
    it('should get from redis if available', async () => {
      mockRedisClient.isOpen = true;
      // @ts-expect-error - accessing private member
      store.client = mockRedisClient as unknown as RedisClientType;
      (mockRedisClient.get as Mock<any>).mockResolvedValue('5');

      const violations = await store.getViolations('key');
      expect(violations).toBe(5);
      expect(mockRedisClient.get).toHaveBeenCalledWith('key:violations');
    });

    it('should get from memory if fallback', async () => {
      // @ts-expect-error - accessing private member
      store.fallbackToMemory = true;
      // @ts-expect-error - accessing private member
      store.client = null;

      // Seed memory
      // @ts-expect-error - accessing private member
      store.memoryStore.set('key', {
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
      // @ts-expect-error - accessing private member
      store.client = mockRedisClient as unknown as RedisClientType;
      (mockRedisClient.incr as Mock<any>).mockResolvedValue(1);

      const v = await store.incrementViolations('key', 30000);
      expect(v).toBe(1);
      expect(mockRedisClient.incr).toHaveBeenCalledWith('key:violations');
      expect(mockRedisClient.expire).toHaveBeenCalled();
    });

    it('should use memory if fallback', async () => {
      // @ts-expect-error - accessing private member
      store.fallbackToMemory = true;
      // @ts-expect-error - accessing private member
      store.client = null;

      // Seed memory
      // @ts-expect-error - accessing private member
      store.memoryStore.set('key', {
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
      // @ts-expect-error - accessing private member
      store.client = mockRedisClient as unknown as RedisClientType;

      await store.block('key', 300000);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'key:blocked',
        300,
        '1'
      );

      (mockRedisClient.ttl as Mock<any>).mockResolvedValue(299);
      const check = await store.isBlocked('key', 300000);
      expect(check.blocked).toBe(true);
      expect(check.retryAfter).toBe(299);
    });

    it('should block and check via memory', async () => {
      // @ts-expect-error - accessing private member
      store.fallbackToMemory = true;
      // @ts-expect-error - accessing private member
      store.client = null;

      // Seed memory
      // @ts-expect-error - accessing private member
      store.memoryStore.set('key', {
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
      // @ts-expect-error - accessing private member
      store.client = mockRedisClient as unknown as RedisClientType;
      // increment(key, 0) -> results[2] is count
      (mockMulti.exec as Mock<any>).mockResolvedValue([0, 0, 5, true]);

      const remaining = await store.getRemaining('key', 100);
      expect(remaining).toBe(100 - 5 + 1); // 96
    });
  });
});
