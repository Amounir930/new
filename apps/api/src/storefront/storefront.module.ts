import { AuditModule } from '@apex/audit';
import { CustomerAuthModule } from '@apex/auth';
import { TenantCacheModule } from '@apex/middleware';
import { Module } from '@nestjs/common';
import { CustomerAuthController } from './customer-auth.controller';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';

@Module({
  imports: [
    AuditModule,
    TenantCacheModule, 
    CustomerAuthModule,
  ],
  controllers: [StorefrontController, CustomerAuthController],
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
