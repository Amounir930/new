import { ForbiddenException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BotProtectionMiddleware } from './bot-protection.js';

describe('BotProtectionMiddleware', () => {
  let middleware: BotProtectionMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    middleware = new BotProtectionMiddleware();
    mockRequest = {
      headers: {},
      url: '/api/v1/test',
    };
    mockResponse = {};
    nextFunction = vi.fn() as unknown as NextFunction;
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should block requests without User-Agent', () => {
    mockRequest.headers = {};
    expect(() =>
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      )
    ).toThrow(ForbiddenException);
    expect(() =>
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      )
    ).toThrow('S11 Violation: User-Agent header required');
  });

  it('should block known bot User-Agents (curl)', () => {
    mockRequest.headers = { 'user-agent': 'curl/7.68.0' };
    expect(() =>
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      )
    ).toThrow(ForbiddenException);
    expect(() =>
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      )
    ).toThrow('S11 Violation: Automated access blocked');
  });

  it('should block known bot User-Agents (python-requests)', () => {
    mockRequest.headers = { 'user-agent': 'python-requests/2.25.1' };
    expect(() =>
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      )
    ).toThrow(ForbiddenException);
  });

  it('should block suspicious paths (.env)', () => {
    mockRequest.headers = {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    };
    mockRequest.url = '/.env';
    expect(() =>
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      )
    ).toThrow(ForbiddenException);
    expect(() =>
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      )
    ).toThrow('S11 Violation: Security violation detected');
  });

  it('should allow legitimate browser User-Agents', () => {
    mockRequest.headers = {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should skip check for health endpoints', () => {
    mockRequest.headers = { 'user-agent': 'curl/7.68.0' }; // Blocked usually
    mockRequest.url = '/api/v1/health/liveness';
    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );
    expect(nextFunction).toHaveBeenCalled();
  });
});
