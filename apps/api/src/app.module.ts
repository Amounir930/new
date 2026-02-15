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
  RateLimitModule,
  TenantIsolationMiddleware,
} from '@apex/middleware';
import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HealthModule } from './health/health.module.js';
import { ProvisioningModule } from './provisioning/provisioning.module.js';

@Module({
  imports: [
    // Core Data Module (explicitly imported for root context availability)
    DbModule,

    // S1: Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.s1.local'],
    }),

    // S6: Rate Limiting (Throttler)
    RateLimitModule,

    HealthModule,
    ProvisioningModule,
    AuditModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    // AuditInterceptor is used via APP_INTERCEPTOR
    {
      provide: 'AUDIT_SERVICE',
      useExisting: AuditService,
    },
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
        { path: 'health/(.*)', method: RequestMethod.GET },
        { path: 'api/health/(.*)', method: RequestMethod.GET },
        { path: 'v1/health/(.*)', method: RequestMethod.GET },
        { path: 'api/v1/health/(.*)', method: RequestMethod.GET },
        { path: 'api/v1/health/liveness', method: RequestMethod.GET },
        { path: 'v1/health/liveness', method: RequestMethod.GET }
      )
      .forRoutes('*'); // Apply to all routes
  }
}
