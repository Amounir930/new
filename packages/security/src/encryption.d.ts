/**
 * S7: Encryption Service
 * Constitution Reference: architecture.md (S7 Protocol)
 * Purpose: AES-256-GCM encryption for PII and sensitive data at rest
 */
export interface EncryptedData {
    encrypted: string;
    iv: string;
    tag: string;
    salt: string;
}
/**
 * Encrypts sensitive data using AES-256-GCM
 */
export declare function encrypt(plaintext: string, masterKey: string): EncryptedData;
/**
 * Decrypts data encrypted with encrypt()
 */
export declare function decrypt(encryptedData: EncryptedData, masterKey: string, fallbackKey?: string): string;
/**
 * Hash for API keys (one-way)
 */
export declare function hashApiKey(apiKey: string): string;
/**
 * S7: Blind Index Hash (SHA-256)
 * Generates deterministic hash for searching encrypted fields (email, phone).
 * Uses a separate secret (BLIND_INDEX_PEPPER) to prevent rainbow table attacks.
 */
export declare function hashSensitiveData(value: string): string;
/**
 * Generates secure random API key
 */
export declare function generateApiKey(): string;
/**
 * Masks sensitive data for display (e.g., credit cards)
 */
export declare function maskSensitive(value: string, visibleChars?: number): string;
export declare class EncryptionService {
    private readonly masterKey;
    constructor();
    private validateMasterKey;
    encrypt(plaintext: string): EncryptedData;
    decrypt(encryptedData: EncryptedData, fallbackKey?: string): string;
    hashApiKey(apiKey: string): string;
    hashSensitiveData(value: string): string;
    generateApiKey(): string;
    mask(value: string, visibleChars?: number): string;
}
//# sourceMappingURL=encryption.d.ts.map