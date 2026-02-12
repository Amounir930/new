
import { Module, Global } from '@nestjs/common';
import { TenantRegistryService } from './tenant-registry.service.js';

@Global()
@Module({
    providers: [TenantRegistryService],
    exports: [TenantRegistryService],
})
export class DbModule { }
