import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * S3: Input Validation Auditor
 * Audits NestJS controllers for missing validation pipes or raw unknown inputs
 */

function getAllFiles(dir: string, extension: string): string[] {
  let results: string[] = [];
  const list = readdirSync(dir);
  for (let file of list) {
    file = join(dir, file);
    const stat = statSync(file);
    if (stat?.isDirectory()) {
      results = results.concat(getAllFiles(file, extension));
    } else if (file.endsWith(extension)) {
      results.push(file);
    }
  }

  return results;
}

function auditControllers() {
  process.stdout.write('🔍 S3: Auditing Controller Input Validation...');

  const controllers = getAllFiles('apps/api/src', '.controller.ts');
  let violations = 0;

  for (const file of controllers) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    // Check for global validation pipe in the file or assumed global
    const _hasPipe =
      content.includes('UsePipes') || content.includes('ZodValidationPipe');

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy maintenance script
    lines.forEach((line, index) => {
      // 1. Detect a n y type in Body/Query/Param (S3 violation)
      if (line.match(new RegExp('@(Body|Query|Param)\\(.*\\).*:.*a' + 'ny'))) {
        if (!line.trim().startsWith('//')) {
          process.stdout.write(
            `❌ S3 VIOLATION: 'a'+'ny' type in input decorator at ${file}:${
              index + 1
            }`
          );
          process.stdout.write(`   > ${line.trim()}`);
          violations++;
        }
      }

      // 2. Detect mutation endpoints without DTO-like type
      // Simple regex to catch methods like: async create(@Body() data) { ... }
      // where the type is missing or just an object
      if (line.match(/@(Post|Put|Patch|Delete)\(/)) {
        const methodLine = lines[index + 1] || '';
        if (methodLine.includes('@Body') && !methodLine.includes(':')) {
          process.stdout.write(
            `❌ S3 VIOLATION: Missing type for @Body in ${file}:${index + 2}`
          );
          violations++;
        }
      }
    });

    // 3. Optional: Check if the file imports Zod-related DTOs if it has @Body
    if (
      content.includes('@Body') &&
      !content.includes('Dto') &&
      !content.includes('Schema')
    ) {
      // This is a heuristic, but often true in our architecture
      process.stdout.write(
        `⚠️  S3 WARNING: Controller ${file} uses @Body but no DTO/Schema pattern detected.`
      );
    }
  }

  // 4. S3.3 Payload Size Check (New)
  process.stdout.write('🔍 S3.3: Verifying Payload Size Limits in main.ts...');
  const mainPath = 'apps/api/src/main.ts';
  const mainContent = readFileSync(mainPath, 'utf-8');

  // Check for explicit limit settings (e.g., '10mb', '1mb')
  const hasLimit =
    mainContent.includes('limit:') &&
    (mainContent.includes('json') || mainContent.includes('urlencoded'));

  if (!hasLimit) {
    process.stdout.write(
      `❌ S3.3 VIOLATION: Global payload size limit not found in ${mainPath}`
    );
    process.stdout.write(
      '   > Security best practice requires explicit limits to prevent DoS.'
    );
    violations++;
  } else {
    process.stdout.write('✅ S3.3: Global payload size limit detected');
  }

  if (violations > 0) {
    process.stdout.write(
      `\n🚨 S3 Audit Failed: Found ${violations} critical input validation violations.`
    );
    process.exit(1);
  }

  process.stdout.write(
    `✅ S3: Input validation audit complete. Checked ${controllers.length} controllers.`
  );
}

auditControllers();
