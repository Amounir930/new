import { SecurityModule } from '@apex/security';
import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { publicPool } from './connection.js';
import { CustomerService } from './services/customer.service.js';
import { ProductsService } from './services/products.service.js';
import { MerchantStatsService } from './services/merchant-stats.service.js';
import { TenantRegistryService } from './tenant-registry.service.js';

@Global()
@Module({
  imports: [SecurityModule],
  providers: [
    TenantRegistryService,
    CustomerService,
    ProductsService,
    MerchantStatsService,
    {
      provide: 'TENANT_REGISTRY',
      useExisting: TenantRegistryService,
    },
    {
      provide: 'DATABASE_POOL',
      useValue: publicPool,
    },
  ],
  exports: [
    TenantRegistryService,
    'TENANT_REGISTRY',
    CustomerService,
    ProductsService,
    MerchantStatsService,
    'DATABASE_POOL', // Export token string
  ],
})
export class DbModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await publicPool.end();
  }
}
