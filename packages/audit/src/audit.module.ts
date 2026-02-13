import { Global, Module } from '@nestjs/common';
import { AuditInterceptor } from './audit.interceptor.js';
import { AuditService } from './audit.service.js';

/**
 * S4: Audit Module
 * Provides auditing services and intercepts write operations globally.
 */
@Global()
@Module({
    providers: [AuditService, AuditInterceptor],
    exports: [AuditService, AuditInterceptor],
})
export class AuditModule { }
