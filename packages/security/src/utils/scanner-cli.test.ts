/**
 * Apex Security Scanner Tests
 * Verifying AST-based security verification logic
 */

import { Project } from 'ts-morph';
import { describe, expect, it } from 'bun:test';
import { ApexSecurityScanner } from './scanner-cli.js';

describe('ApexSecurityScanner', () => {
  const scanner = new ApexSecurityScanner('tsconfig.json');

  describe('SQL Injection Detection (S11)', () => {
    it('should detect unsafe sql.raw() concatenation', () => {
      const project = new Project();
      const sf = project.createSourceFile(
        'test.ts',
        `
                import { sql } from 'drizzle-orm';
                const user = "admin";
                const query = sql.raw("SELECT * FROM users WHERE name = '" + user + "'");
            `
      );

      // Access private scanFile for targeted testing
      (scanner as any).scanFile(sf);
      const violations = (scanner as any).violations;

      expect(violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining(
              'S11: Unsafe string concatenation'
            ),
          }),
        ])
      );
    }, 20000);

    it('should bypass safe sql.raw() usage', () => {
      const project = new Project();
      const sf = project.createSourceFile(
        'safe.ts',
        `
                import { sql } from 'drizzle-orm';
                const query = sql.raw("SELECT 1");
            `
      );
      scanner.clearViolations();
      (scanner as any).scanFile(sf);
      expect((scanner as any).violations).toHaveLength(0);
    });
  });

  describe('Path Traversal Detection (S14)', () => {
    it('should detect risky ".." interpolation', () => {
      const project = new Project();
      const sf = project.createSourceFile(
        'traversal.ts',
        `
                import * as fs from 'fs';
                const userPath = "../../etc/passwd";
                fs.readFileSync(\`/tmp/\${userPath}\`);
             `
      );
      scanner.clearViolations();
      (scanner as any).scanFile(sf);
      expect((scanner as any).violations.length).toBeGreaterThan(0);
    });
  });

  describe('Export Security (S14)', () => {
    it('should detect missing cleanup in export strategies', () => {
      const project = new Project();
      const sf = project.createSourceFile(
        'packages/export/src/strategies/weak.ts',
        `
                export class WeakStrategy {
                    async execute() { return "missing safe isolation"; }
                }
             `
      );
      scanner.clearViolations();
      (scanner as any).scanFile(sf);
      expect((scanner as any).violations).toContainEqual(
        expect.objectContaining({
          severity: 'CRITICAL',
          message: expect.stringContaining(
            'S14: Export strategy missing cleanup logic'
          ),
        })
      );
      expect((scanner as any).violations).toContainEqual(
        expect.objectContaining({
          severity: 'CRITICAL',
          message: expect.stringContaining(
            'S14: Export strategy missing tenant schema isolation'
          ),
        })
      );
    });
  });
});
