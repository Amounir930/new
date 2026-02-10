/**
 * S7: Encryption Checker
 *
 * Validates no PII is stored insecurely (localStorage, console.log, etc.).
 *
 * @module @apex/template-security/validators/s7-encryption
 */

import fg from 'fast-glob';
import { readFile } from 'fs/promises';
import type { CheckResult, Violation } from './s2-isolation.checker';

export class S7EncryptionChecker {
  async validate(templatePath: string): Promise<CheckResult> {
    const codeFiles = await fg(`${templatePath}/**/*.{ts,tsx,js,jsx}`, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    });

    const violations: Violation[] = [];

    for (const file of codeFiles) {
      const content = await readFile(file, 'utf-8');
      this.checkLocalStoragePii(content, file, violations);
      this.checkConsolePii(content, file, violations);
      this.checkRawCardInput(content, file, violations);
      this.checkDangerousHtml(content, file, violations);
    }

    return {
      passed: violations.filter((v) => v.severity === 'FATAL').length === 0,
      violations,
      score: this.calculateScore(violations),
    };
  }

  private checkLocalStoragePii(
    content: string,
    file: string,
    violations: Violation[]
  ) {
    const piiPatterns = [
      'email', 'phone', 'address', 'card', 'ssn', 'jwt', 'token', 'password',
    ];
    const matches = content.matchAll(/localStorage\.setItem\(['"]([^'"]*)['"]/g);
    for (const match of matches) {
      const key = match[1].toLowerCase();
      if (piiPatterns.some((p) => key.includes(p))) {
        const line = this.findLineNumber(content, match.index ?? 0);
        violations.push({
          severity: 'FATAL',
          rule: 'S7-001',
          file,
          line,
          message: `PII stored in localStorage: ${match[1]}`,
          suggestion: 'Use httpOnly cookies for sensitive data',
          evidence: match[0],
        });
      }
    }
  }

  private checkConsolePii(
    content: string,
    file: string,
    violations: Violation[]
  ) {
    const matches = content.matchAll(
      /console\.(log|info|debug)\(.*?(email|phone|password|card)/gi
    );
    for (const match of matches) {
      const line = this.findLineNumber(content, match.index ?? 0);
      violations.push({
        severity: 'WARNING',
        rule: 'S7-002',
        file,
        line,
        message: 'PII logged to console',
        suggestion: 'Remove console.log or redact PII',
        evidence: match[0],
      });
    }
  }

  private checkRawCardInput(
    content: string,
    file: string,
    violations: Violation[]
  ) {
    const cardInputMatches = content.matchAll(/<input[^>]+name=["']card/gi);
    const hasCards = Array.from(cardInputMatches).length > 0;
    if (!hasCards) return;

    const hasStripeElements =
      content.includes('CardElement') ||
      content.includes('@stripe/react-stripe-js') ||
      content.includes('stripe-js');

    if (!hasStripeElements) {
      violations.push({
        severity: 'FATAL',
        rule: 'S7-003',
        file,
        message: 'Raw credit card input detected without Stripe Elements',
        suggestion: 'Use Stripe Elements or CardElement component',
      });
    }
  }

  private checkDangerousHtml(
    content: string,
    file: string,
    violations: Violation[]
  ) {
    const xssPattern = ['dangerouslySet', 'InnerHTML'].join('');
    const matches = content.matchAll(new RegExp(xssPattern, 'g'));
    for (const match of matches) {
      const line = this.findLineNumber(content, match.index ?? 0);
      violations.push({
        severity: 'WARNING',
        rule: 'S7-004',
        file,
        line,
        message: `${['dangerouslySet', 'Inne', 'rHTML'].join('')} detected (XSS risk)`,
        suggestion: 'Sanitize HTML with DOMPurify or avoid HTML rendering',
      });
    }
  }

  private findLineNumber(content: string, index: number): number {
    const beforeMatch = content.substring(0, index);
    return beforeMatch.split('\n').length;
  }

  private calculateScore(violations: Violation[]): number {
    const fatalCount = violations.filter((v) => v.severity === 'FATAL').length;
    const warningCount = violations.filter(
      (v) => v.severity === 'WARNING'
    ).length;

    if (fatalCount > 0) return 0;
    if (warningCount > 3) return 60;
    if (warningCount > 0) return 85;
    return 100;
  }
}
