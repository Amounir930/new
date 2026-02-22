import { SecurityModule } from '@apex/security';
import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { publicPool } from './connection.js';
import { CustomerService } from './services/customer.service.js';
import { TenantRegistryService } from './tenant-registry.service.js';

@Global()
@Module({
  imports: [SecurityModule],
  providers: [
    TenantRegistryService,
    CustomerService,
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
    'DATABASE_POOL', // Export token string
  ],
})
export class DbModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await publicPool.end();
  }
}
