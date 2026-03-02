import { AuditModule } from '@apex/audit';

import { Module } from '@nestjs/common';
import { ProvisioningController } from './provisioning.controller.js';
import { ProvisioningService } from './provisioning.service.js';

@Module({
  imports: [AuditModule],
  controllers: [ProvisioningController],
  providers: [
    ProvisioningService,
    {
      provide: 'PROVISIONING_SERVICE',
      useExisting: ProvisioningService,
    },
  ],
  exports: [ProvisioningService, 'PROVISIONING_SERVICE'],
})
export class ProvisioningModule {}
