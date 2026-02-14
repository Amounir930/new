import { type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Observable } from 'rxjs';
import { AuditService } from './audit.service.js';
/**
 * S4: Global Audit Interceptor
 * Automatically logs all write operations (POST, PUT, DELETE, PATCH)
 * Uses @AuditLog decorator metadata if present, otherwise uses route info.
 */
export declare class AuditInterceptor implements NestInterceptor {
    private readonly reflector;
    private readonly auditService;
    constructor(reflector: Reflector, auditService: AuditService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private performAudit;
}
//# sourceMappingURL=audit.interceptor.d.ts.map