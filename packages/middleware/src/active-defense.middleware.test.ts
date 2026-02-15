import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { ForbiddenException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ActiveDefenseMiddleware } from './active-defense.middleware.js';
import type { RedisRateLimitStore } from './rate-limit.js';

describe('ActiveDefenseMiddleware', () => {
  let middleware: ActiveDefenseMiddleware;
  let mockStore: Partial<RedisRateLimitStore>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockStore = {
      block: mock().mockResolvedValue(undefined),
    };
    middleware = new ActiveDefenseMiddleware(mockStore as RedisRateLimitStore);
    mockRequest = {
      ip: '1.2.3.4',
      url: '/api/v1/test',
    };
    mockResponse = {
      setHeader: mock(),
    };
    nextFunction = mock() as unknown as NextFunction;
  });

  it('should set deceptive headers', async () => {
    await middleware.use(
      mockRequest as Request,
      mockResponse as Response,
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

    await expect(
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
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

    await expect(
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      )
    ).rejects.toThrow(ForbiddenException);

    expect(mockStore.block).toHaveBeenCalled();
  });

  it('should allow legitimate paths', async () => {
    mockRequest.url = '/api/v1/products';
    await middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );
    expect(nextFunction).toHaveBeenCalled();
  });
});
