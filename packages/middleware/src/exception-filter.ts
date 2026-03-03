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
  Injectable,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

// S5: Initialize Sentry globally for GlitchTip reporting
// Note: Actual DSN-based init usually happens in main.ts,
// but we keep a secondary check here for safety.
if (env.GLITCHTIP_DSN && env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: env.GLITCHTIP_DSN,
    environment: env.NODE_ENV,
  });
}

export interface ExceptionFilterOptions {
  includeStackTrace?: boolean;
  includeIpDetails?: boolean;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly options: ExceptionFilterOptions;

  constructor(options: ExceptionFilterOptions = {}) {
    this.options = {
      includeStackTrace: false,
      includeIpDetails: false,
      ...options,
    };
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = this.generateRequestId();
    const { statusCode, message, error, validationErrors } = this.parseError(exception);

    // S5: Sanitized client response
    const clientResponse: any = {
      statusCode,
      message: this.sanitizeMessage(statusCode, message),
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    if (validationErrors) {
      clientResponse.errors = validationErrors;
    }

    // S5/S8: Detailed server-side logging (Internal Only)
    const serverLog = {
      requestId,
      message:
        exception instanceof Error ? exception.message : String(exception),
      status: statusCode,
      path: request.url,
      method: request.method,
      // S8: IP handling based on environment
      ip: this.options.includeIpDetails
        ? this.getClientIp(request)
        : '[REDACTED]',
      userAgent: this.options.includeIpDetails
        ? request.headers['user-agent'] || null
        : '[REDACTED]',
      // S5: Stack trace only in development, with path redaction
      ...(this.options.includeStackTrace &&
        exception instanceof Error && {
        stackTrace: exception.stack?.replace(
          /(\/app\/|[Cc]:\\Users\\[^\\]+\\Desktop\\60sec\.shop\\)/g,
          '[REDACTED]/'
        ),
      }),
    };

    // Log internally
    if (statusCode >= 500) {
      this.logger.error(serverLog, 'Exception caught');
    } else {
      this.logger.debug(serverLog, 'Request filtered');
    }

    // Send sanitized response to client
    response.status(statusCode).json(clientResponse);

    // Report to GlitchTip/Sentry in production
    if (env.NODE_ENV === 'production' && statusCode >= 500) {
      this.reportToErrorTracking(exception, requestId);
    }
  }

  private parseError(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
    validationErrors?: any;
  } {
    // Zod validation errors (S3) (Direct ZodError)
    if (exception instanceof ZodError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: 'Bad Request',
        validationErrors: exception.issues,
      };
    }

    // ZodValidationException (nestjs-zod) - Duck typing check
    if (exception && typeof (exception as any).getValidationIssues === 'function') {
      const issues = (exception as any).getValidationIssues();
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: 'Bad Request',
        validationErrors: issues,
      };
    }

    // NestJS HTTP exceptions (Fall through to generic handlers)
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

    // Generic Error (Audit 777 Point #50: Map SQL errors)
    const err = exception as any;
    if (err.code && typeof err.code === 'string' && err.code.startsWith('23')) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Data integrity violation. Please check your inputs.',
        error: 'Conflict',
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
    // Standardize S5: Never expose internal details for 500 errors
    if (statusCode === 500) {
      return 'Internal server error';
    }

    // S1 Override: Respect ConfigService
    if (env.NODE_ENV !== 'production') {
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

  private getClientIp(request: Request): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.toString().split(',')[0]?.trim() || null;
    }
    return request.ip || request.connection.remoteAddress || null;
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
export class OperationalError extends HttpException { }

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
