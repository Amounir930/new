import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'node:crypto';
import { ConfigService } from '@apex/config';
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

  constructor(private readonly config: ConfigService) {
    const key = this.config.get('ENCRYPTION_MASTER_KEY');
    const pepper = this.config.get('BLIND_INDEX_PEPPER');
    const secret = this.config.get('API_KEY_SECRET');
    const nodeEnv = this.config.get('NODE_ENV');
    this.isProduction = nodeEnv === 'production';

    // S1: Strict Environment Validation
    if (this.isProduction) {
      if (!key)
        throw new Error('S1 Violation: ENCRYPTION_MASTER_KEY is required');
      if (!pepper)
        throw new Error('S1 Violation: BLIND_INDEX_PEPPER is required');
      if (!secret) throw new Error('S1 Violation: API_KEY_SECRET is required');
    }

    // Key must be 32 bytes for AES-256
    this.masterKey = Buffer.from(
      key || 'test-key-32-characters-long-12345',
      'utf8'
    ).slice(0, 32);
    this.blindIndexPepper = pepper || 'test-pepper';
    this.apiKeySecret = secret || 'test-secret';
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
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.masterKey,
      Buffer.from(data.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(data.tag, 'hex'));

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
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

const globalConfig = new ConfigService();
const globalEncryption = new EncryptionService(globalConfig);

/**
 * Legacy top-level encrypt.
 * Optional key is ignored as EncryptionService handles it via S1 Config.
 */
export function encrypt(value: string, _key?: string): EncryptedData {
  return globalEncryption.encrypt(value);
}

/**
 * Legacy top-level decrypt.
 * Optional key is ignored.
 */
export function decrypt(data: EncryptedData, _key?: string): string {
  return globalEncryption.decrypt(data);
}

/**
 * Top-level hashSensitiveData.
 * Salt is supported as second argument.
 */
export function hashSensitiveData(
  value: string,
  salt?: string,
  _pepper?: string
): string {
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
