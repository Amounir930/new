// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { ConfigService } from '@apex/config/service';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';

/**
 * S15: Security Service for "Steel Control"
 * Manages instant tenant locks and security state in Redis.
 *
 * 🛡️ P0 FIX: All Redis operations are wrapped in try/catch with graceful degradation.
 * If Redis is unavailable, lock/unlock operations are logged but do NOT crash the API.
 */
@Injectable()
export class SecurityService implements OnModuleInit {
  private redis: RedisClientType | null = null;
  private connecting = false;
  private readonly logger = new Logger(SecurityService.name);

  constructor(private readonly config: Pick<ConfigService, 'get'>) {
    const redisUrl = this.config.get('REDIS_URL') || 'redis://localhost:6379';
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
      this.logger.warn(`Steel Control Redis error: ${err.message}`);
    });

    this.redis.on('close', () => {
      this.logger.warn('Steel Control Redis closed — attempting reconnect');
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
      this.logger.log('Steel Control: Redis connection established');
    } catch (err) {
      this.logger.error(
        `Steel Control: Redis connection failed — ${err instanceof Error ? err.message : 'unknown'}`
      );
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
        this.logger.log('Steel Control: Redis reconnected successfully');
      }
    } catch (err) {
      this.logger.warn(
        `Steel Control: Redis reconnect failed — ${err instanceof Error ? err.message : 'unknown'}`
      );
      setTimeout(() => this.attemptReconnect(), 5000);
    }
  }

  private async safeExec<T>(
    operation: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    if (!this.redis?.isOpen) return fallback;
    try {
      return await operation();
    } catch (err) {
      this.logger.warn(
        `Steel Control: Redis operation failed — ${err instanceof Error ? err.message : 'unknown'}`
      );
      this.attemptReconnect();
      return fallback;
    }
  }

  /**
   * Set or release a global lock on a tenant.
   * Gracefully degrades if Redis is unavailable.
   */
  async setTenantLock(subdomain: string, isLocked: boolean) {
    const key = `tenant:lock:${subdomain.toLowerCase()}`;

    if (isLocked) {
      const lockedAt = Math.floor(Date.now() / 1000);
      await this.safeExec(
        async () => {
          await this.redis!.set(key, JSON.stringify({ locked: true, lockedAt }));
        },
        undefined
      );
      this.logger.warn(
        `STEEL CONTROL: Tenant ${subdomain} LOCKED at ${lockedAt}${!this.redis?.isOpen ? ' (Redis unavailable — lock may not persist)' : ''}`
      );
    } else {
      await this.safeExec(
        async () => {
          await this.redis!.del(key);
        },
        undefined
      );
      this.logger.log(`STEEL CONTROL: Tenant ${subdomain} RELEASED`);
    }
  }

  /**
   * Get the lock status for a tenant.
   * Returns null if Redis is unavailable or tenant is not locked.
   */
  async getTenantLock(
    subdomain: string
  ): Promise<{ locked: boolean; lockedAt: number } | null> {
    return this.safeExec(async () => {
      const key = `tenant:lock:${subdomain.toLowerCase()}`;
      const data = await this.redis!.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }, null);
  }
}
