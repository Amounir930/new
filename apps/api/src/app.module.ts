/**
 * Apex v2 API Root Module
 * Configures S1-S8 Security Protocols
 */

import { AuditModule } from '@apex/audit';
import { ConfigModule, ConfigService } from '@apex/config';
import { EventsModule } from '@apex/events';
import { ExportModule } from '@apex/export';
import {
  ActiveDefenseMiddleware,
  BotProtectionMiddleware,
  FingerprintMiddleware,
  GovernanceGuard,
  QuotaInterceptor,
  RateLimitModule,
  TenantCacheService,
  TenantIsolationMiddleware,
} from '@apex/middleware';
import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { BlueprintsModule } from './blueprints/blueprints.module';
import { MediaModule } from './common/media/media.module';
import { GovernanceModule } from './governance/governance.module';
import { HealthModule } from './health/health.module';
import { BulkImportController } from './products/bulk-import.controller';
import { ProductsController } from './products/products.controller';
import { ProvisioningModule } from './provisioning/provisioning.module';
import { HoneyTokensController } from './security/honey-tokens.controller';
import { SecurityModule } from './security/security.module';
import { StorefrontModule } from './storefront/storefront.module';
import { MerchantStatsController } from './tenants/merchant-stats.controller';
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [
    // S15: Security Module (Global) - Register FIRST
    SecurityModule,

    // Core Data Module removed in favor of Drizzle connection pools

    // S1: Configuration
    ConfigModule,

    // Media (Imgproxy) Global Module
    MediaModule,

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
    GovernanceModule,
    // S14.7: Persistent Event Bus (Rule 1.3)
    EventsModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: unknown) =>
        ((config as ConfigService).get('REDIS_URL') as string) ||
        'redis://localhost:6379',
      inject: [ConfigService],
    }),
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
    TenantCacheService,
  ],
  controllers: [
    AppController,
    ProductsController,
    BulkImportController,
    HoneyTokensController,
    MerchantStatsController,
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
        { path: 'blueprints(.*)', method: RequestMethod.ALL },
        { path: 'tenants(.*)', method: RequestMethod.ALL },
        { path: 'governance(.*)', method: RequestMethod.ALL },
        { path: 'robots.txt', method: RequestMethod.GET },
        { path: '/', method: RequestMethod.GET }
      )
      .forRoutes('*');
  }
}
