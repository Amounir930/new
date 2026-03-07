import { ConfigService, env } from '@apex/config';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
import type { TenantContext } from './connection-context';

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

  async getTenant(identifier: string): Promise<Omit<TenantContext, 'executor'> | null> {
    if (!this.redis.isOpen) return null;
    
    const key = `tenant:cache:${identifier.toLowerCase()}`;
    const data = await this.redis.get(key);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async setTenant(identifier: string, context: Omit<TenantContext, 'executor'>): Promise<void> {
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
}
