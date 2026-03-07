// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { ConfigService } from '@apex/config';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';

/**
 * S15: Security Service for "Steel Control"
 * Manages instant tenant locks and security state in Redis
 */
@Injectable()
export class SecurityService implements OnModuleInit {
  private redis: RedisClientType;
  private readonly logger = new Logger(SecurityService.name);

  constructor(private readonly config: Pick<ConfigService, 'get'>) {
    const redisUrl = this.config.get('REDIS_URL') || 'redis://localhost:6379';
    this.redis = createClient({ url: redisUrl });
  }

  async onModuleInit() {
    try {
      await this.redis.connect();
      this.logger.log('Steel Control: Redis connection established');
    } catch (err) {
      this.logger.error('Steel Control: Redis connection failed', err);
    }
  }

  /**
   * Set or release a global lock on a tenant
   */
  async setTenantLock(subdomain: string, isLocked: boolean) {
    const key = `tenant:lock:${subdomain.toLowerCase()}`;
    if (isLocked) {
      // Store current timestamp for JWT invalidation (iat comparison)
      const lockedAt = Math.floor(Date.now() / 1000);
      await this.redis.set(key, JSON.stringify({ locked: true, lockedAt }));
      this.logger.warn(
        `STEEL CONTROL: Tenant ${subdomain} LOCKED at ${lockedAt}`
      );
    } else {
      await this.redis.del(key);
      this.logger.log(`STEEL CONTROL: Tenant ${subdomain} RELEASED`);
    }
  }

  /**
   * Get the lock status for a tenant
   * Returns null if not locked, otherwise the lock data
   */
  async getTenantLock(
    subdomain: string
  ): Promise<{ locked: boolean; lockedAt: number } | null> {
    const key = `tenant:lock:${subdomain.toLowerCase()}`;
    const data = await this.redis.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}
