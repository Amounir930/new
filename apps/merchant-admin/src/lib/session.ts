'use server';

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

/**
 * S8/S15 HOTFIX: Server-side session with FULL verification
 *
 * THREE layers of defense:
 * 1. jwtVerify() — cryptographic signature check
 * 2. Expiration — built into jwtVerify via exp claim
 * 3. Steel Control — checks Redis singleton for tenant suspension lock
 */
export interface UserSession {
    email: string;
    role: string;
    tenantId: string;
    name?: string;
}

// ═══════════════════════════════════════════════════════════════
// Redis Singleton — NEVER open/close per request!
// Connection Churn = DDoS on your own Redis server.
// ═══════════════════════════════════════════════════════════════
let redisClient: any = null;
let redisConnecting: Promise<any> | null = null;

async function getRedisClient() {
    if (redisClient?.isOpen) return redisClient;

    // Prevent multiple simultaneous connection attempts
    if (redisConnecting) return redisConnecting;

    redisConnecting = (async () => {
        try {
            const redisUrl = process.env.REDIS_URL;
            if (!redisUrl) return null;

            const { createClient } = await import('redis');
            redisClient = createClient({
                url: redisUrl,
                socket: {
                    reconnectStrategy: (retries: number) => {
                        if (retries > 3) return new Error('Redis reconnect limit');
                        return Math.min(retries * 100, 1000);
                    },
                },
            });

            redisClient.on('error', (err: Error) => {
                console.error('Redis singleton error:', err.message);
            });

            await redisClient.connect();
            return redisClient;
        } catch (error) {
            console.error('Redis singleton connection failed:', error);
            redisClient = null;
            return null;
        } finally {
            redisConnecting = null;
        }
    })();

    return redisConnecting;
}

export async function getSession(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('adm_tkn')?.value;

    if (!token) return null;

    try {
        // Layer 1: JWT signature verification
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('S1 Violation: JWT_SECRET not available');
            return null;
        }

        const encoder = new TextEncoder();
        const { payload } = await jwtVerify(token, encoder.encode(secret));

        const tenantId = payload.tenantId as string;
        const iat = payload.iat as number | undefined;

        // Layer 3: Steel Control — check Redis for tenant suspension
        if (tenantId && tenantId !== 'system') {
            const isLocked = await checkSteelControl(tenantId, iat);
            if (isLocked) {
                console.warn(`Steel Control: Tenant ${tenantId} suspended. Session rejected.`);
                return null;
            }
        }

        return {
            email: payload.email as string,
            role: payload.role as string,
            tenantId,
            name: (payload.name as string) || (payload.email as string).split('@')[0],
        };
    } catch {
        return null;
    }
}

/**
 * Steel Control: Check Redis singleton for tenant lock
 * Uses the GLOBAL redis client — no connect/disconnect per call.
 */
async function checkSteelControl(tenantId: string, iat?: number): Promise<boolean> {
    try {
        const client = await getRedisClient();
        if (!client) return false; // Redis not configured — fail-open

        const lockData = await client.get(`tenant:lock:${tenantId}`);
        if (!lockData) return false;

        const lock = JSON.parse(lockData);
        if (!lock.isLocked) return false;

        // Surgical invalidation: block tokens issued BEFORE the lock
        if (iat && lock.lockedAt) {
            const lockedAtSeconds = Math.floor(new Date(lock.lockedAt).getTime() / 1000);
            return iat < lockedAtSeconds;
        }

        return true; // Locked and no iat to compare → block
    } catch (error) {
        console.error('Steel Control check failed:', error);
        return true; // Fail-CLOSED: block if can't verify
    }
}
