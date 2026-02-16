import { Module } from '@nestjs/common';
// biome-ignore lint/style/useImportType: Dependency Injection
import { TenantRegistryService } from '@apex/db';
import { TenantsController } from './tenants.controller.js';

@Module({
    controllers: [TenantsController],
    providers: [TenantRegistryService],
})
export class TenantsModule { }
