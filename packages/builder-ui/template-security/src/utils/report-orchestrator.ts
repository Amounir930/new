import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Report Orchestrator
 * Runs individual security scripts and aggregates results into JSON reports.
 */
async function orchestrate() {
  console.log('🚀 Starting Apex Security Report Orchestration...');

  const reports = {
    protocols: {
      violations: [] as any[],
    },
    static: {
      violations: [] as any[],
    },
  };

  // 1. Run Legacy Security Scripts (S1, S3, S4)
  const scripts = [
    {
      name: 'S1: Env Config',
      path: 'tools/security-scripts/verify-env-config.ts',
      gate: 'S1',
    },
    {
      name: 'S3: Input Validation',
      path: 'tools/security-scripts/verify-input-validation.ts',
      gate: 'S3',
    },
    {
      name: 'S4: Audit Logs',
      path: 'tools/security-scripts/verify-audit-logs.ts',
      gate: 'S4',
    },
  ];

  for (const script of scripts) {
    try {
      console.log(`  Checking ${script.name}...`);
      const scriptPath = join(process.cwd(), script.path);
      execSync(`bun ${scriptPath}`, { stdio: 'pipe' });
    } catch (error: any) {
      const output = error.stdout?.toString() || error.message;
      reports.protocols.violations.push({
        rule: script.gate,
        severity: 'CRITICAL',
        message: `Verification script failed: ${script.name}`,
        details: output
          .split('\n')
          .filter((l: string) => l.includes('❌'))
          .join('\n'),
      });
    }
  }

  // 2. Run Modern Template Validators (S2, S3, S7)
  try {
    console.log('  Running Template Security Validator CLI...');
    const cliPath = join(process.cwd(), 'src/cli.ts');
    // Example: run on fashion-boutique if it exists
    execSync(`bun ${cliPath} templates/fashion-boutique`, { stdio: 'pipe' });

    const reportPath = join(
      process.cwd(),
      'templates/fashion-boutique/.security-reports/validation-report.json'
    );
    if (require('node:fs').existsSync(reportPath)) {
      const templateReport = JSON.parse(readFileSync(reportPath, 'utf-8'));
      // Merge violations
      for (const phase of Object.values(templateReport.phases) as any[]) {
        reports.protocols.violations.push(
          ...phase.violations.map((v: any) => ({
            rule: phase.name,
            severity: v.severity === 'FATAL' ? 'CRITICAL' : 'WARNING',
            message: v.message,
            file: v.file,
          }))
        );
      }
    }
  } catch (_error) {
    console.warn(
      '  ⚠️  Modern Template Validator skipped or failed (template not found)'
    );
  }

  // 3. Run Pattern Scanner (Static Analysis)
  try {
    console.log('  Running Surgical Grep Pattern Scanner...');
    const scannerPath = join(process.cwd(), 'src/scanners/pattern-scanner.ts');
    execSync(`bun ${scannerPath} --path=templates`, {
      stdio: 'pipe',
    });

    // Check if report exists
    const staticReportPath = join(process.cwd(), 'static-analysis-report.json');
    if (require('node:fs').existsSync(staticReportPath)) {
      const patternReport = JSON.parse(readFileSync(staticReportPath, 'utf-8'));
      reports.static.violations.push(...patternReport.violations);
    }
  } catch (_error) {
    console.warn('  ⚠️  Pattern Scanner failed.');
  }

  // 4. Write Final Aggregated Reports
  writeFileSync(
    's1-s9-report.json',
    JSON.stringify(reports.protocols, null, 2)
  );
  writeFileSync(
    'static-analysis-report.json',
    JSON.stringify(reports.static, null, 2)
  );

  console.log('\n✅ Orchestration Complete. Reports generated:');
  console.log('  - s1-s9-report.json');
  console.log('  - static-analysis-report.json');
}

orchestrate().catch((err) => {
  console.error('❌ Orchestration Error:', err);
  process.exit(1);
});
