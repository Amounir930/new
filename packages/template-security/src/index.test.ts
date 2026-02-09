import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TemplateSecurityValidator } from './index';
import { S2IsolationChecker } from './validators/s2-isolation.checker';
import { S3ValidationChecker } from './validators/s3-validation.checker';
import { S7EncryptionChecker } from './validators/s7-encryption.checker';
import fg from 'fast-glob';
import { readFile } from 'fs/promises';

// Functional mock for fast-glob
vi.mock('fast-glob', () => ({
    default: vi.fn(),
}));

vi.mock('fs/promises', () => ({
    readFile: vi.fn(),
}));

describe('TemplateSecurityValidator (Master)', () => {
    let validator: TemplateSecurityValidator;

    beforeEach(() => {
        vi.clearAllMocks();
        validator = new TemplateSecurityValidator();

        // Spy on prototype methods to isolate the master validator test
        vi.spyOn(S2IsolationChecker.prototype, 'validate').mockResolvedValue({ passed: true, score: 100, violations: [] });
        vi.spyOn(S3ValidationChecker.prototype, 'validate').mockResolvedValue({ passed: true, score: 100, violations: [] });
        vi.spyOn(S7EncryptionChecker.prototype, 'validate').mockResolvedValue({ passed: true, score: 100, violations: [] });
    });

    it('should calculate passing score when all phases pass', async () => {
        const result = await validator.validateTemplate('templates/modern');
        expect(result.passed).toBe(true);
        expect(result.overallScore).toBe(100);
    });
});

describe('S2IsolationChecker (Static Analysis)', () => {
    let checker: S2IsolationChecker;

    beforeEach(() => {
        vi.clearAllMocks();
        checker = new S2IsolationChecker();
        vi.mocked(fg).mockResolvedValue([]);
    });

    it('should detect hardcoded tenant IDs', async () => {
        vi.mocked(fg).mockResolvedValue(['layout.tsx']);
        vi.mocked(readFile).mockResolvedValue("const id = 'tenant-alpha';");

        const result = await checker.validate('templates/bad');
        expect(result.violations.some(v => v.rule === 'S2-001')).toBe(true);
    });

    it('should pass for clean code', async () => {
        vi.mocked(fg).mockResolvedValue(['clean.tsx']);
        vi.mocked(readFile).mockResolvedValue("const store = useTenantContext();");

        const result = await checker.validate('templates/clean');
        expect(result.passed).toBe(true);
        expect(result.violations.length).toBe(0);
    });
});

describe('S3ValidationChecker (Input Validation)', () => {
    let checker: S3ValidationChecker;

    beforeEach(() => {
        vi.clearAllMocks();
        checker = new S3ValidationChecker();
        vi.mocked(fg).mockResolvedValue([]);
    });

    it('should detect useForm without zodResolver', async () => {
        vi.mocked(fg).mockResolvedValue(['form.tsx']);
        vi.mocked(readFile).mockResolvedValue("const form = useForm({ defaultValues: {} });");

        const result = await checker.validate('templates/bad-form');
        expect(result.passed).toBe(false);
        expect(result.violations.some(v => v.rule === 'S3-001')).toBe(true);
    });
});

describe('S7EncryptionChecker (PII)', () => {
    let checker: S7EncryptionChecker;

    beforeEach(() => {
        vi.clearAllMocks();
        checker = new S7EncryptionChecker();
        vi.mocked(fg).mockResolvedValue([]);
    });

    it('should detect PII in localStorage', async () => {
        vi.mocked(fg).mockResolvedValue(['auth.ts']);
        vi.mocked(readFile).mockResolvedValue("localStorage.setItem('userEmail', email);");

        const result = await checker.validate('templates/leak');
        expect(result.passed).toBe(false);
        expect(result.violations.some(v => v.rule === 'S7-001')).toBe(true);
    });
});
