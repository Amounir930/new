/**
 * Template Validator Tests
 */

import fs from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplateValidator } from './validator.js';

vi.mock('fs');
vi.mock('fast-glob');

describe('TemplateValidator', () => {
  const validator = new TemplateValidator();
  const mockTemplatePath = '/mock/template';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate a correct template structure', async () => {
      // Mock template.config.json
      const mockConfig = {
        name: 'test-template',
        displayName: 'Test Template',
        version: '1.0.0',
        description: 'A test template',
        category: 'general',
        author: { name: 'Test', email: 'test@test.com' },
        preview: { image: 'preview.png' },
        features: {
          pages: {
            home: true,
            productListing: true,
            productDetails: true,
            cart: true,
            checkout: true,
          },
        },
        requirements: { apexVersion: '1.0.0' },
        locales: ['en'],
        rtlSupport: false,
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation((p: any) => {
        if (p.includes('template.config.json'))
          return JSON.stringify(mockConfig);
        if (p.includes('package.json'))
          return JSON.stringify({ dependencies: { '@apex/ui': '1.0.0' } });
        return '';
      });

      const result = await validator.validate(mockTemplatePath);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail if template.config.json is missing', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await validator.validate(mockTemplatePath);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing template.config.json');
    });

    it('should fail if required files are missing', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p: any) => {
        if (p.includes('template.config.json')) return true;
        return false; // Missing everything else
      });
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          name: 'test',
          displayName: 'T',
          version: '1.0.0',
          description: 'D',
          category: 'general',
          author: { name: 'A', email: 'a@a.com' },
          preview: { image: 'p.png' },
          features: {
            pages: {
              home: true,
              productListing: true,
              productDetails: true,
              cart: true,
              checkout: true,
            },
          },
          requirements: { apexVersion: '1' },
          locales: ['en'],
          rtlSupport: false,
        })
      );

      const result = await validator.validate(mockTemplatePath);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required file: README.md');
    });

    it('should fail if template.config.json is invalid', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({ name: 'INVALID NAME' })
      ); // Not kebab-case

      const result = await validator.validate(mockTemplatePath);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Config error'))).toBe(true);
    });

    it('should handle dependency errors (missing search page)', async () => {
      const mockConfig = {
        name: 'test',
        displayName: 'T',
        version: '1.0.0',
        description: 'D',
        category: 'general',
        author: { name: 'A', email: 'a@a.com' },
        preview: { image: 'p.png' },
        features: {
          pages: {
            home: true,
            productListing: true,
            productDetails: true,
            cart: true,
            checkout: true,
            search: true,
          },
        },
        requirements: { apexVersion: '1' },
        locales: ['en'],
        rtlSupport: false,
      };
      vi.mocked(fs.existsSync).mockImplementation((p: any) => {
        if (p.includes('template.config.json')) return true;
        if (p.includes('src/app/(shop)/search/page.tsx')) return false;
        return true;
      });
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

      const result = await validator.validate(mockTemplatePath);
      expect(result.errors).toContain(
        'Search feature enabled but src/app/(shop)/search/page.tsx is missing'
      );
    });

    it('should handle fatal errors in validate', async () => {
      (fs.existsSync as any).mockImplementation(() => {
        throw new Error('System Crash');
      });
      const result = await validator.validate(mockTemplatePath);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain(
        'Fatal validation error: System Crash'
      );
    });
  });
});
