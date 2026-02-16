import { TenantRegistryService } from '@apex/db';
import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller.js';

@Module({
  controllers: [TenantsController],
  providers: [TenantRegistryService],
})
export class TenantsModule {}
