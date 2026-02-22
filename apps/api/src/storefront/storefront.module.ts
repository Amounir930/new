import { AuditModule } from '@apex/audit';
import { DbModule } from '@apex/db';
import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller.js';
import { StorefrontService } from './storefront.service.js';

@Module({
  imports: [DbModule, AuditModule],
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
export class StorefrontModule { }
