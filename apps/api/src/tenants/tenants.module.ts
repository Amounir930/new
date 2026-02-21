import { TenantRegistryService } from '@apex/db';
import { Module } from '@nestjs/common';
import { TenantsPublicController } from './tenants-public.controller.js';
import { TenantsController } from './tenants.controller.js';

@Module({
  controllers: [TenantsController, TenantsPublicController],
  providers: [TenantRegistryService],
})
export class TenantsModule {}
