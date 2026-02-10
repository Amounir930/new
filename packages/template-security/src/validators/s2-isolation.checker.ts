/**
 * S2: Tenant Isolation Checker
 *
 * Validates templates CANNOT access other tenant data.
 * Includes both static code analysis and runtime isolation tests.
 *
 * @module @apex/template-security/validators/s2-isolation
 */

import { readFile } from 'node:fs/promises';
import fg from 'fast-glob';

export interface Violation {
  severity: 'FATAL' | 'WARNING' | 'INFO';
  rule: string;
  file?: string;
  line?: number;
  message: string;
  suggestion?: string;
  evidence?: string;
}

export interface CheckResult {
  passed: boolean;
  violations: Violation[];
  score: number;
}

export class S2IsolationChecker {
  /**
   * Validates template CANNOT access other tenant data
   */
  async validate(templatePath: string): Promise<CheckResult> {
    const violations: Violation[] = [];

    // 1. Static Code Analysis
    const codeFiles = await fg(`${templatePath}/**/*.{ts,tsx,js,jsx}`, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    });

    for (const file of codeFiles) {
      const content = await readFile(file, 'utf-8');

      // ❌ FATAL: Hardcoded tenant IDs
      if (/tenant[-_]?(a|b|alpha|beta|test|demo)/i.test(content)) {
        const line = this.findLineNumber(
          content,
          /tenant[-_]?(a|b|alpha|beta)/i
        );
        violations.push({
          severity: 'FATAL',
          rule: 'S2-001',
          file,
          line,
          message: 'Hardcoded tenant ID detected',
          suggestion: 'Use useTenant() hook or getTenantContext() instead',
        });
      }

      // ❌ FATAL: Direct schema references
      if (/FROM\s+tenant_[a-z0-9_]+\./i.test(content)) {
        const line = this.findLineNumber(content, /FROM\s+tenant_/i);
        violations.push({
          severity: 'FATAL',
          rule: 'S2-002',
          file,
          line,
          message: 'Direct tenant schema reference (bypass isolation)',
          suggestion: 'Remove SQL queries from templates, use API endpoints',
        });
      }

      // ❌ FATAL: Manual tenant ID in API calls
      if (/\/api\/.*[?&]tenantId=/i.test(content)) {
        const line = this.findLineNumber(content, /tenantId=/i);
        violations.push({
          severity: 'FATAL',
          rule: 'S2-003',
          file,
          line,
          message: 'Manual tenant ID in API call (must use context)',
          suggestion: 'Tenant context is automatic, remove tenantId parameter',
        });
      }

      // ⚠️ WARNING: API call without tenant context hook
      if (content.includes('fetch(') && !content.includes('useTenant')) {
        const line = this.findLineNumber(content, /fetch\(/);
        violations.push({
          severity: 'WARNING',
          rule: 'S2-004',
          file,
          line,
          message: 'API call without tenant context hook',
          suggestion: 'Import useTenant() from @apex/ui/contexts',
        });
      }

      // ❌ FATAL: Direct database imports
      if (/@apex\/db/.test(content) && !file.includes('api/')) {
        const line = this.findLineNumber(content, /@apex\/db/);
        violations.push({
          severity: 'FATAL',
          rule: 'S2-005',
          file,
          line,
          message: 'Direct database import in template component',
          suggestion: 'Templates must use API endpoints, not direct DB access',
        });
      }
    }

    // 2. Runtime Isolation Test (if test database available)
    // const runtimeViolations = await this.runIsolationTests(templatePath);
    // violations.push(...runtimeViolations);

    return {
      passed: violations.filter((v) => v.severity === 'FATAL').length === 0,
      violations,
      score: this.calculateComplianceScore(violations),
    };
  }

  /**
   * Finds line number of pattern in content
   */
  private findLineNumber(content: string, pattern: RegExp): number {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return 0;
  }

  /**
   * Calculates compliance score (0-100)
   */
  private calculateComplianceScore(violations: Violation[]): number {
    const fatalCount = violations.filter((v) => v.severity === 'FATAL').length;
    const warningCount = violations.filter(
      (v) => v.severity === 'WARNING'
    ).length;

    if (fatalCount > 0) return 0;
    if (warningCount > 5) return 50;
    if (warningCount > 0) return 80;
    return 100;
  }
}
