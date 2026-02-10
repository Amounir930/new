/**
 * S5: Global Exception Filter
 * Constitution Reference: architecture.md (S5 Protocol)
 * Purpose: Standardized error responses, no stack traces to client
 */
import { ArgumentsHost, ExceptionFilter, HttpException } from '@nestjs/common';
export interface ErrorResponse {
    statusCode: number;
    message: string;
    error: string;
    timestamp: string;
    path: string;
    requestId?: string;
    stack?: string;
}
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
    private parseError;
    private sanitizeMessage;
    private getErrorName;
    private logError;
    private generateRequestId;
    private reportToErrorTracking;
}
/**
 * Operational vs Programming Errors
 * Operational: Expected errors (validation, auth, etc.) - 4xx
 * Programming: Bugs (null reference, etc.) - 5xx
 */
export declare class OperationalError extends HttpException {
}
export declare class ValidationError extends OperationalError {
    constructor(message: string);
}
export declare class AuthenticationError extends OperationalError {
    constructor(message?: string);
}
export declare class AuthorizationError extends OperationalError {
    constructor(message?: string);
}
export declare class TenantIsolationError extends OperationalError {
    constructor(message?: string);
}
//# sourceMappingURL=exception-filter.d.ts.map