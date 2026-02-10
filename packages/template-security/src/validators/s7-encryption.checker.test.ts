/**
 * S7 Encryption Checker Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { S7EncryptionChecker } from './s7-encryption.checker.js';
import fg from 'fast-glob';
import { readFile } from 'fs/promises';

vi.mock('fast-glob');
vi.mock('fs/promises');

describe('S7EncryptionChecker', () => {
    const checker = new S7EncryptionChecker();
    const mockTemplatePath = '/mock/template';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validate', () => {
        it('should pass clean code', async () => {
            vi.mocked(fg).mockResolvedValue(['file1.ts'] as never);
            vi.mocked(readFile).mockResolvedValue('const x = 1;' as never);

            const result = await checker.validate(mockTemplatePath);

            expect(result.passed).toBe(true);
            expect(result.score).toBe(100);
            expect(result.violations).toHaveLength(0);
        });

        it('should detect PII in localStorage (FATAL)', async () => {
            vi.mocked(fg).mockResolvedValue(['file1.ts'] as never);
            vi.mocked(readFile).mockResolvedValue('localStorage.setItem("userEmail", "test@test.com");' as never);

            const result = await checker.validate(mockTemplatePath);

            expect(result.passed).toBe(false);
            expect(result.score).toBe(0);
            expect(result.violations[0].rule).toBe('S7-001');
        });

        it('should detect console.log with PII (WARNING)', async () => {
            vi.mocked(fg).mockResolvedValue(['file1.ts'] as never);
            vi.mocked(readFile).mockResolvedValue('console.log("User email is:", email);' as never);

            const result = await checker.validate(mockTemplatePath);

            expect(result.passed).toBe(true);
            expect(result.score).toBe(85);
            expect(result.violations[0].rule).toBe('S7-002');
        });

        it('should detect raw credit card input without Stripe (FATAL)', async () => {
            vi.mocked(fg).mockResolvedValue(['file1.tsx'] as never);
            vi.mocked(readFile).mockResolvedValue('<input name="card-number" />' as never);

            const result = await checker.validate(mockTemplatePath);

            expect(result.passed).toBe(false);
            expect(result.violations[0].rule).toBe('S7-003');
        });

        it('should pass raw credit card input WITH Stripe', async () => {
            vi.mocked(fg).mockResolvedValue(['file1.tsx'] as never);
            vi.mocked(readFile).mockResolvedValue('<input name="card" /> import { CardElement } from "@stripe/react-stripe-js";' as never);

            const result = await checker.validate(mockTemplatePath);

            expect(result.passed).toBe(true);
            expect(result.violations).toHaveLength(0);
        });

        it('should detect dangerouslySetInnerHTML (WARNING)', async () => {
            vi.mocked(fg).mockResolvedValue(['file1.tsx'] as never);
            vi.mocked(readFile).mockResolvedValue('<div dangerouslySetInnerHTML={{ __html: data }} />' as never);

            const result = await checker.validate(mockTemplatePath);

            expect(result.passed).toBe(true);
            expect(result.violations[0].rule).toBe('S7-004');
        });

        it('should drop score further with many warnings', async () => {
            vi.mocked(fg).mockResolvedValue(['f1.ts', 'f2.ts', 'f3.ts', 'f4.ts'] as never);
            vi.mocked(readFile).mockResolvedValue('dangerouslySetInnerHTML' as never);

            const result = await checker.validate(mockTemplatePath);
            expect(result.score).toBe(60);
        });
    });
});
