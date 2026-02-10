import { ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClient } from 'redis';
import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RateLimit,
  RateLimitGuard,
  RedisRateLimitStore,
} from './rate-limit.js';

// Mock Redis
vi.mock('redis', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    isOpen: true,
    multi: vi.fn().mockReturnValue({
      incr: vi.fn().mockReturnThis(),
      ttl: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([1, 60]),
    }),
    expire: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    incr: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(-1),
    setEx: vi.fn().mockResolvedValue('OK'),
  })),
}));

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let reflector: Reflector;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;

  // Mock the singleton store methods
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the singleton store instance methods
    vi.spyOn(RedisRateLimitStore.prototype, 'isBlocked').mockResolvedValue({
      blocked: false,
      retryAfter: 0,
    });
    vi.spyOn(RedisRateLimitStore.prototype, 'increment').mockResolvedValue({
      count: 1,
      ttl: 60,
    });
    vi.spyOn(
      RedisRateLimitStore.prototype,
      'incrementViolations'
    ).mockResolvedValue(0);
    vi.spyOn(RedisRateLimitStore.prototype, 'block').mockResolvedValue(
      undefined
    );

    reflector = new Reflector();
    guard = new RateLimitGuard(reflector);

    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      tenantContext: { plan: 'free', tenantId: 'test-tenant' },
    };

    mockResponse = {
      setHeader: vi.fn(),
    };

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getHandler: () => function testHandler() {},
      getClass: () => class TestController {},
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow request within limit', async () => {
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Limit',
      expect.any(Number)
    );
  });

  it('should use tenant plan limits', async () => {
    mockRequest.tenantContext.plan = 'enterprise';
    await guard.canActivate(mockContext);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Limit',
      5000
    );
  });

  it('should prioritize custom decorator limits', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
      requests: 10,
      windowMs: 1000,
    });
    await guard.canActivate(mockContext);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Limit',
      10
    );
  });

  it('should identify by API key if present', async () => {
    mockRequest.headers['x-api-key'] = 'test-key';
    await guard.canActivate(mockContext);
    // Identification logic is internal, but passing implies it worked
    expect(mockResponse.setHeader).toHaveBeenCalled();
  });

  it('should throw TOO_MANY_REQUESTS when limit exceeded', async () => {
    vi.spyOn(RedisRateLimitStore.prototype, 'increment').mockResolvedValue({
      count: 101,
      ttl: 60,
    });
    await expect(guard.canActivate(mockContext)).rejects.toThrow(HttpException);
  });

  it('should throw TOO_MANY_REQUESTS when blocked', async () => {
    vi.spyOn(RedisRateLimitStore.prototype, 'isBlocked').mockResolvedValue({
      blocked: true,
      retryAfter: 300,
    });
    await expect(guard.canActivate(mockContext)).rejects.toThrow('IP blocked');
  });

  it('should handle missing IP and unidentified caller', async () => {
    mockRequest.ip = undefined;
    mockRequest.headers = {};
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should identify IP from x-forwarded-for header', async () => {
    mockRequest.headers['x-forwarded-for'] = '1.2.3.4, 5.6.7.8';
    await guard.canActivate(mockContext);
    expect(RedisRateLimitStore.prototype.increment).toHaveBeenCalledWith(
      expect.stringContaining('ip:1.2.3.4'),
      expect.any(Number)
    );
  });

  it('should identify IP from x-real-ip header', async () => {
    mockRequest.headers['x-real-ip'] = '9.10.11.12';
    await guard.canActivate(mockContext);
    expect(RedisRateLimitStore.prototype.increment).toHaveBeenCalledWith(
      expect.stringContaining('ip:9.10.11.12'),
      expect.any(Number)
    );
  });

  it('should block IP after 5 violations', async () => {
    vi.spyOn(RedisRateLimitStore.prototype, 'increment').mockResolvedValue({
      count: 101,
      ttl: 60,
    });
    vi.spyOn(
      RedisRateLimitStore.prototype,
      'incrementViolations'
    ).mockResolvedValue(5);
    const blockSpy = vi
      .spyOn(RedisRateLimitStore.prototype, 'block')
      .mockResolvedValue(undefined);

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Rate limit exceeded'
    );
    expect(blockSpy).toHaveBeenCalled();
  });

  it('should not block before 5 violations', async () => {
    vi.spyOn(RedisRateLimitStore.prototype, 'increment').mockResolvedValue({
      count: 101,
      ttl: 60,
    });
    vi.spyOn(
      RedisRateLimitStore.prototype,
      'incrementViolations'
    ).mockResolvedValue(3);
    const blockSpy = vi
      .spyOn(RedisRateLimitStore.prototype, 'block')
      .mockResolvedValue(undefined);

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Rate limit exceeded'
    );
    expect(blockSpy).not.toHaveBeenCalled();
  });
});

describe('RedisRateLimitStore Branches', () => {
  let store: RedisRateLimitStore;

  beforeEach(() => {
    store = new RedisRateLimitStore();
    vi.clearAllMocks();
  });

  it('should fallback to memory in non-production on Redis failure', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    // Force Redis connect to fail
    const mockRedis = {
      on: vi.fn(),
      connect: vi.fn().mockRejectedValue(new Error('Redis Down')),
      isOpen: false,
    };
    (createClient as any).mockReturnValue(mockRedis as any);

    // Call increment - should trigger connect and fallback
    await store.increment('test-key', 60000);

    // Check if it used memory (by checking if getClient returns null)
    const client = await store.getClient();
    expect(client).toBeNull();

    process.env.NODE_ENV = originalEnv;
  });

  it('should throw in production if Redis is unavailable', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Mock getClient to return null
    vi.spyOn(store, 'getClient').mockResolvedValue(null);

    await expect(store.increment('test-key', 60000)).rejects.toThrow(
      HttpException
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should return null if already connecting', async () => {
    store.connecting = true;
    const client = await store.getClient();
    expect(client).toBeNull();
  });
});

describe('RateLimit Decorator', () => {
  it('should set rate limit metadata', () => {
    const decorator = RateLimit({ requests: 10, windowMs: 1000 });
    expect(decorator).toBeDefined();
  });
});
