import { ConfigModule } from '@apex/config';
import { Global, Module } from '@nestjs/common';
import { TenantCacheService } from './tenant-cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    TenantCacheService,
    { provide: 'TENANT_CACHE_SERVICE', useExisting: TenantCacheService },
  ],
  exports: [TenantCacheService, 'TENANT_CACHE_SERVICE'],
})
export class TenantCacheModule {}
