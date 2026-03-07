/**
 * Apex Security Scanner Tests
 * Verifying AST-based security verification logic
 */

import { describe, expect, it } from 'bun:test';
import { Project, type SourceFile } from 'ts-morph';
import { ApexSecurityScanner } from './scanner-cli';

/**
 * Test-friendly subclass to access protected members
 */
class TestScanner extends ApexSecurityScanner {
  public runScanFile(sourceFile: SourceFile, rule?: string): void {
    this.scanFile(sourceFile, rule);
  }
}

describe('ApexSecurityScanner', () => {
  const scanner = new TestScanner();

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

      scanner.clearViolations();
      scanner.runScanFile(sf);
      const violations = scanner.getViolations();

      expect(violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining(
              'S11: Unsafe string concatenation'
            ),
          }),
        ])
      );
    }, 15000);

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
      scanner.runScanFile(sf);
      expect(scanner.getViolations()).toHaveLength(0);
    }, 15000);
  });

  describe('Path Traversal Detection (S14)', () => {
    it('should detect risky ".." interpolation', () => {
      const project = new Project();
      const sf = project.createSourceFile(
        'traversal.ts',
        `
                import * as fs from 'fs';
                const userPath = ".."+"/../etc/passwd";
                fs.readFileSync(\`/tmp/\${userPath}\`);
             `
      );
      scanner.clearViolations();
      scanner.runScanFile(sf);
      expect(scanner.getViolations().length).toBeGreaterThan(0);
    }, 15000);
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
      scanner.runScanFile(sf);
      const violations = scanner.getViolations();

      expect(violations).toContainEqual(
        expect.objectContaining({
          severity: 'CRITICAL',
          message: expect.stringContaining(
            'S14: Export strategy missing cleanup logic'
          ),
        })
      );
      expect(violations).toContainEqual(
        expect.objectContaining({
          severity: 'CRITICAL',
          message: expect.stringContaining(
            'S14: Export strategy missing tenant schema isolation'
          ),
        })
      );
    }, 15000);
  });
});
