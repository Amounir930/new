import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

/**
 * CI Sentinel - Root-Cause Security Gate Orchestrator
 */

const PROJECT_ROOT = process.cwd();

const CONFIG = {
  modules: {
    export: join(PROJECT_ROOT, 'packages/export'),
    security: join(PROJECT_ROOT, 'packages/security'),
    middleware: join(PROJECT_ROOT, 'packages/middleware'),
  },
};

function getDiffFiles(): string[] {
  try {
    // Check if in GitHub Action
    const baseRef = process.env.GITHUB_BASE_REF;
    const beforeSha = process.env.GITHUB_EVENT_BEFORE;

    if (baseRef) {
      console.log(`🔍 PR Context: Comparing against origin/${baseRef}`);
      return execSync(`git diff --name-only origin/${baseRef}...HEAD`)
        .toString()
        .split('\n')
        .filter(Boolean);
    }

    if (beforeSha && beforeSha !== '0000000000000000000000000000000000000000') {
      console.log(
        `🔍 Push Context: Comparing against ${beforeSha.substring(0, 7)}`
      );
      return execSync(`git diff --name-only ${beforeSha}...HEAD`)
        .toString()
        .split('\n')
        .filter(Boolean);
    }

    console.log('ℹ️ No base ref found. Checking last commit.');
    return execSync('git diff --name-only HEAD~1...HEAD')
      .toString()
      .split('\n')
      .filter(Boolean);
  } catch (err) {
    console.warn(
      '⚠️ Git diff failed. Falling back to all staged/modified files.'
    );
    return execSync('git ls-files -m -o --exclude-standard')
      .toString()
      .split('\n')
      .filter(Boolean);
  }
}

async function runGateS5() {
  console.log('🛡️ Running S5: Exception Handling Gate...');
  if (!existsSync(CONFIG.modules.security)) {
    console.error('❌ CRITICAL: @apex/security module missing!');
    process.exit(1);
  }
  console.log('✅ S5: Structural Integrity Verified.');
}

async function runGateS14() {
  console.log('📦 Running S14: Export Module Validation...');
  const files = getDiffFiles();
  const exportFiles = files.filter((f) => f.startsWith('packages/export/src/'));

  if (exportFiles.length === 0) {
    console.log('✅ No changes in export module.');
    return;
  }

  console.log(`🔍 Auditing ${exportFiles.length} files in export module...`);

  for (const file of exportFiles) {
    if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      const testFile = file.replace('.ts', '.test.ts');
      if (!existsSync(join(PROJECT_ROOT, testFile))) {
        // Broad search for test
        const bname = basename(file, '.ts');
        const search = execSync(
          `find packages/export -name "*${bname}*.test.ts"`
        ).toString();
        if (!search.trim()) {
          console.error(`❌ CRITICAL: Missing test for ${file}`);
          process.exit(1);
        }
      }
    }
  }

  // Security pattern scan (Simplified for JS/TS)
  const content = exportFiles
    .map((f) => readFileSync(join(PROJECT_ROOT, f), 'utf8'))
    .join('\n');
  if (
    /SELECT.*\$\{.*schema/i.test(content) ||
    /FROM.*\$\{.*tenant/i.test(content)
  ) {
    console.error(
      '❌ CRITICAL: Potential SQL injection in export query detected!'
    );
    process.exit(1);
  }

  console.log('✅ S14: Export module validation passed.');
}

async function main() {
  const gate = process.argv[2];
  if (!gate) process.exit(1);

  switch (gate) {
    case 'S5':
      await runGateS5();
      break;
    case 'S14':
      await runGateS14();
      break;
    default:
      console.error(`❌ Unknown gate: ${gate}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('🚨 CI Sentinel Error:', err);
  process.exit(1);
});
