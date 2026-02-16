// biome-ignore lint/style/useImportType: Dependency Injection token
import { TenantRegistryService } from '@apex/db';
import { SuperAdminGuard } from '../../../../packages/auth/src/guards/super-admin.guard.js';
import { JwtAuthGuard } from '../../../../packages/auth/src/index.js';

@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class TenantsController {
  constructor(private readonly tenantRegistry: TenantRegistryService) {}

  @Get()
  async findAll() {
    return this.tenantRegistry.findAll();
  }
}
