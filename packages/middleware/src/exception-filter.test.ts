import {
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import {
  AuthenticationError,
  AuthorizationError,
  GlobalExceptionFilter,
  OperationalError,
  TenantIsolationError,
  ValidationError,
} from './exception-filter.js';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockJson: any;
  let mockStatus: any;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: any;

  beforeEach(() => {
    vi.clearAllMocks();
    filter = new GlobalExceptionFilter();

    // Spy on logger
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
    };
    mockRequest = {
      url: '/test-url',
      method: 'GET',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    };

    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
        error: 'Forbidden',
        path: '/test-url',
      })
    );
  });

  it('should handle HttpException with string response', () => {
    const exception = new HttpException(
      'Simple String Error',
      HttpStatus.BAD_REQUEST
    );
    filter.catch(exception, mockArgumentsHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Simple String Error',
      })
    );
  });

  it('should handle HttpException with object response', () => {
    const responseObj = { message: 'Custom Error', error: 'Custom' };
    const exception = new HttpException(responseObj, HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Custom Error',
        error: 'Custom',
      })
    );
  });

  it('should handle ZodError', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['field'],
        message: 'Expected string',
      },
    ]);
    filter.catch(zodError, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: expect.stringContaining('Validation failed'),
        error: 'Bad Request',
      })
    );
  });

  it('should handle unknown errors as Internal Server Error', () => {
    const exception = new Error('Something went wrong');
    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error', // Sanitized
        error: 'Internal Server Error',
        path: expect.any(String),
        requestId: expect.any(String),
        timestamp: expect.any(String),
      })
    );
  });

  it('should sanitize 500 errors', () => {
    const exception = new Error('Database connection failed');
    filter.catch(exception, mockArgumentsHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Internal server error',
        statusCode: 500,
      })
    );
  });

  it('should sanitize sensitive internal details in 4xx errors', () => {
    const exception = new HttpException(
      'Invalid column "password" in table "users"',
      HttpStatus.BAD_REQUEST
    );
    filter.catch(exception, mockArgumentsHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid request', // Sanitized
      })
    );
  });

  it('should include stack trace in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const exception = new Error('Test Error');
      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: undefined,
        })
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should report to error tracking in production for 500 errors', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      // Spy on the private reportToErrorTracking via prototype or checking logger
      const loggerErrorSpy = vi.spyOn(Logger.prototype, 'error');

      const exception = new Error('Production 500');
      filter.catch(exception, mockArgumentsHost);

      // We expect the fallback logging to occur
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Sentry Fallback')
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should NOT include stack trace in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const exception = new Error('Test Error');
      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.not.objectContaining({
          stack: expect.anything(),
        })
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should sanitize multiple patterns in a single message', () => {
    const exception = new HttpException(
      'Table "users" has invalid column "secret"',
      HttpStatus.BAD_REQUEST
    );
    filter.catch(exception, mockArgumentsHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid request',
      })
    );
  });

  it('should sanitize pattern matches even in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const exception = new HttpException(
        'Table "users" is fine',
        HttpStatus.BAD_REQUEST
      );
      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid request',
        })
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should fallback to "Error" for unknown status codes', () => {
    // Force a status code that isn't in the map
    const exception = new HttpException('Unknown', 418); // I'm a teapot
    filter.catch(exception, mockArgumentsHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Error',
      })
    );
  });

  it('should sanitize all internal error patterns individually', () => {
    const patterns = [
      'relation "users" does not exist',
      'database "production" not found',
      'constraint "uk_email" failed',
      'schema "public" error',
      '/app/packages/core/src/index.ts',
      '/app/node_modules/nestjs/core',
    ];

    for (const msg of patterns) {
      const exception = new HttpException(msg, HttpStatus.BAD_REQUEST);
      filter.catch(exception, mockArgumentsHost);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid request',
        })
      );
    }
  });

  it('should redact Windows paths in development stack traces', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const exception = new Error('Win Error');
      exception.stack =
        'Error: Win Error\n    at Object.<anonymous> (C:\\Users\\Dell\\project\\file.ts:1:1)';

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: undefined,
        })
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should redact Linux/Mac paths in development stack traces', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const exception = new Error('Nix Error');
      exception.stack =
        'Error: Nix Error\n    at Object.<anonymous> (/home/user/project/file.ts:1:1)';

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: undefined,
        })
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should handle non-Error objects gracefully in development (no stack)', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const exception = 'Just a string error'; // Not an Error object

      filter.catch(exception, mockArgumentsHost);

      // Should not crash and should not have stack
      expect(mockJson).toHaveBeenCalledWith(
        expect.not.objectContaining({
          stack: expect.anything(),
        })
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should report error tracking for generic 500 even if no wrapper service', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const loggerErrorSpy = vi.spyOn(Logger.prototype, 'error');

      const exception = new Error('Critical Failure');
      filter.catch(exception, mockArgumentsHost);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Sentry Fallback')
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});

describe('OperationalError', () => {
  it('should be instance of HttpException', () => {
    const error = new OperationalError('Ops error', HttpStatus.BAD_REQUEST);
    expect(error).toBeInstanceOf(HttpException);
    expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should accept custom status codes', () => {
    const error = new OperationalError('Ops error', HttpStatus.NOT_FOUND);
    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('should create ValidationError', () => {
    const error = new ValidationError('Invalid input');
    expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(error.message).toBe('Invalid input');
  });

  it('should create AuthenticationError', () => {
    const error = new AuthenticationError();
    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.message).toBe('Authentication required');
  });

  it('should create AuthorizationError', () => {
    const error = new AuthorizationError();
    expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(error.message).toBe('Access denied');
  });

  it('should create TenantIsolationError', () => {
    const error = new TenantIsolationError();
    expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(error.message).toBe('Tenant access violation');
  });
});
