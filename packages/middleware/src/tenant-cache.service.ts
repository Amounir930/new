import { env } from '@apex/config/server';
import { adminDb, eq, tenantsInGovernance } from '@apex/db';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
import type { TenantContext } from './connection-context';
import { isUuid, toSchemaName } from './utils';

@Injectable()
export class TenantCacheService implements OnModuleInit {
  private redis: RedisClientType | null = null;
  private connecting = false;
  private readonly logger = new Logger(TenantCacheService.name);
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor() {
    const redisUrl = env.REDIS_URL || 'redis://localhost:6379';
    this.redis = createClient({
      url: redisUrl,
      socket: {
        keepAlive: 5000,
        connectTimeout: 5000,
        timeout: 5000,
        reconnectStrategy: (retries) => Math.min(retries * 1000, 30000),
      },
      pingInterval: 10000,
    });

    // 🛡️ P0 FIX: Prevent unhandled error events from crashing the process
    this.redis.on('error', (err) => {
      this.logger.warn(`Redis connection error: ${err.message}`);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed — attempting reconnect');
      this.attemptReconnect();
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry() {
    if (!this.redis || this.connecting) return;
    try {
      this.connecting = true;
      await this.redis.connect();
      this.logger.log('Tenant Cache: Redis connection established');
    } catch (err) {
      this.logger.error(
        `Tenant Cache: Redis connection failed — ${err instanceof Error ? err.message : 'unknown error'}`
      );
      // Retry after 5s
      setTimeout(() => this.attemptReconnect(), 5000);
    } finally {
      this.connecting = false;
    }
  }

  private async attemptReconnect() {
    if (!this.redis) return;
    try {
      if (!this.redis.isOpen) {
        await this.redis.connect();
        this.logger.log('Tenant Cache: Redis reconnected successfully');
      }
    } catch (err) {
      this.logger.warn(
        `Tenant Cache: Redis reconnect failed — ${err instanceof Error ? err.message : 'unknown'}`
      );
      // Retry after 5s
      setTimeout(() => this.attemptReconnect(), 5000);
    }
  }

  /**
   * Graceful Redis access — returns null if Redis is unavailable
   * instead of throwing. Ensures the API stays alive.
   */
  private async safeExec<T>(
    operation: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    if (!this.redis?.isOpen) return fallback;
    try {
      return await operation();
    } catch (err) {
      this.logger.warn(
        `Tenant Cache: Redis operation failed — ${err instanceof Error ? err.message : 'unknown'}`
      );
      // Attempt reconnect in background
      this.attemptReconnect();
      return fallback;
    }
  }

  async getTenant(
    identifier: string
  ): Promise<Omit<TenantContext, 'executor'> | null> {
    return this.safeExec(async () => {
      const key = `tenant:cache:${identifier.toLowerCase()}`;
      const data = await this.redis!.get(key);

      if (!data) return null;

      try {
        const parsed = JSON.parse(data);
        if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
        return parsed;
      } catch {
        return null;
      }
    }, null);
  }

  async setTenant(
    identifier: string,
    context: Omit<TenantContext, 'executor'>
  ): Promise<void> {
    await this.safeExec(async () => {
      const key = `tenant:cache:${identifier.toLowerCase()}`;
      await this.redis!.set(key, JSON.stringify(context), {
        EX: this.CACHE_TTL,
      });
    }, undefined);
  }

  async invalidateTenant(identifier: string): Promise<void> {
    await this.safeExec(async () => {
      const key = `tenant:cache:${identifier.toLowerCase()}`;
      await this.redis!.del(key);
    }, undefined);
  }

  async getCustom(key: string): Promise<string | null> {
    return this.safeExec(async () => {
      return await this.redis!.get(key);
    }, null);
  }

  async setCustom(
    key: string,
    value: string,
    options?: { EX: number }
  ): Promise<void> {
    await this.safeExec(async () => {
      await this.redis!.set(key, value, options || {});
    }, undefined);
  }

  /**
   * Sovereign Cache: Resolve full tenant context by ID (admin/shared endpoints)
   */
  async resolveTenantById(
    tenantId: string
  ): Promise<Omit<TenantContext, 'executor'> | null> {
    // S1: Strict UUID Validation (Prevent 22P02)
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        tenantId
      )
    ) {
      return null;
    }

    // Attempt cache hit
    const cached = await this.getTenant(tenantId);
    if (cached) return cached;

    // Item 44 Protocol: Persistent Governance Resolution
    const [tenant] = await adminDb
      .select()
      .from(tenantsInGovernance)
      .where(eq(tenantsInGovernance.id, tenantId))
      .limit(1);

    if (!tenant) return null;

    const context: Omit<TenantContext, 'executor'> = {
      tenantId: tenant.id,
      schemaName: toSchemaName(tenant.subdomain),
      subdomain: tenant.subdomain,
      plan: tenant.plan as 'free' | 'basic' | 'pro' | 'enterprise',
      isActive: tenant.status === 'active',
      isSuspended: false,
      features: [], // Placeholder for future feature flags
      createdAt: new Date(tenant.createdAt),
    };

    // Populate cache for S1/S2 high-speed routing
    await this.setTenant(tenantId, context);
    return context;
  }

  /**
   * 🚀 Phase 2: Sovereign Translation Layer
   * Resolves any identifier (UUID or Subdomain) to a full TenantContext.
   * Implements dual-caching (ID and Subdomain) to minimize DB hits.
   */
  async resolveTenant(
    identifier: string
  ): Promise<Omit<TenantContext, 'executor'> | null> {
    if (!identifier) return null;

    // 1. Level 1 Cache: Direct Identifier Hit (ID or Subdomain)
    const cached = await this.getTenant(identifier);
    if (cached) return cached;

    // 2. Level 2 Resolution: UUID Direct Path
    if (isUuid(identifier)) {
      return this.resolveTenantById(identifier);
    }

    // 3. Level 3 Resolution: Subdomain/Domain DB Fallback
    const { or, sql: dbSql } = await import('@apex/db');
    const [tenant] = await adminDb
      .select()
      .from(tenantsInGovernance)
      .where(
        or(
          eq(tenantsInGovernance.subdomain, identifier),
          dbSql`custom_domain = ${identifier}`
        )
      )
      .limit(1);

    if (!tenant) return null;

    const context: Omit<TenantContext, 'executor'> = {
      tenantId: tenant.id,
      schemaName: toSchemaName(tenant.subdomain),
      subdomain: tenant.subdomain,
      plan: tenant.plan as 'free' | 'basic' | 'pro' | 'enterprise',
      isActive: tenant.status === 'active',
      isSuspended: false,
      features: [],
      createdAt: new Date(tenant.createdAt),
    };

    // 4. Dual-Cache Population (Soverign Speed Protocol)
    await Promise.all([
      this.setTenant(identifier, context), // Cache by Subdomain
      this.setTenant(tenant.id, context), // Cache by UUID
    ]);

    return context;
  }
}
