/**
 * Apex v2 API Root Module
 * Configures S1-S8 Security Protocols
 */

import { TenantIsolationMiddleware } from '@apex/middleware';
import { DbModule } from '@apex/db';
import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60000', 10),
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
      {
        name: 'strict',
        ttl: 60000,
        limit: 10, // For auth endpoints
      },
    ]),

    HealthModule,
    ProvisioningModule,
    // Core Data Module (explicitly imported for root context availability)
    DbModule,
  ],
  providers: [
    // S6: Apply Rate Limiting Globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
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
