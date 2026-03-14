import { AuditModule } from '@apex/audit';
import { TenantCacheModule } from '@apex/middleware';
import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProvisioningModule } from '../provisioning/provisioning.module';
import { TenantsController } from './tenants.controller';
import { TenantsPublicController } from './tenants-public.controller';

@Module({
  imports: [
    AuditModule,
    forwardRef(() => AuthModule),
    forwardRef(() => ProvisioningModule),
    TenantCacheModule,
  ],
  controllers: [TenantsController, TenantsPublicController],
  providers: [],
})
export class TenantsModule {}
