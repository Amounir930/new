import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'node:crypto';
import { type ConfigService, type EnvConfig, env } from '@apex/config';
import { Injectable } from '@nestjs/common';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

/**
 * S7: Global Encryption Service (AES-256-GCM)
 * Standards-body compliant implementation for PII protection.
 */
@Injectable()
export class EncryptionService {
  private readonly masterKey: Buffer;
  private readonly blindIndexPepper: string;
  private readonly apiKeySecret: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly config: Pick<ConfigService, 'get' | 'getWithDefault'>
  ) {
    const key = this.config.get('ENCRYPTION_MASTER_KEY');
    const pepper = this.config.get('BLIND_INDEX_PEPPER');
    const secret = this.config.get('API_KEY_SECRET');

    this.isProduction = this.config.get('NODE_ENV') === 'production';

    this.validateConfig(key, pepper, secret);
    this.masterKey = this.prepareMasterKey(key);
    this.blindIndexPepper = pepper || 'test-pepper';
    this.apiKeySecret = secret || 'test-secret';
  }

  private validateConfig(key?: string, pepper?: string, secret?: string) {
    if (!this.isProduction) return;

    if (!key)
      throw new Error('S1 Violation: ENCRYPTION_MASTER_KEY is required');
    if (key.length < 32)
      throw new Error(
        'S1 Violation: ENCRYPTION_MASTER_KEY must be at least 32 characters'
      );
    if (!pepper)
      throw new Error('S1 Violation: BLIND_INDEX_PEPPER is required');
    if (!secret) throw new Error('S1 Violation: API_KEY_SECRET is required');
  }

  private prepareMasterKey(key?: string): Buffer {
    // Key must be exactly 32 bytes for AES-256
    const keyStr = key || 'test-key-32-characters-long-12345';
    const keyBuffer = Buffer.from(keyStr, 'utf8');

    if (keyBuffer.length < 32) {
      if (this.isProduction) {
        throw new Error(
          'S7 Violation: Encryption key must be at least 32 bytes'
        );
      }
      // Pad with zeros for dev/test
      const padded = Buffer.alloc(32);
      keyBuffer.copy(padded);
      return padded;
    }
    return keyBuffer.subarray(0, 32);
  }

  /**
   * Encrypts a string using AES-256-GCM.
   */
  encrypt(value: string): EncryptedData {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag,
    };
  }

  /**
   * Decrypts AES-256-GCM encrypted data.
   */
  decrypt(data: EncryptedData): string {
    try {
      if (!data.encrypted || !data.iv || !data.tag) {
        throw new Error('S7 Violation: Malformed encrypted data structure');
      }

      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.masterKey,
        Buffer.from(data.iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(data.tag, 'hex'));

      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err) {
      if (err instanceof Error && err.message.includes('S7 Violation')) {
        throw err;
      }
      throw new Error(
        `S7 Violation: Decryption failed - ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generates a deterministic hash for searching encrypted fields (Blind Index).
   */
  hashSensitiveData(value: string, salt?: string): string {
    const finalSalt = salt
      ? `${this.blindIndexPepper}:${salt}`
      : this.blindIndexPepper;
    return createHmac('sha256', finalSalt)
      .update(value.toLowerCase().trim())
      .digest('hex');
  }

  /**
   * Generates a secure random API key.
   */
  generateApiKey(): string {
    return `apex_${randomBytes(32).toString('base64url')}`;
  }

  /**
   * Hashes an API key for storage.
   */
  hashApiKey(apiKey: string): string {
    return createHmac('sha256', this.apiKeySecret).update(apiKey).digest('hex');
  }

  /**
   * Masks sensitive strings for UI display.
   */
  mask(value: string, visibleChars = 4): string {
    if (!value || value.length <= visibleChars * 2) return '****';
    const start = value.slice(0, visibleChars);
    const end = value.slice(-visibleChars);
    const middle = '*'.repeat(value.length - visibleChars * 2);
    return `${start}${middle}${end}`;
  }
}
// --- Top-level helper functions for non-DI context (BC) ---

/**
 * Creates a standalone service instance for one-off operations.
 * This ensures S1/S7 compliance even in non-DI contexts.
 */
function getStandaloneService(key?: string): EncryptionService {
  const values: Partial<EnvConfig> = {
    ENCRYPTION_MASTER_KEY: key || env.ENCRYPTION_MASTER_KEY,
    BLIND_INDEX_PEPPER: env.BLIND_INDEX_PEPPER,
    API_KEY_SECRET: env.API_KEY_SECRET,
    NODE_ENV: env.NODE_ENV,
  };

  const standaloneConfig: Pick<ConfigService, 'get' | 'getWithDefault'> = {
    get: <K extends keyof EnvConfig>(k: K): EnvConfig[K] => {
      return values[k] as EnvConfig[K];
    },
    getWithDefault: <K extends keyof EnvConfig>(
      k: K,
      defaultValue: EnvConfig[K]
    ): EnvConfig[K] => {
      const val = values[k];
      return (val !== undefined ? val : defaultValue) as EnvConfig[K];
    },
  };

  return new EncryptionService(standaloneConfig);
}

const globalEncryption = getStandaloneService();

/**
 * Legacy top-level encrypt.
 * If a key is provided, it uses a temporary service instance.
 */
export function encrypt(value: string, key?: string): EncryptedData {
  if (key) return getStandaloneService(key).encrypt(value);
  return globalEncryption.encrypt(value);
}

/**
 * Legacy top-level decrypt.
 * If a key is provided, it uses a temporary service instance.
 */
export function decrypt(data: EncryptedData, key?: string): string {
  if (key) return getStandaloneService(key).decrypt(data);
  return globalEncryption.decrypt(data);
}

/**
 * Top-level hashSensitiveData.
 * Salt is supported as second argument.
 */
export function hashSensitiveData(
  value: string,
  salt?: string,
  pepper?: string
): string {
  if (pepper)
    return getStandaloneService(pepper).hashSensitiveData(value, salt);
  return globalEncryption.hashSensitiveData(value, salt);
}

export function generateApiKey(): string {
  return globalEncryption.generateApiKey();
}

export function hashApiKey(apiKey: string): string {
  return globalEncryption.hashApiKey(apiKey);
}

export function maskSensitive(value: string, visibleChars = 4): string {
  return globalEncryption.mask(value, visibleChars);
}
