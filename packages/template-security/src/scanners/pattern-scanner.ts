import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Violation {
  rule: string;
  severity: 'CRITICAL' | 'WARNING';
  message: string;
  file: string;
  line: number;
}

const PATTERNS = [
  {
    name: 'XSS: dangerouslySetInnerHTML',
    regex: /dangerouslySetInnerHTML/g,
    severity: 'CRITICAL',
    message:
      'Direct HTML injection detected. Use safe React components instead.',
  },
  {
    name: 'XSS: innerHTML',
    regex: /\.innerHTML\s*=/g,
    severity: 'CRITICAL',
    message: 'Direct DOM manipulation detected. Potential XSS risk.',
  },
  {
    name: 'RCE: eval',
    regex: /eval\(.*\)/g,
    severity: 'CRITICAL',
    message: 'Dynamic code execution (eval) detected. High RCE risk.',
  },
  {
    name: 'Isolation: Public Schema Access',
    regex: /public\./g,
    severity: 'CRITICAL',
    message:
      'Direct public schema access detected. S2 violation - use tenant-specific schemas.',
  },
  {
    name: 'Security: document.cookie',
    regex: /document\.cookie/g,
    severity: 'WARNING',
    message:
      'Direct cookie access detected. Ensure HttpOnly flags are used via middleware.',
  },
];

function getAllFiles(dir: string): string[] {
  let results: string[] = [];
  if (!statSync(dir).isDirectory()) return [dir];

  const list = readdirSync(dir);
  for (const file of list) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        results = results.concat(getAllFiles(filePath));
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      results.push(filePath);
    }
  }
  return results;
}

function scan(scanPath: string) {
  console.log(`🔍 Pattern Scanner: Scanning ${scanPath}...`);
  const files = getAllFiles(scanPath);
  const violations: Violation[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (const pattern of PATTERNS) {
      for (const [index, line] of lines.entries()) {
        if (line.match(pattern.regex) && !line.trim().startsWith('//')) {
          violations.push({
            rule: pattern.name,
            severity: pattern.severity as any,
            message: pattern.message,
            file,
            line: index + 1,
          });
        }
      }
    }
  }

  const report = {
    violations,
    summary: {
      total: violations.length,
      critical: violations.filter((v) => v.severity === 'CRITICAL').length,
      warning: violations.filter((v) => v.severity === 'WARNING').length,
    },
  };

  writeFileSync('static-analysis-report.json', JSON.stringify(report, null, 2));
  console.log(`✅ Scan Complete: Found ${violations.length} violations.`);
}

const args = process.argv.slice(2);
const pathArg = args.find((a) => a.startsWith('--path='));
const scanPath = pathArg ? pathArg.split('=')[1] : 'templates';

scan(scanPath);
