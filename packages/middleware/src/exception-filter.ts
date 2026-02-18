/**
 * S5: Global Exception Filter
 * Constitution Reference: architecture.md (S5 Protocol)
 * Purpose: Standardized error responses, no stack traces to client
 */

import { env } from '@apex/config';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

// S5: Initialize Sentry globally for GlitchTip reporting
// Note: Actual DSN-based init usually happens in main.ts,
// but we keep a secondary check here for safety.
if (env.GLITCHTIP_DSN && process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: env.GLITCHTIP_DSN,
    environment: process.env.NODE_ENV,
  });
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
  // Internal only (not sent to client)
  stack?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = this.generateRequestId();

    // Determine error details
    const { statusCode, message, error } = this.parseError(exception);

    // Log error (with stack trace for internal debugging)
    this.logError(exception, requestId, request, statusCode);

    // Build response (sanitized for client)
    const errorResponse: ErrorResponse = {
      statusCode,
      message: this.sanitizeMessage(statusCode, message),
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    // S5 FIX: Never send stack traces to the client in PRODUCTION.
    // In Development/Staging, we allow it for debugging efficiency.
    if (process.env.NODE_ENV === 'production') {
      errorResponse.stack = undefined;
      // Ensure generic message for 500 errors
      if (statusCode === 500) {
        errorResponse.message = 'Internal server error';
        errorResponse.error = 'Internal Server Error';
      }
    } else {
      // In Non-Production, keep the stack trace (it was set by logError implicitly or can be explicitly added)
      errorResponse.stack = (exception as any).stack;
    }

    response.status(statusCode).json(errorResponse);

    // Report to GlitchTip/Sentry in production
    if (env.NODE_ENV === 'production' && statusCode >= 500) {
      this.reportToErrorTracking(exception, requestId);
    }
  }

  private parseError(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
  } {
    // NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          statusCode: status,
          message: response,
          error: this.getErrorName(status),
        };
      }

      return {
        statusCode: status,
        message: (response as any).message || response,
        error: (response as any).error || this.getErrorName(status),
      };
    }

    // Zod validation errors (S3)
    if (exception instanceof ZodError) {
      const issues = exception.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Validation failed: ${issues}`,
        error: 'Bad Request',
      };
    }

    // ZodValidationException (nestjs-zod) - Loose check
    if ((exception as any)?.constructor?.name === 'ZodValidationException') {
      const issues = (exception as any)
        .getValidationIssues()
        .map((i: any) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Validation failed: ${issues}`,
        error: 'Bad Request',
      };
    }

    // Default: Internal server error
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }

  private sanitizeMessage(
    statusCode: number,
    message: string | string[]
  ): string | string[] {
    // S5 FIX: Never expose internal details for 500 errors
    if (statusCode === 500) {
      return 'Internal server error';
    }

    // S5: In Development/Staging, favor transparency over sanitization
    if (process.env.NODE_ENV !== 'production') {
      return message;
    }

    // S5: In production, sanitize 4xx errors but preserve validation details
    // For validation errors (400), show the message to help with debugging
    if (statusCode === 400) {
      // If it's a validation error string, preserve it
      if (typeof message === 'string') {
        if (
          message.startsWith('Validation failed:') ||
          message.includes('must be')
        ) {
          return message;
        }
      } else if (Array.isArray(message)) {
        // If it's an array of validation errors, preserve it
        return message;
      }
    }

    // All other 4xx errors get generic message in production
    return 'Request failed';
  }

  private getErrorName(status: number): string {
    const names: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };
    return names[status] || 'Error';
  }

  private logError(
    exception: unknown,
    requestId: string,
    request: Request,
    statusCode: number
  ): void {
    const error =
      exception instanceof Error ? exception : new Error(String(exception));
    const { message, stack: errorStackTrace } = error;

    const isNotFound = statusCode === 404;
    const isBot = /bot|crawler|spider/i.test(
      request.headers?.['user-agent'] || ''
    );

    if (isNotFound) {
      this.logger.debug(
        {
          requestId,
          message,
          path: request.url,
          method: request.method,
          ip: request.ip,
          userAgent: request.headers?.['user-agent'],
          isBot,
        },
        'S11: Resource not found'
      );
      return;
    }

    this.logger.error(
      {
        requestId,
        message,
        stackTrace: errorStackTrace,
        path: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: request.headers?.['user-agent'],
      },
      'Exception caught'
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private reportToErrorTracking(exception: unknown, requestId: string): void {
    if (env.GLITCHTIP_DSN && env.NODE_ENV === 'production') {
      Sentry.captureException(exception, {
        tags: {
          requestId,
        },
      });
    } else {
      // Fallback: Log to console if no specific error tracking service is configured
      // This ensures production errors are at least visible in logs
      this.logger.error(
        `[Sentry Fallback ${requestId}]: Error reported to tracking (simulation)`
      );
    }
  }
}

/**
 * Operational vs Programming Errors
 * Operational: Expected errors (validation, auth, etc.) - 4xx
 * Programming: Bugs (null reference, etc.) - 5xx
 */
export class OperationalError extends HttpException {}

export class ValidationError extends OperationalError {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class AuthenticationError extends OperationalError {
  constructor(message = 'Authentication required') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class AuthorizationError extends OperationalError {
  constructor(message = 'Access denied') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class TenantIsolationError extends OperationalError {
  constructor(message = 'Tenant access violation') {
    super(message, HttpStatus.FORBIDDEN);
  }
}
