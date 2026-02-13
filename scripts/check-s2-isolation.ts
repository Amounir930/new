#!/usr/bin/env bun
/**
 * S2 Data Isolation Checker (AST Edition)
 * Uses ts-morph to analyze the Abstract Syntax Tree for security violations.
 *
 * Capabilities:
 * - Detects direct access to public schema (AST string literals).
 * - Detects unsafe raw SQL usage specific to Drizzle ORM.
 * - Enforces tenant isolation in queries.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Node, Project } from 'ts-morph';

// Configuration
const PROJECT_ROOT = process.cwd();
const DB_PACKAGE_PATH = join(PROJECT_ROOT, 'packages/db/src');

console.log('\n🛡️  S2 Data Isolation Advanced Checker (AST)');
console.log('   Scanning packages/db/src for semantic violations...\n');

if (!existsSync(DB_PACKAGE_PATH)) {
  console.error(`❌ Error: Database package not found at ${DB_PACKAGE_PATH}`);
  process.exit(1);
}

// Initialize Project
const project = new Project({
  skipAddingFilesFromTsConfig: true,
});

// Add Source Files
project.addSourceFilesAtPaths(join(DB_PACKAGE_PATH, '**/*.ts'));

let criticalViolations = 0;
let warnings = 0;

function report(type: 'CRITICAL' | 'WARNING', message: string, node: Node) {
  const sourceFile = node.getSourceFile();
  const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());
  const filePath = sourceFile.getFilePath().replace(PROJECT_ROOT, '');

  console.log(`\n${type === 'CRITICAL' ? '❌' : '⚠️ '} ${type}: ${message}`);
  console.log(`   📁 .${filePath}:${line}:${column}`);
  console.log(`   Code: ${node.getText().substring(0, 80).trim()}...`);

  if (type === 'CRITICAL') criticalViolations++;
  else warnings++;
}

// Analysis Pass
for (const sourceFile of project.getSourceFiles()) {
  if (
    sourceFile.getFilePath().includes('.test.') ||
    sourceFile.getFilePath().includes('.spec.')
  )
    continue;

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: analysis script
  sourceFile.forEachDescendant((node: Node) => {
    // 1. Check for "public." string literals (Schema Bypass)
    if (
      Node.isStringLiteral(node) ||
      Node.isNoSubstitutionTemplateLiteral(node)
    ) {
      const text = node.getLiteralText();
      if (text.includes('public.') && !text.includes('search_path')) {
        // Allow comments/safe usage if needed, but start strict
        report('CRITICAL', 'Direct access to "public" schema detected', node);
      }
    }

    // 3. Check for Raw SQL without Tenant Context (The Verification)
    if (Node.isTaggedTemplateExpression(node)) {
      if (node.getTag().getText() === 'sql') {
        const text = node.getTemplate().getText();

        // Skip empty or simple initialization queries
        if (text.length < 20) return;

        // Required markers for multi-tenant isolation
        const hasTenantContext =
          text.includes('tenant_id') ||
          text.includes('organization_id') ||
          text.includes('search_path') ||
          text.includes('WHERE'); // Basic heuristic: must have a WHERE clause at minimum

        if (!hasTenantContext) {
          report(
            'WARNING',
            'Raw SQL query detected without visible tenant isolation (missing tenant_id/search_path/WHERE)',
            node
          );
        }
      }
    }
    // 2. Check for sql.raw() usage (Dangerous Bypass)
    if (Node.isCallExpression(node)) {
      const expression = node.getExpression();
      if (Node.isPropertyAccessExpression(expression)) {
        if (
          expression.getName() === 'raw' &&
          expression.getExpression().getText() === 'sql'
        ) {
          report(
            'WARNING',
            'Unsafe usage of sql.raw() detected. Verify manual sanitization.',
            node
          );
        }
      }
    }

    // 4. Check for RLS (Row-Level Security) Enforcement (S2 Requirement)
    if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
      const text = node.getLiteralText();
      if (text.includes('ALTER TABLE') && text.includes('ENABLE ROW LEVEL SECURITY')) {
        console.log('   ✅ Found RLS Enforcement:', text.substring(0, 50).trim());
      }
    }
  });
}

// 5. Global RLS Coverage Check (Post-Pass)
console.log('\n🔍 Running Post-Pass RLS Coverage Check...');
const schemaContent = project.getSourceFiles().find(f => f.getFilePath().endsWith('schema.ts'))?.getFullText() || '';
if (!schemaContent.includes('pgPolicy') && criticalViolations === 0) {
  report('WARNING', 'No pgPolicy found in schema.ts. Ensure Row-Level Security is active.', project.getSourceFiles()[0]);
}

console.log(`\n${'='.repeat(60)}`);
console.log(
  `📊 Scan Complete: ${criticalViolations} Critical, ${warnings} Warnings`
);
console.log('='.repeat(60));

if (criticalViolations > 0) {
  console.error('\n❌ FAILED: Critical security violations found.');
  process.exit(1);
} else {
  console.log('\n✅ PASSED: No critical isolation violations found.');
}
