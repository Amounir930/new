/**
 * S2 Isolation Checker Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { S2IsolationChecker } from './s2-isolation.checker.js';
import fg from 'fast-glob';
import { readFile } from 'fs/promises';

vi.mock('fast-glob');
vi.mock('fs/promises');

describe('S2IsolationChecker', () => {
    const checker = new S2IsolationChecker();
    const mockTemplatePath = '/mock/template';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validate', () => {
        it('should pass clean code', async () => {
            vi.mocked(fg).mockResolvedValue(['file1.ts'] as never);
            vi.mocked(readFile).mockResolvedValue('const x = useTenant();' as never);

            const result = await checker.validate(mockTemplatePath);

            expect(result.passed).toBe(true);
            expect(result.score).toBe(100);
            expect(result.violations).toHaveLength(0);
        });

        it('should detect hardcoded tenant IDs (FATAL)', async () => {
            vi.mocked(fg).mockResolvedValue(['file1.ts'] as never);
            vi.mocked(readFile).mockResolvedValue('const tenantId = "tenant-alpha";' as never);

            const result = await checker.validate(mockTemplatePath);

            expect(result.passed).toBe(false);
            expect(result.score).toBe(0);
            expect(result.violations[0].rule).toBe('S2-001');
        });

        it('should detect direct schema references (FATAL)', async () => {
            vi.mocked(fg).mockResolvedValue(['file1.ts'] as never);
            vi.mocked(readFile).mockResolvedValue('SELECT * FROM tenant_123.users' as never);

            const result = await checker.validate(mockTemplatePath);

            expect(result.passed).toBe(false);
            expect(result.violations[0].rule).toBe('S2-002');
        });

        it('should detect manual tenantId in API call (FATAL)', async () => {
            vi.mocked(fg).mockResolvedValue(['file1.ts'] as never);
            vi.mocked(readFile).mockResolvedValue('fetch("/api/data?tenantId=abc")' as never);

            const result = await checker.validate(mockTemplatePath);

            expect(result.passed).toBe(false);
            expect(result.violations[0].rule).toBe('S2-003');
        });

        it('should warn about fetch without useTenant (WARNING)', async () => {
            vi.mocked(fg).mockResolvedValue(['file1.ts'] as never);
            vi.mocked(readFile).mockResolvedValue('fetch("/api/data")' as never);

            const result = await checker.validate(mockTemplatePath);

            expect(result.passed).toBe(true); // Warnings are not fatal
            expect(result.score).toBe(80);
            expect(result.violations[0].rule).toBe('S2-004');
        });

        it('should detect direct database imports (FATAL)', async () => {
            vi.mocked(fg).mockResolvedValue(['components/MyComp.ts'] as never);
            vi.mocked(readFile).mockResolvedValue('import { db } from "@apex/db";' as never);

            const result = await checker.validate(mockTemplatePath);

            expect(result.passed).toBe(false);
            expect(result.violations[0].rule).toBe('S2-005');
        });

        it('should ignore direct database imports in api/ directory', async () => {
            vi.mocked(fg).mockResolvedValue(['api/route.ts'] as never);
            vi.mocked(readFile).mockResolvedValue('import { db } from "@apex/db";' as never);

            const result = await checker.validate(mockTemplatePath);

            expect(result.passed).toBe(true);
            expect(result.violations).toHaveLength(0);
        });
    });
});
