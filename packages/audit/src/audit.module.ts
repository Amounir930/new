import { Global, Module } from '@nestjs/common';
import { DbModule } from '@apex/db';
import { AuditService } from './audit.service';

/**
 * S4: Audit Module
 * Provides auditing services.
 */
@Global()
@Module({
  imports: [DbModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule { }
