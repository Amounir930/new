import { AuditInterceptor } from './audit.interceptor.js';
import { AuditService } from './audit.service.js';
import { DbModule } from '@apex/db';
import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

/**
 * S4: Audit Module
 * Provides auditing services.
 */
@Global()
@Module({
  imports: [DbModule],
  providers: [
    AuditService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService],
})
export class AuditModule { }
