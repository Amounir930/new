import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  EncryptionService,
  decrypt,
  encrypt,
  generateApiKey,
  hashApiKey,
  maskSensitive,
} from './encryption.js';

describe('Encryption Utilities', () => {
  const masterKey = 'test-key-must-be-32-bytes-long!!';

  it('should encrypt and decrypt correctly', () => {
    const plaintext = 'sensitive-data';
    const encrypted = encrypt(plaintext, masterKey);

    expect(encrypted).toHaveProperty('encrypted');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('tag');
    expect(encrypted).toHaveProperty('salt');

    const decrypted = decrypt(encrypted, masterKey);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different outputs for same input due to salt/iv', () => {
    const plaintext = 'sensitive-data';
    const enc1 = encrypt(plaintext, masterKey);
    const enc2 = encrypt(plaintext, masterKey);

    expect(enc1.encrypted).not.toBe(enc2.encrypted);
    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.salt).not.toBe(enc2.salt);
  });

  it('should hash api key consistently', () => {
    const apiKey = 'apex_12345';
    const hash1 = hashApiKey(apiKey);
    const hash2 = hashApiKey(apiKey);
    expect(hash1).toBe(hash2);
  });

  it('should generate secure api key', () => {
    const key = generateApiKey();
    expect(key).toMatch(/^apex_/);
    expect(key.length).toBeGreaterThan(30);
  });

  it('should mask sensitive data', () => {
    expect(maskSensitive('1234567890', 2)).toBe('12******90');
    expect(maskSensitive('short', 4)).toBe('*****');
  });

  it('should support Key Rotation (re-encrypting with new key)', () => {
    const oldKey = 'old-master-key-must-be-32-bytes!!';
    const newKey = 'new-master-key-must-be-32-bytes!!';
    const plaintext = 'top-secret-data';

    // 1. Encrypt with old key
    const encryptedWithOld = encrypt(plaintext, oldKey);

    // 2. Decrypt with old key
    const decrypted = decrypt(encryptedWithOld, oldKey);
    expect(decrypted).toBe(plaintext);

    // 3. Re-encrypt with new key
    const encryptedWithNew = encrypt(decrypted, newKey);
    expect(encryptedWithNew.encrypted).not.toBe(encryptedWithOld.encrypted);

    // 4. Verify new key works
    expect(decrypt(encryptedWithNew, newKey)).toBe(plaintext);
  });
});

describe('EncryptionService', () => {
  let service: EncryptionService;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should initialize with provided master key', () => {
    process.env.ENCRYPTION_MASTER_KEY = 'ValidProdPass32CharsWith1$!Abc12'; // gitleaks:allow
    process.env.NODE_ENV = 'production';

    service = new EncryptionService();
    expect(service).toBeDefined();
  });

  it('should use default test key in test environment if missing', () => {
    process.env.ENCRYPTION_MASTER_KEY = '';
    process.env.NODE_ENV = 'test';

    service = new EncryptionService();
    expect(service).toBeDefined();
    // Verify it works
    const enc = service.encrypt('test');
    expect(service.decrypt(enc)).toBe('test');
  });

  it('should throw in production if key is missing', () => {
    process.env.ENCRYPTION_MASTER_KEY = '';
    process.env.NODE_ENV = 'production';

    expect(() => new EncryptionService()).toThrow(
      'S1 Violation: ENCRYPTION_MASTER_KEY is required'
    );
  });

  it('should throw if key is too short', () => {
    process.env.ENCRYPTION_MASTER_KEY = 'short';
    expect(() => new EncryptionService()).toThrow('S1 Violation');
  });

  it('should throw in production if key contains forbidden patterns', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENCRYPTION_MASTER_KEY = 'test-encryption-key-32-chars-long!'; // contains 'test'
    expect(() => new EncryptionService()).toThrow('forbidden pattern');
  });

  it('should throw if key misses special characters', () => {
    process.env.NODE_ENV = 'production';
    // gitleaks:allow - Test value for encryption validation logic
    process.env.ENCRYPTION_MASTER_KEY =
      'MasterPassWithoutSpecialCharsLongEnough';
    expect(() => new EncryptionService()).toThrow('must contain');
  });

  it('should throw in production if key has low entropy', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENCRYPTION_MASTER_KEY = 'AAAAaaaa1111!!!!AAAAaaaa1111!!!!'; // gitleaks:allow
    expect(() => new EncryptionService()).toThrow('insufficient entropy');
  });

  it('should delegate methods to utility functions', () => {
    process.env.ENCRYPTION_MASTER_KEY = 'Test-Encryption-Key-32-Chars-Long!1'; // gitleaks:allow
    process.env.NODE_ENV = 'test';
    const srv = new EncryptionService();

    const enc = srv.encrypt('data');
    expect(enc).toHaveProperty('encrypted');
    expect(srv.decrypt(enc)).toBe('data');
    expect(srv.hashApiKey('key')).toBeDefined();
    expect(srv.generateApiKey()).toMatch(/^apex_/);
  });
});
