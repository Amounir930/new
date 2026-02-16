import { Controller, Get, UseGuards } from '@nestjs/common';
// biome-ignore lint/style/useImportType: Dependency Injection
import { TenantRegistryService } from '@apex/db';
import { SuperAdminGuard } from '../../../../packages/auth/src/guards/super-admin.guard.js';

@Controller('admin/tenants')
@UseGuards(SuperAdminGuard)
export class TenantsController {
    constructor(private readonly tenantRegistry: TenantRegistryService) { }

    @Get()
    async findAll() {
        return this.tenantRegistry.findAll();
    }
}
