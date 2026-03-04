import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Response } from 'express';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly options: {
      includeStackTrace: boolean;
      includeIpDetails: boolean;
    }
  ) { }
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<any>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let error = 'Internal Server Error';
    let validationErrors: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object') {
        message = (res as any).message || JSON.stringify(res);
        error = (res as any).error || 'Error';
        validationErrors = (res as any).errors;
      } else {
        message = res;
      }
    } else if (exception && typeof (exception as any).getValidationIssues === 'function') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      error = 'Bad Request';
      validationErrors = (exception as any).getValidationIssues();
    } else {
      // Postgres error mapping
      const err = exception as any;
      if (err?.code && typeof err.code === 'string' && err.code.startsWith('23')) {
        status = HttpStatus.CONFLICT;
        message = 'Data integrity violation';
        error = 'Conflict';
      }
    }

    // S5: Mask raw errors in production
    const isProduction = process.env.NODE_ENV === 'production';
    const responseBody = {
      statusCode: status,
      message: isProduction && status === 500 ? 'Internal server error' : message,
      error,
      validationErrors,
      timestamp: new Date().toISOString(),
      path: request.url,
      stack: this.options.includeStackTrace ? (exception as any)?.stack : undefined,
    };

    // Log error (S5 Enforcement)
    if (status >= 500) {
      process.stdout.write(`[ERROR] [${new Date().toISOString()}] ${request.method} ${request.url} - ${JSON.stringify(exception)}\n`);
    }

    response.status(status).json(responseBody);
  }
}
