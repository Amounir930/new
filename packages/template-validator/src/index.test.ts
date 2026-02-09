import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TemplateValidator } from './validator';
import fs from 'fs';
import path from 'path';

// Mock fs
vi.mock('fs');

describe('TemplateValidator', () => {
    let validator: TemplateValidator;

    beforeEach(() => {
        vi.clearAllMocks();
        validator = new TemplateValidator();
    });

    it('should fail if template.config.json is missing', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);
        const result = await validator.validate('templates/missing-config');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Missing template.config.json');
    });

    it('should fail if required files are missing', async () => {
        vi.mocked(fs.existsSync).mockImplementation((p: string) => {
            if (p.endsWith('template.config.json')) return true;
            if (p.endsWith('README.md')) return false; // Missing README
            return true;
        });
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
            name: 'test',
            displayName: 'Test',
            version: '1.0.0',
            description: 'Test',
            category: 'fashion',
            author: { name: 'A', email: 'a@a.com' },
            preview: { image: 'i' },
            features: { pages: { home: true, productListing: true, productDetails: true, cart: true, checkout: true } },
            requirements: { apexVersion: '1' },
            locales: [],
            rtlSupport: true
        }));

        const result = await validator.validate('templates/missing-files');
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('Missing required file: README.md'))).toBe(true);
    });

    it('should validate search feature dependency', async () => {
        vi.mocked(fs.existsSync).mockImplementation((p: string) => {
            if (p.endsWith('search/page.tsx')) return false;
            return true;
        });
        const config = {
            features: { pages: { search: true } }
        };

        // @ts-ignore - testing private method for coverage
        const result = await validator['validateDependencies']('templates/no-search', config as any);
        expect(result.errors).toContain('Search feature enabled but src/app/(shop)/search/page.tsx is missing');
    });

    it('should issue warning for missing recommended dependencies', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
            dependencies: { 'react': '18' } // Missing @apex/ui
        }));

        const config = { features: { pages: {} } };
        // @ts-ignore
        const result = await validator['validateDependencies']('templates/no-deps', config as any);
        expect(result.warnings.some(w => w.includes('Missing recommended dependency: @apex/ui'))).toBe(true);
    });
});
