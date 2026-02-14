/**
 * Apex v2 API Root Module
 * Configures S1-S8 Security Protocols
 */

import { AuditInterceptor, AuditModule, AuditService } from '@apex/audit';
import { DbModule } from '@apex/db';
import {
  RateLimitGuard,
  RateLimitModule,
  TenantIsolationMiddleware,
} from '@apex/middleware';
import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
// import { AuditInterceptor } from './audit-interceptor.local.js'; // REMOVED
import { HealthModule } from './health/health.module.js';
import { ProvisioningModule } from './provisioning/provisioning.module.js';

@Module({
  imports: [
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
    // Core Data Module (explicitly imported for root context availability)
    DbModule,
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
    // S6: Global Rate Limiting (Moved to RateLimitModule)
  ],
})
export class AppModule implements NestModule {
  // S2: Apply Tenant Isolation Middleware
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantIsolationMiddleware).forRoutes('*'); // Apply to all routes
  }
}
