/**
 * Encryption Module Comprehensive Tests
 * S7 Protocol: AES-256-GCM Encryption for PII Protection
 * Coverage Target: 90%+
 *
 * NOTE: This test file must run in isolation due to crypto module mocking
 * Run with: bun test packages/security/src/encryption.test.ts
 */

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

// Restore any lingering mocks from previous test files (e.g., seeder.test.ts)
mock.restore();

import type { ConfigService } from '@apex/config/server';
import type { Mocked } from '@apex/test-utils';
import {
  type EncryptedData,
  EncryptionService as JSEncryptionService,
  decrypt as jsDecrypt,
  encrypt as jsEncrypt,
  generateApiKey as jsGenerateApiKey,
  hashApiKey as jsHashApiKey,
  maskSensitive as jsMaskSensitive,
} from './encryption';

// Set test environment FIRST before imports
Object.assign(process.env, { NODE_ENV: 'test' });

// ============================================================================
// Utility Function Tests (Top-level exports from encryption.js)
// ============================================================================
describe('Encryption.js Utility Functions', () => {
  const testMasterKey = 'test-master-key-must-be-32-bytes!!';

  describe('encrypt (JS)', () => {
    it('should encrypt plaintext and return all required properties', () => {
      const plaintext = 'sensitive-data';
      const encrypted = jsEncrypt(plaintext, testMasterKey);

      expect(encrypted).toBeDefined();
      expect(encrypted).toHaveProperty('enc');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      expect(typeof encrypted.enc).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
      expect(typeof encrypted.tag).toBe('string');
    });

    it('should produce different ciphertext for same plaintext (random iv)', () => {
      const plaintext = 'same-data';
      const enc1 = jsEncrypt(plaintext, testMasterKey);
      const enc2 = jsEncrypt(plaintext, testMasterKey);

      expect(enc1.enc).not.toBe(enc2.enc);
      expect(enc1.iv).not.toBe(enc2.iv);
    });

    it('should handle empty string', () => {
      const encrypted = jsEncrypt('', testMasterKey);
      expect(encrypted).toHaveProperty('enc');
    });

    it('should handle unicode characters', () => {
      const plaintext = 'مرحبا بالعالم 🔐';
      const encrypted = jsEncrypt(plaintext, testMasterKey);
      const decrypted = jsDecrypt(encrypted, testMasterKey);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle very long strings', () => {
      const plaintext = 'A'.repeat(10000);
      const encrypted = jsEncrypt(plaintext, testMasterKey);
      const decrypted = jsDecrypt(encrypted, testMasterKey);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('decrypt (JS)', () => {
    it('should decrypt correctly', () => {
      const plaintext = 'test-message';
      const encrypted = jsEncrypt(plaintext, testMasterKey);
      const decrypted = jsDecrypt(encrypted, testMasterKey);
      expect(decrypted).toBe(plaintext);
    });

    it('should throw S7 Violation for malformed data - missing data', () => {
      const malformed: Partial<EncryptedData> = { iv: 'abc', tag: 'def' };
      expect(() =>
        jsDecrypt(malformed as EncryptedData, testMasterKey)
      ).toThrow('S7 Violation');
    });

    it('should throw for tampered ciphertext', () => {
      const plaintext = 'original';
      const encrypted = jsEncrypt(plaintext, testMasterKey);
      encrypted.enc = 'tampered-data';
      expect(() => jsDecrypt(encrypted, testMasterKey)).toThrow('S7 Violation');
    });
  });

  describe('hashApiKey', () => {
    it('should produce consistent hash', () => {
      const apiKey = 'apex_test_key';
      const hash1 = jsHashApiKey(apiKey);
      const hash2 = jsHashApiKey(apiKey);
      expect(hash1).toBe(hash2);
    });

    it('should be case sensitive', () => {
      const hash1 = jsHashApiKey('ApiKey');
      const hash2 = jsHashApiKey('apikey');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateApiKey', () => {
    it('should generate key with apex_ prefix', () => {
      const key = jsGenerateApiKey();
      expect(key).toMatch(/^apex_/);
    });

    it('should generate unique keys', () => {
      const keys = new Set();
      for (let i = 0; i < 100; i++) {
        keys.add(jsGenerateApiKey());
      }
      expect(keys.size).toBe(100);
    });
  });

  describe('maskSensitive', () => {
    it('should mask middle characters', () => {
      expect(jsMaskSensitive('1234567890', 2)).toBe('12******90');
    });

    it('should handle empty string', () => {
      expect(jsMaskSensitive('', 2)).toBe('****');
    });

    it('should handle null/undefined gracefully', () => {
      // @ts-expect-error - testing invalid null input
      expect(jsMaskSensitive(null, 2)).toBe('****');
      // @ts-expect-error - testing invalid undefined input
      expect(jsMaskSensitive(undefined, 2)).toBe('****');
    });
  });
});

// ============================================================================
// EncryptionService Class Tests (TypeScript version via JSEncryptionService)
// ============================================================================
describe('EncryptionService Class', () => {
  let service: JSEncryptionService;
  let mockConfig: Mocked<ConfigService>;

  beforeEach(() => {
    Object.assign(process.env, { NODE_ENV: 'test' });
    mockConfig = {
      get: mock((_key: string) => undefined),
      getWithDefault: mock((_key: string, defaultValue: any) => defaultValue),
      config: {} as any,
    } as unknown as Mocked<ConfigService>;
  });

  afterEach(() => {
    // Cannot delete from process.env easily if typed as read-only,
    // but in test environment we can just reset if needed.
    Object.assign(process.env, { NODE_ENV: 'test' });
  });

  describe('constructor validation', () => {
    it('should initialize with valid production config', () => {
      const configMap: Record<string, string> = {
        ENCRYPTION_MASTER_KEY: 'ValidProdPass32CharsWith1$!Abc12', // gitleaks:allow
        NODE_ENV: 'production',
        BLIND_INDEX_PEPPER: 'pepper-must-be-32-chars-long-one!', // gitleaks:allow
        API_KEY_SECRET: 'test-api-secret-key-32-chars-!!!!', // gitleaks:allow
      };
      mockConfig.get.mockImplementation((key: string) => configMap[key]);

      service = new JSEncryptionService(mockConfig);
      expect(service).toBeDefined();
    });

    it('should throw in production if ENCRYPTION_MASTER_KEY is missing', () => {
      const configMap: Record<string, string> = {
        ENCRYPTION_MASTER_KEY: '',
        NODE_ENV: 'production',
        BLIND_INDEX_PEPPER: 'pepper-must-be-32-chars-long-one!',
        API_KEY_SECRET: 'test-api-secret-key-32-chars-!!!!',
      };
      mockConfig.get.mockImplementation((key: string) => configMap[key]);

      expect(
        () => new JSEncryptionService(mockConfig as unknown as ConfigService)
      ).toThrow('S1 Violation');
    });
  });

  describe('encrypt method', () => {
    beforeEach(() => {
      const configMap: Record<string, string> = {
        ENCRYPTION_MASTER_KEY: 'Test-Encryption-Key-32-Chars-Long!1', // gitleaks:allow
        NODE_ENV: 'test',
        BLIND_INDEX_PEPPER: 'pepper-must-be-32-chars-long-one!', // gitleaks:allow
        API_KEY_SECRET: 'test-api-secret-key-32-chars-!!!!', // gitleaks:allow
      };
      mockConfig.get.mockImplementation((key: string) => configMap[key]);
      service = new JSEncryptionService(mockConfig);
    });

    it('should encrypt and return EncryptedData structure', () => {
      const result = service.encrypt('test-data');
      expect(result).toHaveProperty('enc');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('tag');
      expect(result).toHaveProperty('data');
    });

    it('should produce different ciphertext for same input', () => {
      const enc1 = service.encrypt('same');
      const enc2 = service.encrypt('same');
      expect(enc1.enc).not.toBe(enc2.enc);
    });
  });

  describe('decrypt method', () => {
    beforeEach(() => {
      const configMap: Record<string, string> = {
        ENCRYPTION_MASTER_KEY: 'Test-Encryption-Key-32-Chars-Long!1', // gitleaks:allow
        NODE_ENV: 'test',
        BLIND_INDEX_PEPPER: 'pepper-must-be-32-chars-long-one!', // gitleaks:allow
        API_KEY_SECRET: 'test-api-secret-key-32-chars-!!!!', // gitleaks:allow
      };
      mockConfig.get.mockImplementation((key: string) => configMap[key]);
      service = new JSEncryptionService(mockConfig);
    });

    it('should decrypt data encrypted by service', () => {
      const plaintext = 'original-message';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should throw for tampered data', () => {
      const encrypted = service.encrypt('test');
      encrypted.enc = 'tampered';
      expect(() => service.decrypt(encrypted)).toThrow();
    });
  });

  describe('hashSensitiveData method (Blind Index)', () => {
    beforeEach(() => {
      const configMap: Record<string, string> = {
        ENCRYPTION_MASTER_KEY: 'Test-Encryption-Key-32-Chars-Long!1', // gitleaks:allow
        NODE_ENV: 'test',
        BLIND_INDEX_PEPPER: 'pepper-must-be-32-chars-long-one!', // gitleaks:allow
        API_KEY_SECRET: 'test-api-secret-key-32-chars-!!!!', // gitleaks:allow
      };
      mockConfig.get.mockImplementation((key: string) => configMap[key]);
      service = new JSEncryptionService(mockConfig);
    });

    it('should normalize input (lowercase and trim)', () => {
      const hash1 = service.hashSensitiveData('Email@Test.COM  ');
      const hash2 = service.hashSensitiveData('email@test.com');
      expect(hash1).toBe(hash2);
    });
  });

  describe('mask method', () => {
    beforeEach(() => {
      const configMap: Record<string, string> = {
        ENCRYPTION_MASTER_KEY: 'Test-Encryption-Key-32-Chars-Long!1', // gitleaks:allow
        NODE_ENV: 'test',
        BLIND_INDEX_PEPPER: 'pepper-must-be-32-chars-long-one!', // gitleaks:allow
        API_KEY_SECRET: 'test-api-secret-key-32-chars-!!!!', // gitleaks:allow
      };
      mockConfig.get.mockImplementation((key: string) => configMap[key]);
      service = new JSEncryptionService(mockConfig);
    });

    it('should mask with default visibleChars', () => {
      expect(service.mask('1234567890123456', 4)).toBe('1234********3456');
    });
  });
});

describe('Edge Cases', () => {
  const masterKey = 'edge-case-test-key-32-bytes-long!!';

  it('should handle Arabic text', () => {
    const arabic = 'مرحبا بالعالم في نظام التشفير';
    const encrypted = jsEncrypt(arabic, masterKey);
    const decrypted = jsDecrypt(encrypted, masterKey);
    expect(decrypted).toBe(arabic);
  });

  it('should handle emoji and multi-byte characters', () => {
    const emoji = '🔐🚀💻🌍👨‍💻';
    const encrypted = jsEncrypt(emoji, masterKey);
    const decrypted = jsDecrypt(encrypted, masterKey);
    expect(decrypted).toBe(emoji);
  });
});
