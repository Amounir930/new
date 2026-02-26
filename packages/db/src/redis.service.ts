import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';

/**
 * Enterprise Redis Singleton Service — V5
 * Mandate #25: Prevent connection exhaustion via singleton lifecycle.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private isClosing = false;

  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = createClient({ url });

    this.client.on('error', (err) => {
      if (!this.isClosing) {
        console.error('[Redis] Singleton Error:', err);
      }
    });
  }

  private subscribers: RedisClientType[] = [];

  async onModuleInit() {
    await this.client.connect();
    console.log('[Redis] Singleton Connected.');
  }

  async onModuleDestroy() {
    this.isClosing = true;
    // Fatal Mandate #37: Prevent connection leaks by closing all subscribers
    for (const sub of this.subscribers) {
      if (sub.isOpen) await sub.disconnect();
    }
    await this.client.disconnect();
  }

  /**
   * Safe access to native client
   */
  getClient(): RedisClientType {
    return this.client;
  }

  /**
   * Atomic Nonce Tracking (Audit 777 Point #3)
   */
  async setNonce(nonce: string, ttlSeconds = 300): Promise<boolean> {
    const key = `nonce:${nonce}`;
    const result = await this.client.set(key, '1', {
      NX: true,
      EX: ttlSeconds,
    });
    return result === 'OK';
  }

  /**
   * Pub/Sub: Publish
   */
  async publish(channel: string, message: string): Promise<number> {
    return await this.client.publish(channel, message);
  }

  /**
   * Pub/Sub: Subscribe (Note: Requires dedicated connection)
   * Fatal Mandate #37: Track duplicate clients for explicit cleanup.
   */
  async subscribe(channel: string, callback: (message: string) => void) {
    const subscriber = this.client.duplicate();
    await subscriber.connect();
    this.subscribers.push(subscriber as any);

    await subscriber.subscribe(channel, (message) => {
      callback(message);
    });

    subscriber.on('end', () => {
      this.subscribers = this.subscribers.filter(
        (s) => s !== (subscriber as any)
      );
    });
  }
}

/**
 * Global Singleton for non-DI contexts (e.g. core.ts)
 */
let globalRedis: RedisService | null = null;

export async function getGlobalRedis(): Promise<RedisService> {
  if (globalRedis) return globalRedis;
  globalRedis = new RedisService();
  await globalRedis.onModuleInit();
  return globalRedis;
}
