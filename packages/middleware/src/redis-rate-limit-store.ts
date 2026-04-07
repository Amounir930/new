// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { ConfigService } from '@apex/config/service';
import {
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';

/**
 * Redis Rate Limit Store
 * CRITICAL: Supports distributed deployments (Docker/K8s multi-instance)
 *
 * 🛡️ P0 FIX: All Redis operations are wrapped in try/catch.
 * Unhandled error events are caught to prevent process crashes.
 * Socket keepalive + pingInterval prevent idle connection drops.
 */
@Injectable()
export class RedisRateLimitStore
  implements OnModuleInit, OnApplicationShutdown
{
  private client: RedisClientType | null = null;
  private connecting = false;
  private fallbackToMemory = false;
  private readonly memoryStore: Map<
    string,
    { count: number; resetTime: number; violations: number }
  > = new Map();
  private readonly logger = new Logger(RedisRateLimitStore.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onApplicationShutdown() {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }

  async getClient(): Promise<RedisClientType | null> {
    if (this.client?.isOpen) {
      return this.client;
    }

    if (this.connecting) {
      return null;
    }

    if (!this.client && !this.fallbackToMemory) {
      await this.connect();
    }

    if (this.client?.isOpen) {
      return this.client;
    }

    return null;
  }

  private async connect(): Promise<void> {
    const redisUrl =
      this.configService.get('REDIS_URL') || 'redis://localhost:6379';

    this.logger.log(
      `Initializing Redis Rate Limit Store: ${redisUrl.split('@').pop()?.split('/')[0] || 'localhost'}`
    );

    try {
      this.connecting = true;

      // P0 FIX: Socket keepalive + timeouts to prevent unbounded hangs and silent drops
      this.client = createClient({
        url: redisUrl,
        socket: {
          keepAlive: 5000,
          connectTimeout: 5000,
          timeout: 5000,
          reconnectStrategy: (retries) => Math.min(retries * 1000, 30000),
        },
        pingInterval: 10000,
      });

      // 🛡️ P0 FIX: Proper error handling — use logger, NOT process.stdout.write
      this.client.on('error', (err) => {
        this.logger.error(`Redis rate limit error: ${err.message}`);
      });

      this.client.on('close', () => {
        this.logger.warn(
          'Redis rate limit connection closed — will reconnect on next request'
        );
        this.client = null;
      });

      // P0 FIX: Explicit timeout on connect() to prevent indefinite hangs
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Redis connection timed out after 5s')),
          5000
        )
      );
      await Promise.race([connectPromise, timeoutPromise]);
      this.fallbackToMemory = false;
    } catch (_err) {
      this.client = null;
      this.fallbackToMemory = false;

      const isProduction = this.configService.get('NODE_ENV') === 'production';
      if (isProduction) {
        this.logger.error(
          'S6: Redis unavailable in production. Rate limiting disabled. Requests will proceed without rate limits.'
        );
      } else {
        this.logger.warn(
          'S6: Redis unavailable, falling back to in-memory rate limiting (NOT for production multi-instance)'
        );
        this.fallbackToMemory = true;
      }
    } finally {
      this.connecting = false;
    }
  }

  async increment(
    key: string,
    windowMs: number
  ): Promise<{ count: number; ttl: number }> {
    const now = Date.now();

    // Try Redis first
    const client = await this.getClient();
    if (client) {
      try {
        const multi = client.multi();
        const minScore = now - windowMs;
        const uniqueValue = `${now}-${Math.random().toString(36).substring(2, 9)}`;

        multi.zRemRangeByScore(key, 0, minScore);
        multi.zAdd(key, { score: now, value: uniqueValue });
        multi.zCard(key);
        multi.pExpire(key, windowMs);

        const results = await multi.exec();
        const count = (results[2] as number) || 1;

        return { count, ttl: Math.ceil(windowMs / 1000) };
      } catch (err) {
        this.logger.warn(
          `Redis increment failed for ${key}: ${err instanceof Error ? err.message : 'unknown'}`
        );
        // Fall through to memory fallback
      }
    }

    // Memory fallback (non-production or Redis failure)
    const existing = this.memoryStore.get(key);

    if (!existing || now > existing.resetTime) {
      const newRecord = {
        count: 1,
        resetTime: now + windowMs,
        violations: 0,
      };
      this.memoryStore.set(key, newRecord);
      return { count: 1, ttl: Math.ceil(windowMs / 1000) };
    }

    existing.count++;
    return {
      count: existing.count,
      ttl: Math.ceil((existing.resetTime - now) / 1000),
    };
  }

  async getViolations(key: string): Promise<number> {
    const violationKey = `${key}:violations`;
    const client = await this.getClient();

    if (client) {
      try {
        const violations = await client.get(violationKey);
        return violations ? Number.parseInt(violations, 10) : 0;
      } catch {
        // Fall through
      }
    }

    const record = this.memoryStore.get(key);
    return record?.violations || 0;
  }

  async incrementViolations(
    key: string,
    blockDurationMs: number
  ): Promise<number> {
    const violationKey = `${key}:violations`;
    const client = await this.getClient();

    if (client) {
      try {
        const violations = await client.incr(violationKey);
        await client.expire(
          violationKey,
          Math.ceil(blockDurationMs / 1000) * 5
        );
        return violations;
      } catch {
        // Fall through
      }
    }

    const record = this.memoryStore.get(key);
    if (record) {
      record.violations++;
      return record.violations;
    }
    return 1;
  }

  async isBlocked(
    key: string,
    _blockDurationMs: number
  ): Promise<{ blocked: boolean; retryAfter: number }> {
    const blockKey = `${key}:blocked`;
    const client = await this.getClient();

    if (client) {
      try {
        const ttl = await client.ttl(blockKey);
        if (ttl > 0) {
          return { blocked: true, retryAfter: ttl };
        }
        return { blocked: false, retryAfter: 0 };
      } catch {
        // Fall through
      }
    }

    const record = this.memoryStore.get(key);
    if (record && record.violations >= 5) {
      const now = Date.now();
      const blocked = now < record.resetTime;
      return {
        blocked,
        retryAfter: blocked ? Math.ceil((record.resetTime - now) / 1000) : 0,
      };
    }
    return { blocked: false, retryAfter: 0 };
  }

  async block(key: string, blockDurationMs: number): Promise<void> {
    const blockKey = `${key}:blocked`;
    const client = await this.getClient();

    if (client) {
      try {
        await client.setEx(blockKey, Math.ceil(blockDurationMs / 1000), '1');
        return;
      } catch {
        // Fall through
      }
    }

    const record = this.memoryStore.get(key);
    if (record) {
      record.resetTime = Date.now() + blockDurationMs;
    }
  }

  async getRemaining(key: string, limit: number): Promise<number> {
    const { count } = await this.increment(key, 0);
    return Math.max(0, limit - count + 1);
  }
}
