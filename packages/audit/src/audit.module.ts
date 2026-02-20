import { AuditInterceptor } from './audit.interceptor.js';
import { AuditService } from './audit.service.js';
import { DbModule } from '@apex/db';
import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';

/**
 * S4: Audit Module
 * Provides auditing services.
 */
@Global()
@Module({
  imports: [DbModule],
  providers: [
    Reflector,
    AuditService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService, Reflector],
})
export class AuditModule { }
