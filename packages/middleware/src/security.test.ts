import {
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  mock,
  spyOn,
} from 'bun:test';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

// REQUIRE: Mocks must be registered before the module under test is imported
mock.module('@apex/config', () => ({
  env: {
    NODE_ENV: 'test',
    ALLOWED_ORIGINS: 'https://myapp.com,https://api.myapp.com',
    APP_ROOT_DOMAIN: 'apex.localhost',
  },
}));

import { type Mocked, MockFactory } from '@apex/test-utils';

const {
  CsrfGuard,
  CsrfProtection,
  defaultCorsConfig,
  getTenantCorsConfig,
  SecurityHeadersMiddleware,
} = await import('./security');

type ISecurityHeadersMiddleware = InstanceType<
  typeof SecurityHeadersMiddleware
>;
type ICsrfProtection = InstanceType<typeof CsrfProtection>;
type ICsrfGuard = InstanceType<typeof CsrfGuard>;

describe('SecurityMiddleware', () => {
  let middleware: ISecurityHeadersMiddleware;
  let mockRequest: Mocked<Request>;
  let mockResponse: Mocked<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    middleware = new SecurityHeadersMiddleware();
    mockRequest = MockFactory.createRequest();
    mockResponse = MockFactory.createResponse();
    nextFunction = mock(() => {}) as NextFunction;
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should set basic security headers', () => {
    middleware.use(mockRequest, mockResponse, nextFunction);

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
    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.stringContaining('max-age=31536000')
    );
  });

  it('should remove X-Powered-By header', () => {
    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
  });

  it('should set CSP headers if configured', () => {
    middleware.use(mockRequest, mockResponse, nextFunction);
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
      const callback = mock();
      originFn(undefined, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow whitelisted dev origins', () => {
      const callback = mock();
      originFn('http://localhost:3000', callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow origins from ALLOWED_ORIGINS env', () => {
      // NOTE: originFn uses config.env.ALLOWED_ORIGINS which we mocked at the top
      const callback = mock();
      originFn('https://myapp.com', callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should block non-whitelisted origins', () => {
      const callback = mock();
      const loggerSpy = spyOn(Logger, 'warn').mockImplementation(() => {});
      originFn('http://evil.com', callback);
      expect(callback).toHaveBeenCalledWith(expect.any(Error));
      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });
  });
});

describe('getTenantCorsConfig', () => {
  it('should generate tenant specific CORS config', () => {
    const config = getTenantCorsConfig('https://tenant1.com');
    expect(config.origin).toContain('https://tenant1.com');
    expect(config.origin).toContain('admin.https://tenant1.com');
  });

  it('should include tenant domain in origin', () => {
    const config = getTenantCorsConfig('https://tenant1.com');
    expect(config.origin).toContain('https://tenant1.com');
  });
});

describe('CsrfProtection', () => {
  let csrf: ICsrfProtection;

  beforeEach(() => {
    csrf = new CsrfProtection();
  });

  it('should generate a 64-char hex token', () => {
    const token = csrf.generateToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it('should set XSRF_TK cookie', () => {
    const mockRes = MockFactory.createResponse();
    csrf.setCookie(mockRes, 'test-token');
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'XSRF_TK',
      'test-token',
      expect.any(Object)
    );
  });

  it('should validate matching tokens', () => {
    const mockReq = MockFactory.createRequest({
      cookies: { XSRF_TK: 'match' },
      headers: { 'x-xsrf-tk': 'match' },
    });
    expect(csrf.validate(mockReq)).toBe(true);
  });

  it('should reject non-matching tokens', () => {
    const mockReq = MockFactory.createRequest({
      cookies: { XSRF_TK: 'match' },
      headers: { 'x-xsrf-tk': 'mismatch' },
    });
    expect(csrf.validate(mockReq)).toBe(false);
  });

  it('should reject missing tokens', () => {
    const mockReq = MockFactory.createRequest();
    expect(csrf.validate(mockReq)).toBe(false);
  });

  it('should reject missing cookie token', () => {
    const mockReq = MockFactory.createRequest({
      headers: { 'x-xsrf-tk': 'token' },
    });
    expect(csrf.validate(mockReq)).toBe(false);
  });

  it('should reject missing header token', () => {
    const mockReq = MockFactory.createRequest({
      cookies: { XSRF_TK: 'token' },
    });
    expect(csrf.validate(mockReq)).toBe(false);
  });
});

describe('CsrfGuard', () => {
  let guard: ICsrfGuard;

  beforeEach(() => {
    guard = new CsrfGuard();
  });

  // Type guard for Request to Record<string, unknown>
  const isRecord = (obj: unknown): obj is Record<string, unknown> =>
    typeof obj === 'object' && obj !== null;

  it('should allow GET requests and set cookie', () => {
    const mockReq = MockFactory.createRequest({ method: 'GET' });
    const mockRes = MockFactory.createResponse();
    const mockContext = MockFactory.createExecutionContext(
      isRecord(mockReq) ? mockReq : ({} as Record<string, unknown>)
    );
    (
      mockContext.switchToHttp().getResponse as Mock<() => Response>
    ).mockReturnValue(mockRes);

    expect(guard.canActivate(mockContext)).toBe(true);
    expect(mockRes.cookie).toHaveBeenCalled();
  });

  it('should validate POST requests', () => {
    const mockReq = MockFactory.createRequest({
      method: 'POST',
      cookies: { XSRF_TK: 'valid' },
      headers: { 'x-xsrf-tk': 'valid' },
    });
    const mockContext = MockFactory.createExecutionContext(
      isRecord(mockReq) ? mockReq : ({} as Record<string, unknown>)
    );

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
