import { ConfigModule } from '@apex/config';
import { Global, Module } from '@nestjs/common';
import { TenantCacheService } from './tenant-cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TenantCacheService],
  exports: [TenantCacheService],
})
export class TenantCacheModule {}
