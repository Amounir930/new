/**
 * Apex v2 API Root Module
 * Configures S1-S8 Security Protocols
 */

import { AuditModule, AuditService, AuditInterceptor } from '@apex/audit';
import { DbModule } from '@apex/db';
import { TenantIsolationMiddleware } from '@apex/middleware';
import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
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
    // S6: Rate Limiting is now handled by RateLimitGuard (Redis-backed in middleware)

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
    // Note: RateLimitGuard is HTTP-specific and applied per-controller
    // Not registered globally to avoid CLI context issues
  ],
})
export class AppModule implements NestModule {
  // S2: Apply Tenant Isolation Middleware
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantIsolationMiddleware).forRoutes('*'); // Apply to all routes
  }
}
