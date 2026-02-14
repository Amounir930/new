var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tap } from 'rxjs';
import { AUDIT_LOG_METADATA_KEY, } from './audit.decorator.js';
import { AuditService } from './audit.service.js';
/**
 * S4: Global Audit Interceptor
 * Automatically logs all write operations (POST, PUT, DELETE, PATCH)
 * Uses @AuditLog decorator metadata if present, otherwise uses route info.
 */
let AuditInterceptor = class AuditInterceptor {
    reflector;
    auditService;
    constructor(reflector, auditService) {
        this.reflector = reflector;
        this.auditService = auditService;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        // Only audit write operations by default
        const isWriteOp = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
        // Check for explicit @AuditLog decorator
        const auditOptions = this.reflector.get(AUDIT_LOG_METADATA_KEY, context.getHandler());
        if (!isWriteOp && !auditOptions) {
            return next.handle();
        }
        return next.handle().pipe(tap({
            next: async (data) => {
                await this.performAudit(context, auditOptions, data, 'SUCCESS');
            },
            error: async (error) => {
                await this.performAudit(context, auditOptions, error, 'FAILURE');
            },
        }));
    }
    async performAudit(context, options, resultData, resultStatus) {
        const request = context.switchToHttp().getRequest();
        const { method, url, ip, headers } = request;
        const user = request.user;
        // Determine action name
        const action = options?.action || `${method}:${url}`;
        const entityType = options?.entityType || 'api_request';
        // Extract entityId if possible from params or body
        const entityId = request.params?.id ||
            request.body?.id ||
            request.body?.subdomain ||
            'unknown';
        try {
            await this.auditService.log({
                action,
                entityType,
                entityId,
                userId: user?.id,
                userEmail: user?.email,
                ipAddress: ip,
                userAgent: headers['user-agent'],
                severity: options?.severity || (resultStatus === 'FAILURE' ? 'HIGH' : 'INFO'),
                result: resultStatus,
                metadata: {
                    path: url,
                    method,
                    statusCode: context.switchToHttp().getResponse().statusCode,
                    ...(resultStatus === 'FAILURE'
                        ? { error: resultData?.message || resultData?.toString() }
                        : {}),
                },
            });
        }
        catch (err) {
            // Fail-safe: don't crash the request if auditing fails, but log it
            console.error('S4 Auditing Failed:', err);
        }
    }
};
AuditInterceptor = __decorate([
    Injectable(),
    __param(0, Inject(Reflector)),
    __param(1, Inject(AuditService)),
    __metadata("design:paramtypes", [Reflector,
        AuditService])
], AuditInterceptor);
export { AuditInterceptor };
//# sourceMappingURL=audit.interceptor.js.map