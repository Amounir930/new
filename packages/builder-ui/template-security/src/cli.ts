#!/usr/bin/env bun
/**
 * Template Security Validation CLI
 *
 * Usage: bun validate-template <template-path>
 *
 * @example
 * bun validate-template ./templates/fashion-boutique
 */

import { join } from 'node:path';
import { TemplateSecurityValidator } from './index';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Error: Template path required');
  console.log('\nUsage: bun validate-template <template-path>');
  console.log('\nExample:');
  console.log('  bun validate-template ./templates/fashion-boutique');
  process.exit(1);
}

const templatePath = args[0];

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║       🔐 Apex Template Security Validator v1.0          ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const validator = new TemplateSecurityValidator();

(async () => {
  try {
    const result = await validator.validateTemplate(templatePath);

    // Generate reports
    const jsonReport = validator.generateReport(result);
    const summary = validator.generateSummary(result);

    // Save reports
    const reportDir = join(templatePath, '.security-reports');
    await Bun.write(join(reportDir, 'validation-report.json'), jsonReport);
    await Bun.write(join(reportDir, 'validation-summary.md'), summary);

    console.log('📄 Reports saved:');
    console.log(`  - ${join(reportDir, 'validation-report.json')}`);
    console.log(`  - ${join(reportDir, 'validation-summary.md')}\n`);

    // Print summary
    console.log(summary);

    // Exit with appropriate code
    if (result.passed) {
      console.log('\n✅ Template validation PASSED');
      process.exit(0);
    } else {
      console.log('\n❌ Template validation FAILED');
      console.log(
        `   Fix ${result.summary.fatalViolations} fatal violations to proceed\n`
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation error:', error);
    process.exit(1);
  }
})();
