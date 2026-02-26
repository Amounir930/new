import { SecurityModule } from '@apex/security';
import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { publicPool } from './connection.js';
import { RedisService } from './redis.service.js';
import { CustomerService } from './services/customer.service.js';
import { GovernanceService } from './services/governance.service.js';
import { MasterControlService } from './services/master-control.service.js';
import { MerchantStatsService } from './services/merchant-stats.service.js';
import { ProductsService } from './services/products.service.js';
import { StaffService } from './services/staff.service.js';
import { TenantRegistryService } from './tenant-registry.service.js';

@Global()
@Module({
  imports: [SecurityModule],
  providers: [
    TenantRegistryService,
    RedisService,
    CustomerService,
    ProductsService,
    MerchantStatsService,
    GovernanceService,
    MasterControlService,
    StaffService,
    {
      provide: 'TENANT_REGISTRY',
      useExisting: TenantRegistryService,
    },
  ],
  exports: [
    TenantRegistryService,
    'TENANT_REGISTRY',
    RedisService,
    CustomerService,
    ProductsService,
    MerchantStatsService,
    GovernanceService,
    MasterControlService,
    StaffService,
  ],
})
export class DbModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await publicPool.end();
  }
}
