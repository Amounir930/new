/**
 * S3: Input Validation Checker
 *
 * Validates all user input is validated via Zod schemas.
 *
 * @module @apex/template-security/validators/s3-validation
 */

import { readFile } from 'node:fs/promises';
import fg from 'fast-glob';
import type { CheckResult, Violation } from './s2-isolation.checker';

export class S3ValidationChecker {
  async validate(templatePath: string): Promise<CheckResult> {
    const violations: Violation[] = [];

    const codeFiles = await fg(`${templatePath}/**/*.{ts,tsx}`, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    });

    for (const file of codeFiles) {
      const content = await readFile(file, 'utf-8');

      // 1. Check for useForm without zodResolver
      if (/useForm\(/.test(content) && !content.includes('zodResolver')) {
        const line = this.findLineNumber(content, /useForm\(/);
        violations.push({
          severity: 'FATAL',
          rule: 'S3-001',
          file,
          line,
          message: 'useForm without Zod validation',
          suggestion: 'Add resolver: zodResolver(YourSchema)',
        });
      }

      // 2. Check for API routes without validation
      if (file.includes('/api/') || file.includes('/route.ts')) {
        if (
          content.includes('request.json()') &&
          !content.includes('.safeParse')
        ) {
          const line = this.findLineNumber(content, /request\.json\(\)/);
          violations.push({
            severity: 'FATAL',
            rule: 'S3-002',
            file,
            line,
            message: 'API route without Zod validation',
            suggestion: 'Use YourSchema.safeParse(body) before processing',
          });
        }
      }

      // 3. Check for inline validation (anti-pattern)
      if (/if\s*\([^)]*\.includes\(['"]@['"]\)/g.test(content)) {
        const line = this.findLineNumber(content, /\.includes\(['"]@['"]\)/);
        violations.push({
          severity: 'WARNING',
          rule: 'S3-003',
          file,
          line,
          message: 'Inline email validation detected',
          suggestion: 'Use Zod schema: z.string().email()',
        });
      }

      // 4. Check for direct use of user input in queries
      if (/\$\{[^}]*body\.|request\./g.test(content)) {
        const line = this.findLineNumber(content, /\$\{.*body\./);
        violations.push({
          severity: 'FATAL',
          rule: 'S3-004',
          file,
          line,
          message: 'Unsanitized user input in template literal',
          suggestion: 'Validate with Zod before using',
        });
      }
    }

    return {
      passed: violations.filter((v) => v.severity === 'FATAL').length === 0,
      violations,
      score: this.calculateScore(violations),
    };
  }

  private findLineNumber(content: string, pattern: RegExp): number {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return 0;
  }

  private calculateScore(violations: Violation[]): number {
    const fatalCount = violations.filter((v) => v.severity === 'FATAL').length;
    if (fatalCount > 0) return 0;
    return 100;
  }
}
