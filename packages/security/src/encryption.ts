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
}

/**
 * Derives encryption key from master key using salt
 * S7 FIX: Using hardened scrypt parameters for production security
 * N=2^14 (memory cost, OWASP minimum), r=8 (block size), p=1 (parallelism)
 * Note: Higher N values may exceed OpenSSL memory limits in some environments
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return scryptSync(masterKey, salt, KEY_LENGTH, { N: 2 ** 14, r: 8, p: 1 });
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
  masterKey: string
): string {
  const salt = Buffer.from(encryptedData.salt, 'hex');
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const tag = Buffer.from(encryptedData.tag, 'hex');
  const key = deriveKey(masterKey, salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hash for API keys (one-way)
 */
export function hashApiKey(apiKey: string): string {
  const { createHmac } = require('node:crypto');
  const secret =
    process.env.API_KEY_SECRET || 'default-secret-change-in-production';
  return createHmac('sha256', secret).update(apiKey).digest('hex');
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
import { Injectable } from '@nestjs/common';

@Injectable()
export class EncryptionService {
  private readonly masterKey: string;

  constructor() {
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY || '';

    // CRITICAL FIX (S7): Strict enforcement for production
    // In production, test keys are NEVER allowed, regardless of environment variables
    const isProduction = process.env.NODE_ENV === 'production';
    const isTestMode = process.env.NODE_ENV === 'test' && !isProduction;

    if (!this.masterKey) {
      if (isTestMode) {
        // S7 FIX: Generate random key per test run instead of static string
        this.masterKey = randomBytes(32).toString('base64url');
        console.warn(
          '⚠️ S7: Using RANDOM test encryption key - NEVER use in production'
        );
      } else {
        throw new Error('S1 Violation: ENCRYPTION_MASTER_KEY is required');
      }
    }

    // Always enforce minimum key length
    if (this.masterKey.length < 32) {
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
      const keyLower = this.masterKey.toLowerCase();
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
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
      if (!complexityRegex.test(this.masterKey)) {
        throw new Error(
          'S1 Violation: ENCRYPTION_MASTER_KEY must contain uppercase, lowercase, numbers, and special characters (@$!%*?&)'
        );
      }

      // S7 FIX: Entropy check (4.0 bits per character minimum)
      const calculateEntropy = (key: string): number => {
        const charSet = new Set(key.split(''));
        const poolSize = charSet.size;
        return Math.log2(poolSize ** key.length) / key.length;
      };

      const entropy = calculateEntropy(this.masterKey);
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

  decrypt(encryptedData: EncryptedData): string {
    return decrypt(encryptedData, this.masterKey);
  }

  hashApiKey(apiKey: string): string {
    return hashApiKey(apiKey);
  }

  generateApiKey(): string {
    return generateApiKey();
  }

  mask(value: string, visibleChars?: number): string {
    return maskSensitive(value, visibleChars);
  }
}
