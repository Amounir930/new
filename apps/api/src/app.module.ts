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
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { BlueprintsModule } from './blueprints/blueprints.module.js';
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
    AuthModule, // Registered Auth Module
    ProvisioningModule,
    BlueprintsModule,
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
  controllers: [AppController],
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
        { path: '*/health/(.*)', method: RequestMethod.GET },
        { path: 'health/(.*)', method: RequestMethod.GET },
        { path: 'api/health/(.*)', method: RequestMethod.GET },
        { path: 'api/v1/health/(.*)', method: RequestMethod.GET },
        { path: '/', method: RequestMethod.GET } // Allow root path
      )
      .forRoutes('*'); // Apply to all routes
  }
}
