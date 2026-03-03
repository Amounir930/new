import { adminPool } from '@apex/db';
import { SecurityModule } from '@apex/security';
import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { AuditInterceptor } from './audit.interceptor.js';
import { AuditService } from './audit.service.js';

/**
 * S4: Audit Module
 * Provides auditing services.
 */
@Global()
@Module({
  imports: [SecurityModule],
  providers: [
    Reflector,
    AuditService,
    {
      provide: 'DATABASE_POOL',
      useFactory: () => adminPool,
    },
    {
      provide: 'AUDIT_SERVICE',
      useExisting: AuditService,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService, 'AUDIT_SERVICE', Reflector],
})
export class AuditModule { }
