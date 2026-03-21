import { env } from '@apex/config';
import { adminDb, eq, tenantsInGovernance } from '@apex/db';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
import type { TenantContext } from './connection-context';
import { isUuid } from './utils';

@Injectable()
export class TenantCacheService implements OnModuleInit {
  private redis: RedisClientType;
  private readonly logger = new Logger(TenantCacheService.name);
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor() {
    const redisUrl = env.REDIS_URL || 'redis://localhost:6379';
    this.redis = createClient({ url: redisUrl });
  }

  async onModuleInit() {
    try {
      await this.redis.connect();
      this.logger.log('Tenant Cache: Redis connection established');
    } catch (err) {
      this.logger.error('Tenant Cache: Redis connection failed', err);
    }
  }

  async getTenant(
    identifier: string
  ): Promise<Omit<TenantContext, 'executor'> | null> {
    if (!this.redis.isOpen) return null;

    const key = `tenant:cache:${identifier.toLowerCase()}`;
    const data = await this.redis.get(key);

    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      // Item 44 Protocol: Restore Date objects from JSON
      if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
      return parsed;
    } catch {
      return null;
    }
  }

  async setTenant(
    identifier: string,
    context: Omit<TenantContext, 'executor'>
  ): Promise<void> {
    if (!this.redis.isOpen) return;

    const key = `tenant:cache:${identifier.toLowerCase()}`;
    await this.redis.set(key, JSON.stringify(context), {
      EX: this.CACHE_TTL,
    });
  }

  async invalidateTenant(identifier: string): Promise<void> {
    if (!this.redis.isOpen) return;
    const key = `tenant:cache:${identifier.toLowerCase()}`;
    await this.redis.del(key);
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
      schemaName: `tenant_${tenant.subdomain}`,
      subdomain: tenant.subdomain,
      plan: (tenant.plan as any) || 'free',
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
      schemaName: `tenant_${tenant.subdomain
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')}`,
      subdomain: tenant.subdomain,
      plan: (tenant.plan as any) || 'free',
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
