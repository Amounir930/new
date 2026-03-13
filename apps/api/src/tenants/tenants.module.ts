import { AuditModule } from '@apex/audit';
import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProvisioningModule } from '../provisioning/provisioning.module';
import { TenantsPublicController } from './tenants-public.controller';
import { TenantsController } from './tenants.controller';

@Module({
  imports: [
    AuditModule,
    forwardRef(() => AuthModule),
    forwardRef(() => ProvisioningModule),
  ],
  controllers: [TenantsController, TenantsPublicController],
  providers: [],
})
export class TenantsModule {}
