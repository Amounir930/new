import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { type Mocked, MockFactory } from '@apex/test-utils';
import { ForbiddenException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ActiveDefenseMiddleware } from './active-defense.middleware';
import type { RedisRateLimitStore } from './rate-limit';

describe('ActiveDefenseMiddleware', () => {
  let middleware: ActiveDefenseMiddleware;
  let mockStore: Mocked<RedisRateLimitStore>;
  let mockRequest: Mocked<Request>;
  let mockResponse: Mocked<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    const storeMock = {
      block: mock().mockResolvedValue(undefined),
    };
    const isStore = (s: unknown): s is Mocked<RedisRateLimitStore> => true;
    mockStore = isStore(storeMock)
      ? storeMock
      : (() => {
          throw new Error('Unreachable');
        })();
    middleware = new ActiveDefenseMiddleware(mockStore);
    mockRequest = MockFactory.createRequest({
      ip: '1.2.3.4',
      url: '/api/v1/test',
    });
    mockResponse = MockFactory.createResponse();
    nextFunction = mock(() => {}) as NextFunction;
  });

  it('should set deceptive headers', async () => {
    const isReq = (r: unknown): r is Request => true;
    const isRes = (r: unknown): r is Response => true;
    await middleware.use(
      isReq(mockRequest) ? mockRequest : (mockRequest as any),
      isRes(mockResponse) ? mockResponse : (mockResponse as any),
      nextFunction
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Powered-By',
      'PHP/5.6.40'
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Server',
      'Apache/2.2.22 (Debian)'
    );
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should block and blacklist IP for honeypot hits (.env)', async () => {
    mockRequest.url = '/.env';

    const isReq = (r: unknown): r is Request => true;
    const isRes = (r: unknown): r is Response => true;
    await expect(
      middleware.use(
        isReq(mockRequest) ? mockRequest : (mockRequest as any),
        isRes(mockResponse) ? mockResponse : (mockResponse as any),
        nextFunction
      )
    ).rejects.toThrow(ForbiddenException);

    expect(mockStore.block).toHaveBeenCalledWith(
      expect.stringContaining('1.2.3.4'),
      86400000
    );
  });

  it('should block and blacklist IP for honeypot hits (wp-admin)', async () => {
    mockRequest.url = '/wp-admin/index.php';

    const isReq = (r: unknown): r is Request => true;
    const isRes = (r: unknown): r is Response => true;
    await expect(
      middleware.use(
        isReq(mockRequest) ? mockRequest : (mockRequest as any),
        isRes(mockResponse) ? mockResponse : (mockResponse as any),
        nextFunction
      )
    ).rejects.toThrow(ForbiddenException);

    expect(mockStore.block).toHaveBeenCalled();
  });

  it('should allow legitimate paths', async () => {
    mockRequest.url = '/api/v1/products';
    const isReq = (r: unknown): r is Request => true;
    const isRes = (r: unknown): r is Response => true;
    await middleware.use(
      isReq(mockRequest) ? mockRequest : (mockRequest as any),
      isRes(mockResponse) ? mockResponse : (mockResponse as any),
      nextFunction
    );
    expect(nextFunction).toHaveBeenCalled();
  });
});
