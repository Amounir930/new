/**
 * S5: Global Exception Filter
 * Constitution Reference: architecture.md (S5 Protocol)
 * Purpose: Standardized error responses, no stack traces to client
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

export interface ErrorResponse {
  statusCode: number;
  message: string;
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
    this.logError(exception, requestId, request);

    // Build response (sanitized for client)
    const errorResponse: ErrorResponse = {
      statusCode,
      message: this.sanitizeMessage(statusCode, message),
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    // S5 FIX: Stack trace only in development, never in production
    if (process.env.NODE_ENV === 'development') {
      // Limit stack trace depth and sanitize internal paths
      const stack = exception instanceof Error ? exception.stack : undefined;
      if (stack) {
        const sanitizedStack = stack
          .split('\n')
          .slice(0, 5)
          .map(
            (line) =>
              line
                .replace(
                  /[a-zA-Z]:\\(?:[^\\/:*?"<>|]+\\)*[^\\/:*?"<>|]*/g,
                  '[USER]'
                ) // Windows paths (Robost Regex)
                .replace(/\/home\/[^/]+\//g, '[USER]/') // Linux paths
                .replace(/\/Users\/[^/]+\//g, '[USER]/') // macOS paths
          )
          .join('\n');
        errorResponse.stack = sanitizedStack;
      }
    }

    // S5 FIX: In production, ensure no internal details leak
    if (process.env.NODE_ENV === 'production') {
      // Remove any potentially sensitive fields
      (errorResponse as any).stack = undefined;
      // Ensure generic message for 500 errors
      if (statusCode === 500) {
        errorResponse.message = 'Internal server error';
      }
    }

    response.status(statusCode).json(errorResponse);

    // Report to GlitchTip/Sentry in production
    if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
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

    // Default: Internal server error
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }

  private sanitizeMessage(statusCode: number, message: string): string {
    // S5 FIX: Never expose internal details for 500 errors
    if (statusCode === 500) {
      return 'Internal server error';
    }

    // S5 FIX: Also sanitize for production environment regardless of status
    if (process.env.NODE_ENV === 'production') {
      return 'Request failed';
    }

    // S5 FIX: Also sanitize potential internal details from 4xx errors
    // Database table names, column names, internal paths
    const internalPatterns = [
      /table\s+['"]?\w+['"]?/gi,
      /column\s+['"]?\w+['"]?/gi,
      /relation\s+['"]?\w+['"]?/gi,
      /schema\s+['"]?\w+['"]?/gi,
      /database\s+['"]?\w+['"]?/gi,
      /constraint\s+['"]?\w+['"]?/gi,
      /\/.*\/packages\//g,
      /\/.*\/node_modules\//g,
    ];

    const sanitized = message;
    for (const pattern of internalPatterns) {
      if (pattern.test(sanitized)) {
        // If message contains internal details, return generic message
        if (statusCode >= 400 && statusCode < 500) {
          return 'Invalid request';
        }
      }
    }

    return sanitized;
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
    request: Request
  ): void {
    const error =
      exception instanceof Error ? exception : new Error(String(exception));
    const { message, stack: errorStackTrace } = error;

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

  private reportToErrorTracking(_exception: unknown, requestId: string): void {
    // TODO: Integrate with GlitchTip or Sentry
    // Example:
    // Sentry.captureException(exception, {
    //   extra: { requestId }
    // });

    // Fallback: Log to console if no specific error tracking service is configured
    // This ensures production errors are at least visible in logs
    this.logger.error(
      `[Sentry Fallback ${requestId}]: Error reported to tracking (simulation)`
    );
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
