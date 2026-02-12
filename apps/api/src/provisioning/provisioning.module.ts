import { AuditService } from '@apex/audit';
import { DbModule, TenantRegistryService } from '@apex/db';
import { Module } from '@nestjs/common';
import { ProvisioningController } from './provisioning.controller.js';
import { ProvisioningService } from './provisioning.service.js';

@Module({
  imports: [DbModule],
  controllers: [ProvisioningController],
  providers: [
    ProvisioningService,
    {
      provide: 'PROVISIONING_SERVICE',
      useClass: ProvisioningService,
    },
    {
      provide: 'AUDIT_SERVICE',
      useClass: AuditService,
    },
  ],
  exports: ['PROVISIONING_SERVICE'],
})
export class ProvisioningModule { }
