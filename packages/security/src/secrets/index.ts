/**
 * P1: Secrets Rotation Implementation
 * Purpose: Automatic secrets rotation with zero-downtime
 */

import { createHash, randomBytes } from 'node:crypto';

export interface SecretConfig {
  /** Secret name/identifier */
  name: string;
  /** Current secret value */
  currentValue: string;
  /** Previous secret value (for rotation period) */
  previousValue?: string;
  /** Rotation interval in milliseconds */
  rotationInterval: number;
  /** Grace period where old secret is still valid (ms) */
  gracePeriod: number;
  /** Last rotation timestamp */
  lastRotatedAt: Date;
  /** Next scheduled rotation timestamp */
  nextRotationAt: Date;
}

/**
 * S15: Vault Secret Structure
 */
export interface VaultSecretData {
  value: string;
  metadata?: Record<string, unknown>;
}

export interface VaultResponse {
  data: {
    data: VaultSecretData;
    metadata?: Record<string, unknown>;
  };
}

export interface SecretRotationEvent {
  secretName: string;
  oldValue: string;
  newValue: string;
  rotatedAt: Date;
  reason: 'scheduled' | 'manual' | 'compromise';
}

export type RotationListener = (event: SecretRotationEvent) => void;

/**
 * Generate cryptographically secure secret
 */
export function generateSecret(length = 64): string {
  return randomBytes(length).toString('base64url');
}

/**
 * Hash secret for storage comparison (constant-time)
 */
export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

/**
 * Verify secret against hash (constant-time comparison)
 */
export function verifySecret(secret: string, hash: string): boolean {
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
  private secrets: Map<string, SecretConfig> = new Map();
  private listeners: RotationListener[] = [];
  private rotationTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEFAULT_ROTATION_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly DEFAULT_GRACE_PERIOD = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Register a secret for automatic rotation
   */
  registerSecret(
    name: string,
    currentValue: string,
    options: Partial<Omit<SecretConfig, 'name' | 'currentValue'>> = {}
  ): void {
    const now = new Date();
    const config: SecretConfig = {
      name,
      currentValue,
      rotationInterval:
        options.rotationInterval || this.DEFAULT_ROTATION_INTERVAL,
      gracePeriod: options.gracePeriod || this.DEFAULT_GRACE_PERIOD,
      lastRotatedAt: options.lastRotatedAt || now,
      nextRotationAt:
        options.nextRotationAt ||
        new Date(
          now.getTime() +
            (options.rotationInterval || this.DEFAULT_ROTATION_INTERVAL)
        ),
      previousValue: options.previousValue,
    };

    this.secrets.set(name, config);
    this.scheduleRotation(name);

    console.log(
      `[SecretsManager] Registered secret: ${name}, next rotation: ${config.nextRotationAt.toISOString()}`
    );
  }

  /**
   * Get current secret value
   */
  getSecret(name: string): string | undefined {
    const config = this.secrets.get(name);
    return config?.currentValue;
  }

  /**
   * Validate a secret (checks current and grace period)
   */
  validateSecret(
    name: string,
    value: string
  ): { valid: boolean; status: 'current' | 'grace' | 'invalid' } {
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
      const gracePeriodEnd = new Date(
        config.lastRotatedAt.getTime() + config.gracePeriod
      );

      if (new Date() <= gracePeriodEnd) {
        console.warn(
          `[SecretsManager] Secret ${name} used old value (grace period)`
        );
        return { valid: true, status: 'grace' };
      }
    }

    return { valid: false, status: 'invalid' };
  }

  /**
   * Manually rotate a secret
   */
  rotateSecret(
    name: string,
    reason: 'scheduled' | 'manual' | 'compromise' = 'manual'
  ): string {
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
    const event: SecretRotationEvent = {
      secretName: name,
      oldValue,
      newValue,
      rotatedAt: now,
      reason,
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
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
  private scheduleRotation(name: string): void {
    // Clear existing timer
    const existingTimer = this.rotationTimers.get(name);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const config = this.secrets.get(name);
    if (!config) return;

    const now = new Date();
    const delay = config.nextRotationAt.getTime() - now.getTime();

    if (delay <= 0) {
      // Immediate rotation
      this.rotateSecret(name, 'scheduled');
    } else {
      // Schedule future rotation
      const timer = setTimeout(
        () => {
          this.rotateSecret(name, 'scheduled');
        },
        Math.min(delay, 2147483647)
      ); // Max setTimeout delay

      this.rotationTimers.set(name, timer);
    }
  }

  /**
   * Add rotation listener
   */
  onRotate(listener: RotationListener): () => void {
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
  getRotationStatus(): Array<{
    name: string;
    lastRotatedAt: Date;
    nextRotationAt: Date;
    daysUntilRotation: number;
  }> {
    const now = new Date();

    return Array.from(this.secrets.values()).map((config) => ({
      name: config.name,
      lastRotatedAt: config.lastRotatedAt,
      nextRotationAt: config.nextRotationAt,
      daysUntilRotation: Math.ceil(
        (config.nextRotationAt.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }));
  }

  /**
   * Emergency rotation - rotate all secrets immediately
   */
  emergencyRotation(): string[] {
    console.warn('[SecretsManager] EMERGENCY ROTATION INITIATED');

    const rotated: string[] = [];

    for (const [name] of this.secrets) {
      this.rotateSecret(name, 'compromise');
      rotated.push(name);
    }

    return rotated;
  }

  /**
   * Cleanup timers on shutdown
   */
  dispose(): void {
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
  private vaultAddr: string;
  private vaultToken: string;

  constructor(vaultAddr: string, vaultToken: string) {
    this.vaultAddr = vaultAddr;
    this.vaultToken = vaultToken;
  }

  /**
   * Fetch secret from Vault
   */
  async fetchSecret(path: string): Promise<VaultSecretData> {
    const response = await fetch(`${this.vaultAddr}/v1/${path}`, {
      headers: {
        'X-Vault-Token': this.vaultToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Vault error: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as VaultResponse;
    return {
      value: json.data.data.value,
      metadata: json.data.data.metadata || json.data.metadata || {},
    };
  }

  /**
   * Update secret in Vault
   */
  async updateSecret(path: string, value: string): Promise<void> {
    const response = await fetch(`${this.vaultAddr}/v1/${path}`, {
      method: 'POST',
      headers: {
        'X-Vault-Token': this.vaultToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: { value } }),
    });

    if (!response.ok) {
      throw new Error(
        `Vault update error: ${response.status} ${response.statusText}`
      );
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
