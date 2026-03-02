import { describe, expect, it } from 'bun:test';
import {
  decrypt,
  EncryptionService,
  encrypt,
  generateApiKey,
  maskSensitive,
} from './encryption.js';

const mockConfig = (envVars: Record<string, string>) =>
  ({
    get: (key: string) => envVars[key],
    getWithDefault: (key: string, def: string) => envVars[key] || def,
  }) as any;

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

  it('Item 20: should reject malformed or plaintext-like data mapping to EncryptedData', () => {
    const malformedData = {
      encrypted: 'not-really-encrypted',
      iv: 'too-short',
      tag: 'missing',
      salt: 'non-hex',
    };

    // Should throw due to structural check or decryption failure
    expect(() => decrypt(malformedData as any, masterKey)).toThrow(
      'S7 Violation'
    );
  });

  it('Item 20: should throw on missing fields in EncryptedData', () => {
    const incompleteData = {
      encrypted: 'abc',
      iv: 'def',
    };

    expect(() => decrypt(incompleteData as any, masterKey)).toThrow(
      'Malformed encrypted data structure'
    );
  });

  it('should hash api key consistently', () => {
    const config = mockConfig({
      ENCRYPTION_MASTER_KEY: 'Test-Encryption-Key-32-Chars-Long!1', // gitleaks:allow
      NODE_ENV: 'test',
      API_KEY_SECRET: 'test-api-secret-key-32-chars-!!!!',
    });
    const srv = new EncryptionService(config);
    const apiKey = 'apex_12345';
    const hash1 = srv.hashApiKey(apiKey);
    const hash2 = srv.hashApiKey(apiKey);
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
    const oldKey = 'old-master-key-must-be-32-chars!!';
    const newKey = 'new-master-key-must-be-32-chars!!';
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

  const mockConfig = (envVars: Record<string, string>) =>
    ({
      get: (key: string) => envVars[key],
      getWithDefault: (key: string, def: string) => envVars[key] || def,
    }) as any;

  it('should initialize with provided master key', () => {
    const config = mockConfig({
      ENCRYPTION_MASTER_KEY: 'ValidProdPass32CharsWith1$!Abc12', // gitleaks:allow
      NODE_ENV: 'production',
      BLIND_INDEX_PEPPER: 'pepper-must-be-32-chars-long-one!',
    });

    service = new EncryptionService(config);
    expect(service).toBeDefined();
  });

  it('should generate random test key in test environment if missing', () => {
    const config = mockConfig({
      ENCRYPTION_MASTER_KEY: '',
      NODE_ENV: 'test',
      BLIND_INDEX_PEPPER: '',
    });

    service = new EncryptionService(config);
    expect(service).toBeDefined();
    // Verify it works
    const enc = service.encrypt('test');
    expect(service.decrypt(enc)).toBe('test');
  });

  it('should throw in production if key is missing', () => {
    const config = mockConfig({
      ENCRYPTION_MASTER_KEY: '',
      NODE_ENV: 'production',
      BLIND_INDEX_PEPPER: 'pepper-must-be-32-chars-long-one!',
      API_KEY_SECRET: 'test-api-secret-key-32-chars-!!!!',
    });

    expect(() => new EncryptionService(config)).toThrow(
      'S1 Violation: ENCRYPTION_MASTER_KEY is required'
    );
  });

  it('should throw if key is too short', () => {
    const config = mockConfig({
      ENCRYPTION_MASTER_KEY: 'short',
      NODE_ENV: 'development',
      BLIND_INDEX_PEPPER: 'pepper-must-be-32-chars-long-one!',
      API_KEY_SECRET: 'test-api-secret-key-32-chars-!!!!',
    });
    expect(() => new EncryptionService(config)).toThrow('S1 Violation');
  });

  it('should throw in production if key contains forbidden patterns', () => {
    const config = mockConfig({
      NODE_ENV: 'production',
      ENCRYPTION_MASTER_KEY: 'test-encryption-key-32-chars-long!',
      BLIND_INDEX_PEPPER: 'pepper-must-be-32-chars-long-one!',
      API_KEY_SECRET: 'test-api-secret-key-32-chars-!!!!',
    });
    expect(() => new EncryptionService(config)).toThrow('forbidden pattern');
  });

  it('should throw if key misses special characters', () => {
    const config = mockConfig({
      NODE_ENV: 'production',
      ENCRYPTION_MASTER_KEY: 'MasterPassWithoutSpecialCharsLongEnough', // gitleaks:allow
      BLIND_INDEX_PEPPER: 'pepper-must-be-32-chars-long-one!',
      API_KEY_SECRET: 'test-api-secret-key-32-chars-!!!!',
    });
    expect(() => new EncryptionService(config)).toThrow('must contain');
  });

  it('should throw in production if key has low entropy', () => {
    const config = mockConfig({
      NODE_ENV: 'production',
      ENCRYPTION_MASTER_KEY: 'AAAAaaaa1111!!!!AAAAaaaa1111!!!!', // gitleaks:allow
      BLIND_INDEX_PEPPER: 'pepper-must-be-32-chars-long-one!',
      API_KEY_SECRET: 'test-api-secret-key-32-chars-!!!!',
    });
    expect(() => new EncryptionService(config)).toThrow('insufficient entropy');
  });

  it('should delegate methods to utility functions', () => {
    const config = mockConfig({
      ENCRYPTION_MASTER_KEY: 'Test-Encryption-Key-32-Chars-Long!1', // gitleaks:allow
      NODE_ENV: 'test',
      BLIND_INDEX_PEPPER: 'pepper-must-be-32-chars-long-one!',
    });
    const srv = new EncryptionService(config);

    const enc = srv.encrypt('data');
    expect(enc).toHaveProperty('encrypted');
    expect(srv.decrypt(enc)).toBe('data');
    expect(srv.hashApiKey('key')).toBeDefined();
    expect(srv.generateApiKey()).toMatch(/^apex_/);
  });
});
