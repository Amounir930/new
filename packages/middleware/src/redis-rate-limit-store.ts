// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { ConfigService } from '@apex/config';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { type RedisClientType, createClient } from 'redis';

/**
 * Redis Rate Limit Store
 * CRITICAL: Supports distributed deployments (Docker/K8s multi-instance)
 */
@Injectable()
export class RedisRateLimitStore
  implements OnModuleInit, OnApplicationShutdown {
  private client: RedisClientType | null = null;
  private connecting = false;
  private fallbackToMemory = false;
  private readonly memoryStore: Map<
    string,
    { count: number; resetTime: number; violations: number }
  > = new Map();
  private readonly logger = new Logger(RedisRateLimitStore.name);

  constructor(private readonly configService: ConfigService) { }

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
      return null; // Still connecting
    }

    // Try to connect to Redis
    if (!this.client && !this.fallbackToMemory) {
      await this.connect();
    }

    // Return client only if connected
    if (this.client?.isOpen) {
      return this.client;
    }

    return null;
  }

  private async connect(): Promise<void> {
    const redisUrl =
      this.configService.get('REDIS_URL') || 'redis://localhost:6379';

    this.logger.log(`Initializing Redis Rate Limit Store: ${redisUrl.split('@').pop()?.split('/')[0] || 'localhost'}`);

    try {
      this.connecting = true;
      this.client = createClient({ url: redisUrl });

      this.client.on('error', (err) => {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        if (isProduction) {
          console.error(
            '❌ S6 CRITICAL: Redis runtime error in production. Disabling memory fallback to ensure Fail-Closed security.',
            err
          );
          this.fallbackToMemory = false;
        } else {
          console.warn(
            '⚠️ S6: Redis runtime error, falling back to memory (development mode only).'
          );
          this.fallbackToMemory = true;
        }
      });

      await this.client.connect();
      this.fallbackToMemory = false;
    } catch {
      this.client = null; // CRITICAL: Reset client so we don't use a broken instance
      this.fallbackToMemory = false;

      // CRITICAL FIX (S6): In production, reject requests if Redis unavailable
      // In non-production, fallback to memory with warning
      const isProduction = this.configService.get('NODE_ENV') === 'production';
      if (isProduction) {
        console.error(
          '❌ S6 CRITICAL: Redis unavailable in production. Rate limiting cannot function securely. FAILING CLOSED.'
        );
        this.fallbackToMemory = false;
      } else {
        console.warn(
          '⚠️ S6: Redis unavailable, falling back to in-memory rate limiting (NOT for production multi-instance)'
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
    const client = await this.getClient();
    const now = Date.now();

    // CRITICAL FIX (S6/S12): In production, reject if Redis unavailable
    if (!client && this.configService.get('NODE_ENV') === 'production') {
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Rate limiting service unavailable',
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    if (client) {
      // S12 FIX: Sliding Window Log implementation using Redis Sorted Sets (ZSET)
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
    }

    // Memory fallback
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
      const violations = await client.get(violationKey);
      return violations ? Number.parseInt(violations, 10) : 0;
    }

    if (this.configService.get('NODE_ENV') === 'production') {
      return 999; // Conservatively assume high violations if Redis is down
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
      const violations = await client.incr(violationKey);
      await client.expire(violationKey, Math.ceil(blockDurationMs / 1000) * 5);
      return violations;
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
      const ttl = await client.ttl(blockKey);
      if (ttl > 0) {
        return { blocked: true, retryAfter: ttl };
      }
      return { blocked: false, retryAfter: 0 };
    }

    if (this.configService.get('NODE_ENV') === 'production') {
      return { blocked: true, retryAfter: 60 }; // Fail closed in prod
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
      await client.setEx(blockKey, Math.ceil(blockDurationMs / 1000), '1');
    } else {
      const record = this.memoryStore.get(key);
      if (record) {
        record.resetTime = Date.now() + blockDurationMs;
      }
    }
  }

  async getRemaining(key: string, limit: number): Promise<number> {
    const { count } = await this.increment(key, 0);
    return Math.max(0, limit - count + 1);
  }
}
