import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { RedisRateLimitStore } from './redis-rate-limit-store';

describe('S6 Fail-Closed Behavior (Production)', () => {
    let store: RedisRateLimitStore;

    beforeEach(() => {
        // Mock ConfigService
        const mockConfig = {
            get: mock().mockReturnValue('redis://localhost:6379')
        };
        store = new RedisRateLimitStore(mockConfig as any);
    });

    it('should reject requests (503) if Redis is unreachable in production', async () => {
        process.env.NODE_ENV = 'production';

        // Force Redis client to be null/closed
        // @ts-ignore - access private
        store.client = null;
        // @ts-ignore
        store.fallbackToMemory = false;

        try {
            await store.increment('test-ip', 60000);
            expect(true).toBe(false); // Should not reach here
        } catch (e: any) {
            expect(e.status).toBe(503);
            expect(e.message).toContain('Rate limiting service unavailable');
        }
    });

    it('should allow memory fallback in non-production', async () => {
        process.env.NODE_ENV = 'development';

        // @ts-ignore
        store.client = null;
        // @ts-ignore
        store.fallbackToMemory = true;

        const result = await store.increment('test-ip', 60000);
        expect(result.count).toBe(1);
        // Should stay at 1 for new key
    });
});
