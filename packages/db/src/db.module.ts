import { EncryptionService } from '@apex/security';
import { Global, Module } from '@nestjs/common';
import { CustomerService } from './services/customer.service.js';
import { TenantRegistryService } from './tenant-registry.service.js';

@Global()
@Module({
  providers: [TenantRegistryService, CustomerService, EncryptionService],
  exports: [TenantRegistryService, CustomerService, EncryptionService],
})
export class DbModule { }
