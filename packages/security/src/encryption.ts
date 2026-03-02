/**
 * S7: Encryption Service
 * Constitution Reference: architecture.md (S7 Protocol)
 * Purpose: AES-256-GCM encryption for PII and sensitive data at rest
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const _TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  salt: string;
  version?: number; // Item 12: Key version for rotation
}

/**
 * Derives encryption key from master key using salt
 * S7 FIX: Using hardened scrypt parameters for production security
 * N=2^14 (memory cost, OWASP minimum), r=8 (block size), p=1 (parallelism)
 * Note: Higher N values may exceed OpenSSL memory limits in some environments
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  // Item 9: Hardened scrypt parameters for production (N=65536)
  const isProduction = process.env.NODE_ENV === 'production';
  const N = isProduction ? 65536 : 16384;
  return scryptSync(masterKey, salt, KEY_LENGTH, { N, r: 8, p: 1 });
}

/**
 * Encrypts sensitive data using AES-256-GCM
 */
export function encrypt(plaintext: string, masterKey: string): EncryptedData {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(masterKey, salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    salt: salt.toString('hex'),
  };
}

/**
 * Decrypts data encrypted with encrypt()
 */
export function decrypt(
  encryptedData: EncryptedData,
  masterKey: string,
  fallbackKey?: string
): string {
  // Item 10: Structural verification
  if (
    !encryptedData.encrypted ||
    !encryptedData.iv ||
    !encryptedData.tag ||
    !encryptedData.salt
  ) {
    throw new Error('S7 Violation: Malformed encrypted data structure');
  }

  const performDecryption = (keyStr: string): string => {
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    const key = deriveKey(keyStr, salt);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  };

  try {
    return performDecryption(masterKey);
  } catch (error) {
    // Item 11: Prevent fallbackKey in production
    if (fallbackKey && process.env.NODE_ENV !== 'production') {
      try {
        return performDecryption(fallbackKey);
      } catch (_fallbackError) {
        throw new Error(
          'S7 Violation: Decryption failed with both primary and fallback keys.'
        );
      }
    }
    throw new Error(
      `S7 Violation: Decryption failed. ${process.env.NODE_ENV === 'production' ? '' : error}`
    );
  }
}

/**
 * Hash for API keys (one-way)
 */
export function hashApiKey(apiKey: string, secret: string): string {
  const { createHmac } = require('node:crypto');
  return createHmac('sha256', secret).update(apiKey).digest('hex');
}

/**
 * S7: Blind Index Hash (SHA-256)
 * Generates deterministic hash for searching encrypted fields (email, phone).
 * Uses a separate secret (BLIND_INDEX_PEPPER) to prevent rainbow table attacks.
 */
export function hashSensitiveData(
  value: string,
  pepper: string,
  salt?: string
): string {
  const { createHmac } = require('node:crypto');
  const finalKey = salt ? `${pepper}:${salt}` : pepper;
  return createHmac('sha256', finalKey).update(value).digest('hex');
}

/**
 * Generates secure random API key
 */
export function generateApiKey(): string {
  return `apex_${randomBytes(32).toString('base64url')}`;
}

/**
 * Masks sensitive data for display (e.g., credit cards)
 */
export function maskSensitive(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars * 2) {
    return '*'.repeat(value.length);
  }
  const start = value.slice(0, visibleChars);
  const end = value.slice(-visibleChars);
  return `${start}${'*'.repeat(value.length - visibleChars * 2)}${end}`;
}

/**
 * NestJS Injectable Encryption Service
 */
