/**
 * S2 Isolation Checker Tests
 */

import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import fg from 'fast-glob';
import { S2IsolationChecker } from './s2-isolation.checker.js';

mock.module('fast-glob', () => ({
  default: mock(),
}));

mock.module('node:fs/promises', () => ({
  readFile: mock(),
}));

describe('S2IsolationChecker', () => {
  const checker = new S2IsolationChecker();
  const mockTemplatePath = '/mock/template';

  beforeEach(() => {
    (fg as any).mockClear();
    (readFile as any).mockClear();
  });

  describe('validate', () => {
    it('should pass clean code', async () => {
      (fg as any).mockResolvedValue(['file1.ts']);
      (readFile as any).mockResolvedValue('const x = useTenantDb()');

      const result = await checker.validate(mockTemplatePath);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect hardcoded tenant IDs (FATAL)', async () => {
      (fg as any).mockResolvedValue(['file1.ts']);
      (readFile as any).mockResolvedValue('const tenantId = "tenant-alpha";');

      const result = await checker.validate(mockTemplatePath);

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.violations[0].rule).toBe('S2-001');
    });

    it('should detect direct schema references (FATAL)', async () => {
      (fg as any).mockResolvedValue(['file1.ts']);
      (readFile as any).mockResolvedValue('SELECT * FROM tenant_123.users');

      const result = await checker.validate(mockTemplatePath);

      expect(result.passed).toBe(false);
      expect(result.violations[0].rule).toBe('S2-002');
    });

    it('should detect manual tenantId in API call (FATAL)', async () => {
      (fg as any).mockResolvedValue(['file1.ts']);
      (readFile as any).mockResolvedValue('fetch("/api/data?tenantId=abc")');

      const result = await checker.validate(mockTemplatePath);

      expect(result.passed).toBe(false);
      expect(result.violations[0].rule).toBe('S2-003');
    });

    it('should warn about fetch without useTenant (WARNING)', async () => {
      (fg as any).mockResolvedValue(['file1.ts']);
      (readFile as any).mockResolvedValue('fetch("/api/data")');

      const result = await checker.validate(mockTemplatePath);

      expect(result.passed).toBe(true); // Warnings are not fatal
      expect(result.score).toBe(80);
      expect(result.violations[0].rule).toBe('S2-004');
    });

    it('should detect direct database imports (FATAL)', async () => {
      (fg as any).mockResolvedValue(['components/MyComp.ts']);
      (readFile as any).mockResolvedValue('import { db } from "@apex/db";');

      const result = await checker.validate(mockTemplatePath);

      expect(result.passed).toBe(false);
      expect(result.violations[0].rule).toBe('S2-005');
    });

    it('should ignore direct database imports in api/ directory', async () => {
      (fg as any).mockResolvedValue(['api/route.ts']);
      (readFile as any).mockResolvedValue('import { db } from "@apex/db";');

      const result = await checker.validate(mockTemplatePath);

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });
});
