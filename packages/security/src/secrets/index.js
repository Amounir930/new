/**
 * P1: Secrets Rotation Implementation
 * Purpose: Automatic secrets rotation with zero-downtime
 */
import { createHash, randomBytes } from 'node:crypto';
/**
 * Generate cryptographically secure secret
 */
export function generateSecret(length = 64) {
    return randomBytes(length).toString('base64url');
}
/**
 * Hash secret for storage comparison (constant-time)
 */
export function hashSecret(secret) {
    return createHash('sha256').update(secret).digest('hex');
}
/**
 * Verify secret against hash (constant-time comparison)
 */
export function verifySecret(secret, hash) {
    const secretHash = hashSecret(secret);
    // Constant-time comparison to prevent timing attacks
    if (secretHash.length !== hash.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < secretHash.length; i++) {
        result |= secretHash.charCodeAt(i) ^ hash.charCodeAt(i);
    }
    return result === 0;
}
/**
 * Secrets Manager with Rotation
 */
export class SecretsManager {
    secrets = new Map();
    listeners = [];
    rotationTimers = new Map();
    DEFAULT_ROTATION_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days
    DEFAULT_GRACE_PERIOD = 24 * 60 * 60 * 1000; // 24 hours
    /**
     * Register a secret for automatic rotation
     */
    registerSecret(name, currentValue, options = {}) {
        const now = new Date();
        const config = {
            name,
            currentValue,
            rotationInterval: options.rotationInterval || this.DEFAULT_ROTATION_INTERVAL,
            gracePeriod: options.gracePeriod || this.DEFAULT_GRACE_PERIOD,
            lastRotatedAt: options.lastRotatedAt || now,
            nextRotationAt: options.nextRotationAt ||
                new Date(now.getTime() +
                    (options.rotationInterval || this.DEFAULT_ROTATION_INTERVAL)),
            previousValue: options.previousValue,
        };
        this.secrets.set(name, config);
        this.scheduleRotation(name);
        console.log(`[SecretsManager] Registered secret: ${name}, next rotation: ${config.nextRotationAt.toISOString()}`);
    }
    /**
     * Get current secret value
     */
    getSecret(name) {
        const config = this.secrets.get(name);
        return config?.currentValue;
    }
    /**
     * Validate a secret (checks current and grace period)
     */
    validateSecret(name, value) {
        const config = this.secrets.get(name);
        if (!config) {
            return { valid: false, status: 'invalid' };
        }
        // Check current secret
        if (value === config.currentValue) {
            return { valid: true, status: 'current' };
        }
        // Check previous secret (within grace period)
        if (config.previousValue && value === config.previousValue) {
            const gracePeriodEnd = new Date(config.lastRotatedAt.getTime() + config.gracePeriod);
            if (new Date() <= gracePeriodEnd) {
                console.warn(`[SecretsManager] Secret ${name} used old value (grace period)`);
                return { valid: true, status: 'grace' };
            }
        }
        return { valid: false, status: 'invalid' };
    }
    /**
     * Manually rotate a secret
     */
    rotateSecret(name, reason = 'manual') {
        const config = this.secrets.get(name);
        if (!config) {
            throw new Error(`Secret ${name} not found`);
        }
        const oldValue = config.currentValue;
        const newValue = generateSecret();
        const now = new Date();
        // Update config
        config.previousValue = oldValue;
        config.currentValue = newValue;
        config.lastRotatedAt = now;
        config.nextRotationAt = new Date(now.getTime() + config.rotationInterval);
        // Notify listeners
        const event = {
            secretName: name,
            oldValue,
            newValue,
            rotatedAt: now,
            reason,
        };
        for (const listener of this.listeners) {
            try {
                listener(event);
            }
            catch (error) {
                console.error('[SecretsManager] Listener error:', error);
            }
        }
        // Reschedule
        this.scheduleRotation(name);
        console.log(`[SecretsManager] Rotated secret: ${name}, reason: ${reason}`);
        return newValue;
    }
    /**
     * Schedule automatic rotation
     */
    scheduleRotation(name) {
        // Clear existing timer
        const existingTimer = this.rotationTimers.get(name);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        const config = this.secrets.get(name);
        if (!config)
            return;
        const now = new Date();
        const delay = config.nextRotationAt.getTime() - now.getTime();
        if (delay <= 0) {
            // Immediate rotation
            this.rotateSecret(name, 'scheduled');
        }
        else {
            // Schedule future rotation
            const timer = setTimeout(() => {
                this.rotateSecret(name, 'scheduled');
            }, Math.min(delay, 2147483647)); // Max setTimeout delay
            this.rotationTimers.set(name, timer);
        }
    }
    /**
     * Add rotation listener
     */
    onRotate(listener) {
        this.listeners.push(listener);
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
    /**
     * Get rotation status for all secrets
     */
    getRotationStatus() {
        const now = new Date();
        return Array.from(this.secrets.values()).map((config) => ({
            name: config.name,
            lastRotatedAt: config.lastRotatedAt,
            nextRotationAt: config.nextRotationAt,
            daysUntilRotation: Math.ceil((config.nextRotationAt.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)),
        }));
    }
    /**
     * Emergency rotation - rotate all secrets immediately
     */
    emergencyRotation() {
        console.warn('[SecretsManager] EMERGENCY ROTATION INITIATED');
        const rotated = [];
        for (const [name] of this.secrets) {
            this.rotateSecret(name, 'compromise');
            rotated.push(name);
        }
        return rotated;
    }
    /**
     * Cleanup timers on shutdown
     */
    dispose() {
        for (const timer of this.rotationTimers.values()) {
            clearTimeout(timer);
        }
        this.rotationTimers.clear();
        this.listeners = [];
    }
}
/**
 * Integration with HashiCorp Vault (optional)
 */
export class VaultIntegration {
    vaultAddr;
    vaultToken;
    constructor(vaultAddr, vaultToken) {
        this.vaultAddr = vaultAddr;
        this.vaultToken = vaultToken;
    }
    /**
     * Fetch secret from Vault
     */
    async fetchSecret(path) {
        const response = await fetch(`${this.vaultAddr}/v1/${path}`, {
            headers: {
                'X-Vault-Token': this.vaultToken,
            },
        });
        if (!response.ok) {
            throw new Error(`Vault error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return {
            value: data.data.data.value,
            metadata: data.data.metadata,
        };
    }
    /**
     * Update secret in Vault
     */
    async updateSecret(path, value) {
        const response = await fetch(`${this.vaultAddr}/v1/${path}`, {
            method: 'POST',
            headers: {
                'X-Vault-Token': this.vaultToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: { value } }),
        });
        if (!response.ok) {
            throw new Error(`Vault update error: ${response.status} ${response.statusText}`);
        }
    }
}
// Singleton instance
export const secretsManager = new SecretsManager();
export default {
    SecretsManager,
    secretsManager,
    generateSecret,
    hashSecret,
    verifySecret,
    VaultIntegration,
};
//# sourceMappingURL=index.js.map