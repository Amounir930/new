import type { ConfigService } from '@apex/config/server';
import { type ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClient } from 'redis';
import 'reflect-metadata';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from 'bun:test';
import { type Mocked, MockFactory } from '@apex/test-utils';
import type { Request, Response } from 'express';
import { RateLimit, RateLimitGuard, RedisRateLimitStore } from './rate-limit';

// Mock Redis
mock.module('redis', () => ({
  createClient: mock().mockImplementation(() => ({
    on: mock(),
    connect: mock().mockResolvedValue(undefined),
    isOpen: true,
    multi: mock().mockReturnValue({
      zRemRangeByScore: mock().mockReturnThis(),
      zAdd: mock().mockReturnThis(),
      zCard: mock().mockReturnThis(),
      pExpire: mock().mockReturnThis(),
      exec: mock().mockResolvedValue([0, 1, 1, true]),
    }),
    expire: mock().mockResolvedValue(undefined),
    get: mock().mockResolvedValue(null),
    incr: mock().mockResolvedValue(1),
    ttl: mock().mockResolvedValue(-1),
    setEx: mock().mockResolvedValue('OK'),
  })),
}));

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let reflector: Reflector;
  let store: RedisRateLimitStore;
  let configService: Mocked<ConfigService>;
  let mockContext: Mocked<ExecutionContext>;
  let mockRequest: Mocked<Request>;
  let mockResponse: Mocked<Response>;

  beforeEach(() => {
    mock.restore();

    reflector = new Reflector();
    // Mock ConfigService
    configService = {
      get: mock().mockImplementation((key: string): string | undefined => {
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      }),
    } as Mocked<ConfigService>;

    store = new RedisRateLimitStore(configService);

    // Spy on store methods
    spyOn(store, 'isBlocked').mockResolvedValue({
      blocked: false,
      retryAfter: 0,
    });
    spyOn(store, 'increment').mockResolvedValue({
      count: 1,
      ttl: 60,
    });
    spyOn(store, 'incrementViolations').mockResolvedValue(0);
    spyOn(store, 'block').mockResolvedValue(undefined);

    guard = new RateLimitGuard(reflector, store);

    mockRequest = MockFactory.createRequest({
      headers: {} as Record<string, string>,
      ip: '127.0.0.1',
    });
    mockRequest.tenantContext = MockFactory.createTenantContext({
      plan: 'free',
      tenantId: 'test-tenant',
    });

    mockResponse = MockFactory.createResponse();

    const executionContextMock = MockFactory.createExecutionContext(
      mockRequest as unknown as Record<string, unknown>
    );
    mockContext = {
      ...executionContextMock,
      switchToHttp: mock().mockReturnValue({
        getRequest: mock().mockReturnValue(mockRequest),
        getResponse: mock().mockReturnValue(mockResponse),
        getNext: mock(),
      }),
      getHandler: mock().mockReturnValue(function testHandler() {}),
      getClass: mock().mockReturnValue(class TestController {}),
    } as Mocked<ExecutionContext>;
  });

  afterEach(() => {
    mock.restore();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow request within limit', async () => {
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Limit',
      expect.anything()
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
    spyOn(reflector, 'getAllAndOverride').mockReturnValue({
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
    // Identification logic is internal
    expect(mockResponse.setHeader).toHaveBeenCalled();
  });

  it('should throw TOO_MANY_REQUESTS when limit exceeded', async () => {
    spyOn(store, 'increment').mockResolvedValue({
      count: 101,
      ttl: 60,
    });
    await expect(guard.canActivate(mockContext)).rejects.toThrow(HttpException);
  });

  it('should throw TOO_MANY_REQUESTS when blocked', async () => {
    spyOn(store, 'isBlocked').mockResolvedValue({
      blocked: true,
      retryAfter: 300,
    });
    await expect(guard.canActivate(mockContext)).rejects.toThrow('IP blocked');
  });

  it('should handle missing IP and unidentified caller', async () => {
    // @ts-expect-error - testing invalid IP
    mockRequest.ip = undefined;
    mockRequest.headers = {};
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should identify IP from x-forwarded-for header', async () => {
    mockRequest.headers['x-forwarded-for'] = '1.2.3.4, 5.6.7.8';
    await guard.canActivate(mockContext);
    expect(store.increment).toHaveBeenCalledWith(
      expect.stringContaining('ip:1.2.3.4'),
      expect.anything()
    );
  });

  it('should identify IP from x-real-ip header', async () => {
    mockRequest.headers['x-real-ip'] = '9.10.11.12';
    await guard.canActivate(mockContext);
    expect(store.increment).toHaveBeenCalledWith(
      expect.stringContaining('ip:9.10.11.12'),
      expect.anything()
    );
  });

  it('should block IP after 5 violations', async () => {
    spyOn(store, 'increment').mockResolvedValue({
      count: 101,
      ttl: 60,
    });
    spyOn(store, 'incrementViolations').mockResolvedValue(5);
    const blockSpy = spyOn(store, 'block');

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Rate limit exceeded'
    );
    expect(blockSpy).toHaveBeenCalled();
  });

  it('should not block before 5 violations', async () => {
    spyOn(store, 'increment').mockResolvedValue({
      count: 101,
      ttl: 60,
    });
    spyOn(store, 'incrementViolations').mockResolvedValue(3);
    const blockSpy = spyOn(store, 'block');

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Rate limit exceeded'
    );
    expect(blockSpy).not.toHaveBeenCalled();
  });

  it('should trigger immediate DDoS ban if threshold exceeded (5x)', async () => {
    spyOn(store, 'increment').mockResolvedValue({
      count: 501, // 5x the default 100
      ttl: 60,
    });
    const blockSpy = spyOn(store, 'block');

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'DDoS protection triggered'
    );
    expect(blockSpy).toHaveBeenCalledWith(expect.anything(), 3600000); // 1 hour
  });
});

describe('RedisRateLimitStore Branches', () => {
  let store: RedisRateLimitStore;
  let configService: Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: mock().mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return process.env['NODE_ENV'] || 'development';
        return 'redis://localhost:6379';
      }),
    } as Mocked<ConfigService>;
    store = new RedisRateLimitStore(configService);
    mock.restore();
  });

  it('should fallback to memory in non-production on Redis failure', async () => {
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'development';
    // Force Redis connect to fail
    const mockRedis = {
      on: mock(),
      connect: mock().mockRejectedValue(new Error('Redis Down')),
      isOpen: false,
    };
    (createClient as Mock<typeof createClient>).mockReturnValue(
      mockRedis as any
    );

    // Call increment - should trigger connect and fallback
    await store.increment('test-key', 60000);

    // Check if it used memory (by checking if getClient returns null)
    const client = await store.getClient();
    expect(client).toBeNull();

    process.env['NODE_ENV'] = originalEnv;
  });

  it('should throw in production if Redis is unavailable', async () => {
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';

    // Mock getClient to return null
    spyOn(store, 'getClient').mockResolvedValue(null);

    await expect(store.increment('test-key', 60000)).rejects.toThrow(
      HttpException
    );

    process.env['NODE_ENV'] = originalEnv;
  });

  it('should return null if already connecting', async () => {
    // @ts-expect-error - accessing private member
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
