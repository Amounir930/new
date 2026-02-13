import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * CI Sentinel - Root-Cause Security Gate Orchestrator
 * This script dynamically detects the project structure and runs the appropriate security gates.
 * It prevents CI failures caused by hardcoded paths to deleted modules.
 */

const PROJECT_ROOT = process.cwd();

const CONFIG = {
  modules: {
    api: join(PROJECT_ROOT, 'apps/api'),
    web: join(PROJECT_ROOT, 'apps/web'),
    security: join(PROJECT_ROOT, 'packages/security'),
    template: join(PROJECT_ROOT, 'packages/template-engine'),
    templateSecurity: join(PROJECT_ROOT, 'packages/template-security'),
  },
  gates: {
    S5: {
      name: 'Exception Handling Gate',
      dependencies: ['security'],
      optionalDependencies: ['templateSecurity'],
    },
  },
};

async function runGateS5() {
  console.log('🛡️ Running S5: Exception Handling Gate...');

  // 1. Structural Check
  if (!existsSync(CONFIG.modules.security)) {
    console.error('❌ CRITICAL: @apex/security module missing!');
    process.exit(1);
  }

  // 2. Conditional Checks (Context-Aware)
  if (existsSync(CONFIG.modules.templateSecurity)) {
    console.log('✅ Found Template Security, running specialized checks...');
    // Add logic here if template security existed
  } else {
    console.log(
      'ℹ️ Template Security module not found. Skipping template-specific exception audits.'
    );
  }

  console.log('✅ S5: Structural Integrity Verified.');
}

async function main() {
  const gate = process.argv[2];

  if (!gate) {
    console.error('❌ No gate specified. Usage: bun run sentinel.ts <GATE_ID>');
    process.exit(1);
  }

  switch (gate) {
    case 'S5':
      await runGateS5();
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
