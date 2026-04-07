import { AuditModule } from '@apex/audit';
import { CustomerAuthModule } from '@apex/auth';
import { TenantCacheModule } from '@apex/middleware';
import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { CustomerAuthController } from './customer-auth.controller';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  imports: [AuditModule, TenantCacheModule, CustomerAuthModule],
  controllers: [
    StorefrontController,
    CustomerAuthController,
    CheckoutController,
    StripeWebhookController,
  ],
  providers: [
    StorefrontService,
    {
      provide: 'STOREFRONT_SERVICE',
      useExisting: StorefrontService,
    },
    CheckoutService,
    StripeService,
    StripeWebhookService,
  ],
  exports: [
    StorefrontService,
    'STOREFRONT_SERVICE',
    CheckoutService,
    StripeService,
  ],
})
export class StorefrontModule {}
