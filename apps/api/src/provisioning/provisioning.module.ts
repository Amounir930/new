import { AuditModule } from '@apex/audit';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SecurityModule } from '../security/security.module';
import { ProvisioningController } from './provisioning.controller';
import { ProvisioningService } from './provisioning.service';
import { PublicProvisioningController } from './public-provisioning.controller';

@Module({
  imports: [AuditModule, AuthModule, SecurityModule],
  controllers: [ProvisioningController, PublicProvisioningController],
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
