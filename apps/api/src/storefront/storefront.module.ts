import { AuditModule } from '@apex/audit';

import { Module } from '@nestjs/common';
import { TenantCacheModule } from '@apex/middleware';
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
