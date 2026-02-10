import fs from 'fs';
import path from 'path';

interface PhaseResult {
  passed: boolean;
  issues: number;
  score: number;
}

interface SecurityScoreReport {
  score: number;
  phases: {
    static: PhaseResult;
    protocols: PhaseResult;
    penetration: PhaseResult;
    performance: PhaseResult;
  };
  timestamp: string;
}

/**
 * Security Score Calculator
 * Aggregates results from multiple security gates into a single 0-100 score.
 */
export function calculateSecurityScore(
  reportsDir: string
): SecurityScoreReport {
  const reportFiles = {
    static: 'static-analysis-report.json',
    protocols: 's1-s9-report.json',
    penetration: 'penetration-test-full-report.json',
    performance: 'performance-report.json',
  };

  const results: Record<string, PhaseResult> = {
    static: { passed: false, issues: 0, score: 0 },
    protocols: { passed: false, issues: 0, score: 0 },
    penetration: { passed: false, issues: 0, score: 0 },
    performance: { passed: false, issues: 0, score: 0 },
  };

  // 1. Static Analysis Score
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(reportsDir, reportFiles.static), 'utf-8')
    );
    const critical =
      data.violations?.filter((v: any) => v.severity === 'CRITICAL').length ||
      0;
    const issues = data.violations?.length || 0;
    results.static = {
      passed: critical === 0,
      issues,
      score: Math.max(0, 100 - critical * 50 - issues * 5),
    };
  } catch {
    /* Report missing */
  }

  // 2. Protocols Score (S1-S9)
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(reportsDir, reportFiles.protocols), 'utf-8')
    );
    const critical =
      data.violations?.filter((v: any) => v.severity === 'CRITICAL').length ||
      0;
    const issues = data.violations?.length || 0;
    results.protocols = {
      passed: critical === 0,
      issues,
      score: Math.max(0, 100 - critical * 50 - issues * 10),
    };
  } catch {
    /* Report missing */
  }

  // 3. Penetration Testing Score
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(reportsDir, reportFiles.penetration), 'utf-8')
    );
    const critical =
      data.vulnerabilities?.filter((v: any) => v.severity === 'CRITICAL')
        .length || 0;
    const high =
      data.vulnerabilities?.filter((v: any) => v.severity === 'HIGH').length ||
      0;
    results.penetration = {
      passed: critical === 0,
      issues: data.vulnerabilities?.length || 0,
      score: Math.max(0, 100 - critical * 100 - high * 20),
    };
  } catch {
    /* Report missing */
  }

  // 4. Performance Score (Lighthouse)
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(reportsDir, reportFiles.performance), 'utf-8')
    );
    const perfScore = data.lighthouse?.performance || 0;
    results.performance = {
      passed: perfScore >= 0.9,
      issues: 0, // Performance doesn't yield "issues" in the same way
      score: perfScore * 100,
    };
  } catch {
    /* Report missing */
  }

  // Weighted Total Score
  // Static: 25%, Protocols: 25%, Penetration: 40%, Performance: 10%
  const finalScore = Math.round(
    results.static.score * 0.25 +
      results.protocols.score * 0.25 +
      results.penetration.score * 0.4 +
      results.performance.score * 0.1
  );

  return {
    score: finalScore,
    phases: results as any,
    timestamp: new Date().toISOString(),
  };
}

// CLI Execution logic
if (require.main === module) {
  const args = process.argv.slice(2);
  const reportsFlag = args.find((a) => a.startsWith('--reports='));
  const outputFlag = args.find((a) => a.startsWith('--output='));

  const reportsDir = reportsFlag ? reportsFlag.split('=')[1] : '.';
  const outputPath = outputFlag
    ? outputFlag.split('=')[1]
    : 'final-security-score.json';

  const report = calculateSecurityScore(reportsDir);
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(`📊 Security Score Calculated: ${report.score}/100`);
  console.log(`📄 Detailed report saved to: ${outputPath}`);

  if (report.score < 85) {
    process.exit(1);
  }
}
