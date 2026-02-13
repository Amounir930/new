import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service.js';

/**
 * S4: Audit Module
 * Provides auditing services.
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
