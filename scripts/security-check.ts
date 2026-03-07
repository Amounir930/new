#!/usr/bin/env bun
/**
 * Apex Security Shield - Pre-Commit Security Check
 * Enforces S1, S3, and S10 rules on staged files.
 */

import { existsSync, readFileSync } from 'node:fs';

const color = {
  red: (msg: string) => `\x1b[31m${msg}\x1b[0m`,
  green: (msg: string) => `\x1b[32m${msg}\x1b[0m`,
  cyan: (msg: string) => `\x1b[36m${msg}\x1b[0m`,
  gray: (msg: string) => `\x1b[90m${msg}\x1b[0m`,
};

const args = process.argv.slice(2);
const stagedFiles = args.filter((f) => existsSync(f));

if (stagedFiles.length === 0) {
  process.stdout.write(
    color.gray('No staged files to scan. Skipping security check.')
  );
  process.exit(0);
}

process.stdout.write(color.cyan('\n🛡️  Apex Security Shield'));
process.stdout.write(
  color.gray(`   Scanning ${stagedFiles.length} staged file(s)...\n`)
);

let violations = 0;

function report(rule: string, message: string, file: string) {
  process.stdout.write(color.red(`❌ [${rule}] ${message}`));
  process.stdout.write(color.gray(`   File: ${file}`));
  violations++;
}

// S1: Environment Validation (Config Package)
// Rule: packages/config must use Zod
const configFiles = stagedFiles.filter((f) => f.includes('packages/config'));
for (const file of configFiles) {
  if (file.endsWith('.ts')) {
    const content = readFileSync(file, 'utf-8');
    // Simple heuristic: If it defines a schema, it must import zod.
    // We know schema.ts is the main one, but let's be broad.
    if (file.includes('schema.ts') || file.includes('index.ts')) {
      if (!content.includes("from 'zod'") && !content.includes('from "zod"')) {
        // It might be a file that doesn't need it, but if it's the schema source...
        // Let's check if it exports EnvSchema or similar
        if (content.includes('export const EnvSchema')) {
          report('S1', 'Environment Schema must use Zod for validation.', file);
        }
      }
    }
  }
}

// S3: Input Validation (Controllers)
// Rule: Controllers must use ZodValidationPipe or DTOs
const controllers = stagedFiles.filter((f) => f.endsWith('.controller.ts'));
for (const file of controllers) {
  const content = readFileSync(file, 'utf-8');

  // Check for @Body() usage
  const hasBody = content.includes('@Body(');

  if (hasBody) {
    // Must use ZodValidationPipe or a Pipe at the controller/method level
    // OR use a DTO that is validated elsewhere (harder to check statically without full AST)
    // Strict Rule: Require 'ZodValidationPipe' OR 'ValidationPipe' text in the file if @Body is used.
    // This is a heuristic.
    const hasValidationPipe =
      content.includes('ZodValidationPipe') ||
      content.includes('ValidationPipe') ||
      content.includes('ParseUUIDPipe') ||
      content.includes('ParseIntPipe');

    if (!hasValidationPipe) {
      // Maybe it's globally validated? But rule says "Scan staged controllers for ZodValidationPipe or strict DTO decorators"
      // If they use a DTO, it should be like @Body() dto: createDto
      // Let's warn if no "Pipe" word is found near @Body or imported.

      // A common pattern is @UsePipes(new ZodValidationPipe(...))
      // Or global pipe.
      // If global pipe is used (S3 says "ZodValidationPipe globally"), maybe we just check DTO naming convention?
      // "Scan staged controllers for ZodValidationPipe or strict DTO decorators"

      // Let's look for explicit DTO imports usually ending in .dto
      const hasDtoImport = content.includes('.dto');

      if (!hasDtoImport && !hasValidationPipe) {
        report(
          'S3',
          'Controller uses @Body() without visible ValidationPipe or DTO import.',
          file
        );
      }
    }
  }
}

// S10: Secret Detection (High Entropy / Pattern Matching)
// Comprehensive patterns based on Gitleaks/Semgrep rules
const SECRET_PATTERNS = [
  { name: 'AWS Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private Key', regex: /-----BEGIN PRIVATE KEY-----/ },
  { name: 'Generic Secret', regex: /['"][A-Za-z0-9+/]{40,}['"]/ }, // 40+ chars base64-ish string in quotes
  { name: 'Hardcoded Password', regex: /password\s*=\s*['"][^'"]{8,}['"]/i },
  { name: 'GitHub Token', regex: /gh[pso]_[a-zA-Z0-9]{36}/ },
  { name: 'Stripe API Key', regex: /sk_live_[0-9a-zA-Z]{24}/ },
  {
    name: 'SendGrid API Key',
    regex: /SG\.[0-9a-zA-Z_-]{22}\.[0-9a-zA-Z_-]{43}/,
  },
  {
    name: 'Slack Webhook',
    regex:
      /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/,
  },
];

for (const file of stagedFiles) {
  if (
    file.includes('test.ts') ||
    file.includes('spec.ts') ||
    file.includes('mock')
  )
    continue; // Skip tests/mocks

  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  for (const pattern of SECRET_PATTERNS) {
    for (const line of lines) {
      // S10 FIX: Allow explicit bypass via comment
      if (line.includes('gitleaks:allow')) continue;

      if (pattern.regex.test(line)) {
        report('S10', `Potential secret detected: ${pattern.name}`, file);
        break; // One violation per pattern per file is enough for reporting
      }
    }
  }
}

if (violations > 0) {
  process.stdout.write(
    color.red(`\n⛔ Commit Blocked: ${violations} security violation(s) found.`)
  );
  process.exit(1);
} else {
  process.stdout.write(color.green('✅ Security Check Passed'));
  process.exit(0);
}
