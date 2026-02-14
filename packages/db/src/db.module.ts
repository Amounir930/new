import { publicPool } from './connection.js';
import { EncryptionService } from '@apex/security';
import { Global, Module } from '@nestjs/common';
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
    'DATABASE_POOL',
  ],
})
export class DbModule { }
