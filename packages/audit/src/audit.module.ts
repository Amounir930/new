import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { publicPool } from '@apex/db';

/**
 * S4: Audit Module
 * Provides auditing services.
 */
@Global()
@Module({
  providers: [
    AuditService,
    {
      provide: 'DATABASE_POOL',
      useValue: publicPool,
    },
  ],
  exports: [AuditService],
})
export class AuditModule { }
