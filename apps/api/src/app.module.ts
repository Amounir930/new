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
import { MerchantStatsController } from './tenants/merchant-stats.controller.js';
import { ExportModule } from '@apex/export';
import { SecurityModule } from './security/security.module.js';

@Module({
  imports: [
    // S15: Security Module (Global) - Register FIRST
    SecurityModule,

    // Core Data Module
    DbModule,

    // S1: Configuration
    ConfigModule,

    // S6: Rate Limiting
    RateLimitModule,
    HealthModule,
    AuthModule,
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
    HoneyTokensController,
    MerchantStatsController
  ],
})
export class AppModule implements NestModule {
  // S2: Apply Tenant Isolation & S11: Bot Protection with specific exclusions
  configure(consumer: MiddlewareConsumer) {
    // 1. General Defense (Broad Application)
    consumer
      .apply(ActiveDefenseMiddleware, FingerprintMiddleware)
      .forRoutes('*');

    // 2. Bot Protection (Exclude Health checks to prevent False Positives)
    consumer
      .apply(BotProtectionMiddleware)
      .exclude(
        { path: 'api/v1/health/(.*)', method: RequestMethod.GET },
        { path: 'health/(.*)', method: RequestMethod.GET },
        { path: 'robots.txt', method: RequestMethod.GET },
        { path: '/', method: RequestMethod.GET }
      )
      .forRoutes('*');

    // 3. Tenant Isolation (Exclude Auth & Health - S2 Resilience)
    consumer
      .apply(TenantIsolationMiddleware)
      .exclude(
        { path: 'api/v1/auth/(.*)', method: RequestMethod.POST },
        { path: 'api/v1/health/(.*)', method: RequestMethod.GET },
        { path: 'auth/(.*)', method: RequestMethod.POST },
        { path: 'health/(.*)', method: RequestMethod.GET },
        { path: 'robots.txt', method: RequestMethod.GET },
        { path: '/', method: RequestMethod.GET }
      )
      .forRoutes('*');
  }
}
