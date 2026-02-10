import { readFileSync } from 'node:fs';
import { EnvSchema } from '../../packages/config/src/schema';

/**
 * S1: Environment Consistency Checker
 * Ensures .env.example matches @apex/config EnvSchema
 */

function verifyEnvConsistency() {
  console.log('🔍 S1: Verifying Environment Consistency...');

  // 1. Load .env.example keys
  const envExampleContent = readFileSync('.env.example', 'utf-8');
  const exampleKeys = envExampleContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('=')[0].trim());

  // 2. Get Schema keys
  const schemaKeys = Object.keys(EnvSchema.shape);

  // 3. Compare
  const missingInSchema = exampleKeys.filter((k) => !schemaKeys.includes(k));
  const missingInExample = schemaKeys.filter((k) => !exampleKeys.includes(k));

  let failure = false;

  if (missingInSchema.length > 0) {
    console.error(
      '❌ S1 VIOLATION: Keys in .env.example are missing from config schema:'
    );
    for (const k of missingInSchema) {
      console.error(`   - ${k}`);
    }
    failure = true;
  }

  if (missingInExample.length > 0) {
    // Note: Some might be optional/defaulted, but for S1 we want them in .env.example for documentation
    console.error(
      '❌ S1 VIOLATION: Keys in config schema are missing from .env.example:'
    );
    for (const k of missingInExample) {
      console.error(`   - ${k}`);
    }
    failure = true;
  }

  if (failure) {
    process.exit(1);
  }

  console.log(
    '✅ S1: Environment consistency verified (Schema vs .env.example)'
  );
}

verifyEnvConsistency();
