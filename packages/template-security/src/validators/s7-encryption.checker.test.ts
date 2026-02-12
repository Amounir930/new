/**
 * S7 Encryption Checker Tests
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { readFile } from 'node:fs/promises';
import fg from 'fast-glob';
import { S7EncryptionChecker } from './s7-encryption.checker.js';

mock.module('fast-glob', () => ({
  default: mock(),
}));

mock.module('node:fs/promises', () => ({
  readFile: mock(),
}));

describe('S7EncryptionChecker', () => {
  const checker = new S7EncryptionChecker();
  const mockTemplatePath = '/mock/template';

  beforeEach(() => {
    (fg as any).mockClear();
    (readFile as any).mockClear();
  });

  describe('validate', () => {
    it('should pass clean code', async () => {
      (fg as any).mockResolvedValue(['file1.ts']);
      (readFile as any).mockResolvedValue('const x = 1;');

      const result = await checker.validate(mockTemplatePath);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect PII in localStorage (FATAL)', async () => {
      (fg as any).mockResolvedValue(['file1.ts']);
      (readFile as any).mockResolvedValue(
        'localStorage.setItem("userEmail", "test@test.com");'
      );

      const result = await checker.validate(mockTemplatePath);

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.violations[0].rule).toBe('S7-001');
    });

    it('should detect console.log with PII (WARNING)', async () => {
      (fg as any).mockResolvedValue(['file1.ts']);
      (readFile as any).mockResolvedValue(
        'console.log("User email is:", email);'
      );

      const result = await checker.validate(mockTemplatePath);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(85);
      expect(result.violations[0].rule).toBe('S7-002');
    });

    it('should detect raw credit card input without Stripe (FATAL)', async () => {
      (fg as any).mockResolvedValue(['file1.tsx']);
      (readFile as any).mockResolvedValue('<input name="card-number" />');

      const result = await checker.validate(mockTemplatePath);

      expect(result.passed).toBe(false);
      expect(result.violations[0].rule).toBe('S7-003');
    });

    it('should pass raw credit card input WITH Stripe', async () => {
      (fg as any).mockResolvedValue(['file1.tsx']);
      (readFile as any).mockResolvedValue(
        '<input name="card" /> import { CardElement } from "@stripe/react-stripe-js";'
      );

      const result = await checker.validate(mockTemplatePath);

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect dangerouslySetInnerHTML (WARNING)', async () => {
      (fg as any).mockResolvedValue(['file1.tsx']);
      (readFile as any).mockResolvedValue(
        '<div dangerouslySetInnerHTML={{ __html: data }} />'
      );

      const result = await checker.validate(mockTemplatePath);

      expect(result.passed).toBe(true);
      expect(result.violations[0].rule).toBe('S7-004');
    });

    it('should drop score further with many warnings', async () => {
      (fg as any).mockResolvedValue(['f1.ts', 'f2.ts', 'f3.ts', 'f4.ts']);
      (readFile as any).mockResolvedValue('dangerouslySetInnerHTML');

      const result = await checker.validate(mockTemplatePath);
      expect(result.score).toBe(60);
    });
  });
});
