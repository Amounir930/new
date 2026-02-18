import { TenantRegistryService } from '@apex/db';
import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller.js';
import { TenantsPublicController } from './tenants-public.controller.js';

@Module({
  controllers: [TenantsController, TenantsPublicController],
  providers: [TenantRegistryService],
})
export class TenantsModule {}
