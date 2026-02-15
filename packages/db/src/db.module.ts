import { EncryptionService } from '@apex/security';
import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { publicPool } from './connection.js';
import { CustomerService } from './services/customer.service.js';
import { TenantRegistryService } from './tenant-registry.service.js';

@Global()
@Module({
  providers: [
    TenantRegistryService,
    CustomerService,
    EncryptionService,
    {
      provide: 'DATABASE_POOL',
      useValue: publicPool,
    },
  ],
  exports: [
    TenantRegistryService,
    CustomerService,
    EncryptionService,
    'DATABASE_POOL', // Export token string
  ],
})
export class DbModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await publicPool.end();
  }
}
