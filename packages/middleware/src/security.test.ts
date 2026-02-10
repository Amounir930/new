import { ExecutionContext } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CsrfGuard,
  CsrfProtection,
  SecurityHeadersMiddleware,
  defaultCorsConfig,
  getTenantCorsConfig,
} from './security.js';

describe('SecurityMiddleware', () => {
  let middleware: SecurityHeadersMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    middleware = new SecurityHeadersMiddleware();
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    nextFunction = vi.fn() as unknown as NextFunction;
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should set basic security headers', () => {
    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-DNS-Prefetch-Control',
      'off'
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Frame-Options',
      'DENY'
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff'
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'strict-origin-when-cross-origin'
    );
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should set HSTS header', () => {
    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.stringContaining('max-age=31536000')
    );
  });

  it('should remove X-Powered-By header', () => {
    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );
    expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
  });

  it('should set CSP headers if configured', () => {
    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining("default-src 'self'")
    );
  });
});

describe('CORS Configuration', () => {
  describe('defaultCorsConfig.origin', () => {
    const originFn = defaultCorsConfig.origin as (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => void;

    it('should allow requests with no origin', () => {
      const callback = vi.fn();
      originFn(undefined, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow whitelisted dev origins', () => {
      const callback = vi.fn();
      originFn('http://localhost:3000', callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow origins from ALLOWED_ORIGINS env', () => {
      const originalEnv = process.env.ALLOWED_ORIGINS;
      process.env.ALLOWED_ORIGINS = 'https://myapp.com,https://api.myapp.com';
      const callback = vi.fn();
      originFn('https://myapp.com', callback);
      expect(callback).toHaveBeenCalledWith(null, true);
      process.env.ALLOWED_ORIGINS = originalEnv;
    });

    it('should block non-whitelisted origins', () => {
      const callback = vi.fn();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
      originFn('http://evil.com', callback);
      expect(callback).toHaveBeenCalledWith(expect.any(Error));
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getTenantCorsConfig', () => {
    it('should generate tenant specific CORS config', () => {
      const config = getTenantCorsConfig('https://tenant1.com');
      expect(config.origin).toContain('https://tenant1.com');
      expect(config.origin).toContain('admin.https://tenant1.com');
    });

    it('should include dev origins in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const config = getTenantCorsConfig('https://tenant1.com');
      expect(config.origin as string[]).toContain('http://localhost:3000');
      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('CsrfProtection', () => {
  let csrf: CsrfProtection;

  beforeEach(() => {
    csrf = new CsrfProtection();
  });

  it('should generate a 64-char hex token', () => {
    const token = csrf.generateToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it('should set XSRF-TOKEN cookie', () => {
    const mockRes = { cookie: vi.fn() } as unknown as Response;
    csrf.setCookie(mockRes, 'test-token');
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'XSRF-TOKEN',
      'test-token',
      expect.any(Object)
    );
  });

  it('should validate matching tokens', () => {
    const mockReq = {
      cookies: { 'XSRF-TOKEN': 'match' },
      headers: { 'x-xsrf-token': 'match' },
    } as unknown as Request;
    expect(csrf.validate(mockReq)).toBe(true);
  });

  it('should reject non-matching tokens', () => {
    const mockReq = {
      cookies: { 'XSRF-TOKEN': 'match' },
      headers: { 'x-xsrf-token': 'mismatch' },
    } as unknown as Request;
    expect(csrf.validate(mockReq)).toBe(false);
  });

  it('should reject missing tokens', () => {
    const mockReq = {
      cookies: {},
      headers: {},
    } as unknown as Request;
    expect(csrf.validate(mockReq)).toBe(false);
  });

  it('should reject missing cookie token', () => {
    const mockReq = {
      cookies: {},
      headers: { 'x-xsrf-token': 'token' },
    } as unknown as Request;
    expect(csrf.validate(mockReq)).toBe(false);
  });

  it('should reject missing header token', () => {
    const mockReq = {
      cookies: { 'XSRF-TOKEN': 'token' },
      headers: {},
    } as unknown as Request;
    expect(csrf.validate(mockReq)).toBe(false);
  });
});

describe('CsrfGuard', () => {
  let guard: CsrfGuard;

  beforeEach(() => {
    guard = new CsrfGuard();
  });

  it('should allow GET requests and set cookie', () => {
    const mockReq = { method: 'GET' };
    const mockRes = { cookie: vi.fn() };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
        getResponse: () => mockRes,
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
    expect(mockRes.cookie).toHaveBeenCalled();
  });

  it('should validate POST requests', () => {
    const mockReq = {
      method: 'POST',
      cookies: { 'XSRF-TOKEN': 'valid' },
      headers: { 'x-xsrf-token': 'valid' },
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