import { ConfigService } from '@apex/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EncryptionService {
  private readonly masterKey: string;
  private readonly apiKeySecret: string;
  private readonly blindIndexPepper: string;

  constructor(private readonly config: ConfigService) {
    this.masterKey = this.config.get('ENCRYPTION_MASTER_KEY') as string;
    this.blindIndexPepper = this.config.get('BLIND_INDEX_PEPPER') as string;
    this.apiKeySecret = this.config.get('API_KEY_SECRET') || '';

    const isProduction = this.config.get('NODE_ENV') === 'production';

    // Item 17: If API_KEY_SECRET looks like encrypted JSON, decrypt it
    if (this.apiKeySecret?.includes('"encrypted":')) {
      try {
        const encryptedData = JSON.parse(this.apiKeySecret) as EncryptedData;
        this.apiKeySecret = decrypt(encryptedData, this.masterKey);
      } catch (_e) {
        if (isProduction) {
          throw new Error(
            'S1 Violation: Encrypted API_KEY_SECRET in environment is malformed'
          );
        }
        // Fallback to raw value in non-production if it's not actually JSON
      }
    }
    const isTestMode = this.config.get('NODE_ENV') === 'test' && !isProduction;

    if (!this.masterKey) {
      if (isTestMode) {
        // S7 FIX: Generate random key per test run instead of static string
        this.masterKey = randomBytes(32).toString('base64url');
      } else {
        throw new Error('S1 Violation: ENCRYPTION_MASTER_KEY is required');
      }
    }

    this.validateMasterKey(this.masterKey, isProduction);
  }

  private validateMasterKey(key: string, isProduction: boolean): void {
    // Always enforce minimum key length
    if (key.length < 32) {
      throw new Error(
        'S1 Violation: ENCRYPTION_MASTER_KEY must be at least 32 characters'
      );
    }

    // CRITICAL FIX (S7): In production, explicitly reject any key containing 'test' or 'default'
    if (isProduction) {
      const forbiddenPatterns = [
        'test',
        'default',
        'example',
        'sample',
        '123456',
        'password',
        'key',
        'secret',
      ];
      const keyLower = key.toLowerCase();
      for (const pattern of forbiddenPatterns) {
        if (keyLower.includes(pattern)) {
          throw new Error(
            `S1 Violation: ENCRYPTION_MASTER_KEY contains forbidden pattern '${pattern}'. Production keys must be cryptographically random.`
          );
        }
      }

      // S7 FIX: Strict complexity requirements for production
      // Must have: uppercase, lowercase, numbers, and special characters
      const complexityRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&#/=_+.-])[A-Za-z0-9@$!%*?&#/=_+.-]+$/;
      if (!complexityRegex.test(key)) {
        throw new Error(
          'S1 Violation: ENCRYPTION_MASTER_KEY must contain uppercase, lowercase, numbers, and special characters (@$!%*?&#/=_+.-)'
        );
      }

      // S7 FIX: Entropy check (4.0 bits per character minimum)
      const calculateEntropy = (k: string): number => {
        const charSet = new Set(k.split(''));
        const poolSize = charSet.size;
        return Math.log2(poolSize ** k.length) / k.length;
      };

      const entropy = calculateEntropy(key);
      if (entropy < 4.0) {
        throw new Error(
          `S1 Violation: ENCRYPTION_MASTER_KEY has insufficient entropy (${entropy.toFixed(
            2
          )} bits/char, minimum 4.0 required)`
        );
      }
    }
  }

  encrypt(plaintext: string): EncryptedData {
    return encrypt(plaintext, this.masterKey);
  }

  decrypt(encryptedData: EncryptedData, fallbackKey?: string): string {
    return decrypt(encryptedData, this.masterKey, fallbackKey);
  }

  hashApiKey(apiKey: string): string {
    if (!this.apiKeySecret && this.config.get('NODE_ENV') === 'production') {
      throw new Error('S1 Violation: API_KEY_SECRET is required in production');
    }
    return hashApiKey(apiKey, this.apiKeySecret || 'test-secret');
  }

  generateApiKey(): string {
    return generateApiKey();
  }

  hashSensitiveData(value: string, salt?: string): string {
    if (
      !this.blindIndexPepper &&
      this.config.get('NODE_ENV') === 'production'
    ) {
      throw new Error(
        'S1 Violation: BLIND_INDEX_PEPPER is required in production'
      );
    }
    return hashSensitiveData(
      value,
      this.blindIndexPepper || 'test-pepper',
      salt
    );
  }

  mask(value: string, visibleChars?: number): string {
    return maskSensitive(value, visibleChars);
  }
}
