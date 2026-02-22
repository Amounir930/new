/**
 * Apex v2 API Root Module
 * Configures S1-S8 Security Protocols
 */

import { AuditInterceptor, AuditModule, AuditService } from '@apex/audit';
import { DbModule } from '@apex/db';
import {
  ActiveDefenseMiddleware,
  BotProtectionMiddleware,
  FingerprintMiddleware,
  GovernanceGuard,
  QuotaInterceptor,
  RateLimitModule,
  TenantIsolationMiddleware,
} from '@apex/middleware';
import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@apex/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { BlueprintsModule } from './blueprints/blueprints.module.js';
import { HealthModule } from './health/health.module.js';
import { ProductsController } from './products/products.controller.js';
import { BulkImportController } from './products/bulk-import.controller.js';
import { BulkExportController } from './products/bulk-export.controller.js';
import { ProvisioningModule } from './provisioning/provisioning.module.js';
import { HoneyTokensController } from './security/honey-tokens.controller.js';
import { StorefrontModule } from './storefront/storefront.module.js';
import { TenantsModule } from './tenants/tenants.module.js';
import { ExportModule } from '@apex/export';

@Module({
  imports: [
    // Core Data Module (explicitly imported for root context availability)
    DbModule,

    // S1: Configuration (Global validated service)
    ConfigModule,

    // S6: Rate Limiting (Throttler)
    RateLimitModule,
    HealthModule, // FIX: Registered Health Module
    AuthModule, // Registered Auth Module
    ProvisioningModule,
    BlueprintsModule,
    TenantsModule,
    StorefrontModule,
    AuditModule,
    ExportModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GovernanceGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: QuotaInterceptor,
    },
  ],
  controllers: [
    AppController,
    ProductsController,
    BulkImportController,
    HoneyTokensController
  ],
})
export class AppModule implements NestModule {
  // S2: Apply Tenant Isolation Middleware & S11: Bot Protection
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        ActiveDefenseMiddleware,
        FingerprintMiddleware,
        BotProtectionMiddleware,
        TenantIsolationMiddleware
      )
      .exclude(
        { path: 'robots.txt', method: RequestMethod.GET },
        { path: '/', method: RequestMethod.GET }
      )
      .forRoutes('*'); // Apply to all routes
  }
}
