import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { type Mocked, MockFactory } from '@apex/test-utils';
import { ForbiddenException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { BotProtectionMiddleware } from './bot-protection';
import type { HCaptchaService } from './hcaptcha.service';

describe('BotProtectionMiddleware', () => {
  let middleware: BotProtectionMiddleware;
  let mockRequest: Mocked<Request>;
  let mockResponse: Mocked<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    const captchaMock = {
      verify: mock().mockResolvedValue(true),
    };
    const isCaptcha = (s: unknown): s is Mocked<HCaptchaService> => true;
    const mockCaptchaService = isCaptcha(captchaMock)
      ? captchaMock
      : (() => {
          throw new Error('Unreachable');
        })();
    middleware = new BotProtectionMiddleware(mockCaptchaService);
    mockRequest = MockFactory.createRequest({
      headers: {},
      url: '/api/v1/test',
      ip: '1.1.1.1',
    });
    mockResponse = MockFactory.createResponse();
    nextFunction = mock(() => {}) as NextFunction;
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should block requests without User-Agent', async () => {
    mockRequest.headers = {};
    await expect(
      middleware.use(mockRequest, mockResponse, nextFunction)
    ).rejects.toThrow(ForbiddenException);
    await expect(
      middleware.use(mockRequest, mockResponse, nextFunction)
    ).rejects.toThrow('S11 Violation: User-Agent header required');
  });

  it('should block known bot User-Agents (curl)', async () => {
    mockRequest.headers = { 'user-agent': 'curl/7.68.0' };
    await expect(
      middleware.use(mockRequest, mockResponse, nextFunction)
    ).rejects.toThrow(ForbiddenException);
    await expect(
      middleware.use(mockRequest, mockResponse, nextFunction)
    ).rejects.toThrow('S11 Violation: Automated access blocked');
  });

  it('should block known bot User-Agents (python-requests)', async () => {
    mockRequest.headers = { 'user-agent': 'python-requests/2.25.1' };
    await expect(
      middleware.use(mockRequest, mockResponse, nextFunction)
    ).rejects.toThrow(ForbiddenException);
  });

  it('should block suspicious paths (.env)', async () => {
    mockRequest.headers = {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    };
    mockRequest.url = '/.env';
    await expect(
      middleware.use(mockRequest, mockResponse, nextFunction)
    ).rejects.toThrow(ForbiddenException);
    await expect(
      middleware.use(mockRequest, mockResponse, nextFunction)
    ).rejects.toThrow('S11 Violation: Security violation detected');
  });

  it('should allow legitimate browser User-Agents', async () => {
    mockRequest.headers = {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    await middleware.use(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should skip check for health endpoints', async () => {
    mockRequest.headers = { 'user-agent': 'curl/7.68.0' }; // Blocked usually
    mockRequest.url = '/api/v1/health/liveness';
    await middleware.use(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });
});
