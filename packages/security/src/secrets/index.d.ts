/**
 * P1: Secrets Rotation Implementation
 * Purpose: Automatic secrets rotation with zero-downtime
 */
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
export declare function generateSecret(length?: number): string;
/**
 * Hash secret for storage comparison (constant-time)
 */
export declare function hashSecret(secret: string): string;
/**
 * Verify secret against hash (constant-time comparison)
 */
export declare function verifySecret(secret: string, hash: string): boolean;
/**
 * Secrets Manager with Rotation
 */
export declare class SecretsManager {
    private secrets;
    private listeners;
    private rotationTimers;
    private readonly DEFAULT_ROTATION_INTERVAL;
    private readonly DEFAULT_GRACE_PERIOD;
    /**
     * Register a secret for automatic rotation
     */
    registerSecret(name: string, currentValue: string, options?: Partial<Omit<SecretConfig, 'name' | 'currentValue'>>): void;
    /**
     * Get current secret value
     */
    getSecret(name: string): string | undefined;
    /**
     * Validate a secret (checks current and grace period)
     */
    validateSecret(name: string, value: string): {
        valid: boolean;
        status: 'current' | 'grace' | 'invalid';
    };
    /**
     * Manually rotate a secret
     */
    rotateSecret(name: string, reason?: 'scheduled' | 'manual' | 'compromise'): string;
    /**
     * Schedule automatic rotation
     */
    private scheduleRotation;
    /**
     * Add rotation listener
     */
    onRotate(listener: RotationListener): () => void;
    /**
     * Get rotation status for all secrets
     */
    getRotationStatus(): Array<{
        name: string;
        lastRotatedAt: Date;
        nextRotationAt: Date;
        daysUntilRotation: number;
    }>;
    /**
     * Emergency rotation - rotate all secrets immediately
     */
    emergencyRotation(): string[];
    /**
     * Cleanup timers on shutdown
     */
    dispose(): void;
}
/**
 * Integration with HashiCorp Vault (optional)
 */
export declare class VaultIntegration {
    private vaultAddr;
    private vaultToken;
    constructor(vaultAddr: string, vaultToken: string);
    /**
     * Fetch secret from Vault
     */
    fetchSecret(path: string): Promise<{
        value: string;
        metadata: any;
    }>;
    /**
     * Update secret in Vault
     */
    updateSecret(path: string, value: string): Promise<void>;
}
export declare const secretsManager: SecretsManager;
declare const _default: {
    SecretsManager: typeof SecretsManager;
    secretsManager: SecretsManager;
    generateSecret: typeof generateSecret;
    hashSecret: typeof hashSecret;
    verifySecret: typeof verifySecret;
    VaultIntegration: typeof VaultIntegration;
};
export default _default;
//# sourceMappingURL=index.d.ts.map