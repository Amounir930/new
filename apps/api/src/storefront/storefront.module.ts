import { AuditModule } from '@apex/audit';

import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller.js';
import { StorefrontService } from './storefront.service.js';

@Module({
  imports: [AuditModule],
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
