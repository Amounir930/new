import { AuditModule, AuditService } from '@apex/audit';
import { DbModule } from '@apex/db';
import { Module } from '@nestjs/common';
import { ProvisioningController } from './provisioning.controller.js';
import { ProvisioningService } from './provisioning.service.js';

@Module({
  imports: [DbModule, AuditModule],
  controllers: [ProvisioningController],
  providers: [
    ProvisioningService,
    {
      provide: 'PROVISIONING_SERVICE',
      useClass: ProvisioningService,
    },
    {
      provide: 'AUDIT_SERVICE',
      useExisting: AuditService,
    },
  ],
  exports: ['PROVISIONING_SERVICE'],
})
export class ProvisioningModule { }
