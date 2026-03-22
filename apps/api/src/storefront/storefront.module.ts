import { AuditModule } from '@apex/audit';
import { TenantCacheModule } from '@apex/middleware';
import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';

@Module({
  imports: [AuditModule, TenantCacheModule],
  controllers: [StorefrontController],
  providers: [
    StorefrontService,
    {
      provide: 'STOREFRONT_SERVICE',
      useExisting: StorefrontService,
    },
  ],
  exports: [StorefrontService, 'STOREFRONT_SERVICE'],
})
export class StorefrontModule {}
