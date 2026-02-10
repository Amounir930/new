/**
 * Template Security Validator
 *
 * Master validation pipeline that orchestrates all S1-S9 checkers.
 *
 * @module @apex/template-security
 */

import { S2IsolationChecker } from './validators/s2-isolation.checker';
import { S3ValidationChecker } from './validators/s3-validation.checker';
import { S7EncryptionChecker } from './validators/s7-encryption.checker';

export interface ValidationResult {
  templateName: string;
  overallScore: number;
  passed: boolean;
  timestamp: string;
  phases: {
    s2Isolation: PhaseResult;
    s3Validation: PhaseResult;
    s7Encryption: PhaseResult;
  };
  summary: {
    totalViolations: number;
    fatalViolations: number;
    warningViolations: number;
  };
}

export interface PhaseResult {
  name: string;
  passed: boolean;
  score: number;
  violations: any[];
  duration: number;
}

export class TemplateSecurityValidator {
  private s2Checker = new S2IsolationChecker();
  private s3Checker = new S3ValidationChecker();
  private s7Checker = new S7EncryptionChecker();

  /**
   * Master validation pipeline
   * MUST pass ALL tests before template approved
   */
  async validateTemplate(templatePath: string): Promise<ValidationResult> {
    const templateName = templatePath.split('/').pop() || 'unknown';
    const startTime = Date.now();

    console.log(`🔐 Starting security validation for: ${templateName}`);

    // Phase 1: S2 Tenant Isolation
    console.log('  ├─ S2: Tenant Isolation...');
    const s2Start = Date.now();
    const s2Result = await this.s2Checker.validate(templatePath);
    const s2Duration = Date.now() - s2Start;
    console.log(
      `  │  ${s2Result.passed ? '✅' : '❌'} Score: ${
        s2Result.score
      }/100 (${s2Duration}ms)`
    );

    // Phase 2: S3 Input Validation
    console.log('  ├─ S3: Input Validation...');
    const s3Start = Date.now();
    const s3Result = await this.s3Checker.validate(templatePath);
    const s3Duration = Date.now() - s3Start;
    console.log(
      `  │  ${s3Result.passed ? '✅' : '❌'} Score: ${
        s3Result.score
      }/100 (${s3Duration}ms)`
    );

    // Phase 3: S7 Encryption
    console.log('  ├─ S7: Encryption...');
    const s7Start = Date.now();
    const s7Result = await this.s7Checker.validate(templatePath);
    const s7Duration = Date.now() - s7Start;
    console.log(
      `  │  ${s7Result.passed ? '✅' : '❌'} Score: ${
        s7Result.score
      }/100 (${s7Duration}ms)`
    );

    // Calculate overall score
    const overallScore = Math.round(
      (s2Result.score + s3Result.score + s7Result.score) / 3
    );

    const allViolations = [
      ...s2Result.violations,
      ...s3Result.violations,
      ...s7Result.violations,
    ];

    const fatalCount = allViolations.filter(
      (v) => v.severity === 'FATAL'
    ).length;
    const warningCount = allViolations.filter(
      (v) => v.severity === 'WARNING'
    ).length;

    const passed = fatalCount === 0;

    const totalDuration = Date.now() - startTime;

    console.log(
      `\n  └─ Overall: ${
        passed ? '✅ PASSED' : '❌ FAILED'
      } | Score: ${overallScore}/100`
    );
    console.log(
      `     Violations: ${fatalCount} fatal, ${warningCount} warnings (${totalDuration}ms)\n`
    );

    return {
      templateName,
      overallScore,
      passed,
      timestamp: new Date().toISOString(),
      phases: {
        s2Isolation: {
          name: 'S2: Tenant Isolation',
          passed: s2Result.passed,
          score: s2Result.score,
          violations: s2Result.violations,
          duration: s2Duration,
        },
        s3Validation: {
          name: 'S3: Input Validation',
          passed: s3Result.passed,
          score: s3Result.score,
          violations: s3Result.violations,
          duration: s3Duration,
        },
        s7Encryption: {
          name: 'S7: Encryption',
          passed: s7Result.passed,
          score: s7Result.score,
          violations: s7Result.violations,
          duration: s7Duration,
        },
      },
      summary: {
        totalViolations: allViolations.length,
        fatalViolations: fatalCount,
        warningViolations: warningCount,
      },
    };
  }

  /**
   * Generate JSON report
   */
  generateReport(result: ValidationResult): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * Generate human-readable summary
   */
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: template logic
  generateSummary(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push(`# Security Validation Report: ${result.templateName}`);
    lines.push(`Generated: ${result.timestamp}`);
    lines.push('\n## Overall Result');
    lines.push(`- **Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`- **Score:** ${result.overallScore}/100`);
    lines.push(
      `- **Violations:** ${result.summary.fatalViolations} fatal, ${result.summary.warningViolations} warnings`
    );

    lines.push('\n## Phase Results');

    for (const [_key, phase] of Object.entries(result.phases)) {
      lines.push(`\n### ${phase.name}`);
      lines.push(`- Score: ${phase.score}/100`);
      lines.push(`- Status: ${phase.passed ? '✅ PASSED' : '❌ FAILED'}`);
      lines.push(`- Duration: ${phase.duration}ms`);

      if (phase.violations.length > 0) {
        lines.push(`- Violations: ${phase.violations.length}`);

        for (const v of phase.violations) {
          lines.push(`  - [${v.severity}] ${v.rule}: ${v.message}`);
          if (v.file) lines.push(`    File: ${v.file}:${v.line || 0}`);
          if (v.suggestion) lines.push(`    💡 ${v.suggestion}`);
        }
      }
    }

    return lines.join('\n');
  }
}

// Export all validators
export * from './validators/s2-isolation.checker';
export * from './validators/s3-validation.checker';
export * from './validators/s7-encryption.checker';
