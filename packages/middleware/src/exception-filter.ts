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
  ) {}
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<any>();

    const { status, message, error, validationErrors } =
      this.parseException(exception);

    // S5: Mask raw errors in production
    const isProduction = process.env.NODE_ENV === 'production';
    const responseBody = {
      statusCode: status,
      message:
        isProduction && status === 500 ? 'Internal server error' : message,
      error,
      validationErrors,
      timestamp: new Date().toISOString(),
      path: request.url,
      stack: this.options.includeStackTrace
        ? (exception as any)?.stack
        : undefined,
    };

    // Log error (S5 Enforcement)
    if (status >= 500) {
      process.stdout.write(
        `[ERROR] [${new Date().toISOString()}] ${request.method} ${request.url} - ${JSON.stringify(exception)}\n`
      );
    }

    response.status(status).json(responseBody);
  }

  private parseException(exception: any) {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const isObj = typeof res === 'object' && res !== null;
      return {
        status: exception.getStatus(),
        message: isObj ? (res as any).message || JSON.stringify(res) : res,
        error: isObj ? (res as any).error || 'Error' : 'Error',
        validationErrors: isObj ? (res as any).errors : undefined,
      };
    }
    if (exception?.getValidationIssues) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: 'Bad Request',
        validationErrors: exception.getValidationIssues(),
      };
    }
    if (exception?.code?.startsWith?.('23')) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'Data integrity violation',
        error: 'Conflict',
        validationErrors: undefined,
      };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
      validationErrors: undefined,
    };
  }
}
