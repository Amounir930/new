import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * S3: Input Validation Auditor
 * Audits NestJS controllers for missing validation pipes or raw 'any' inputs
 */

function getAllFiles(dir: string, extension: string): string[] {
  let results: string[] = [];
  const list = readdirSync(dir);
  list.forEach((file) => {
    file = join(dir, file);
    const stat = statSync(file);
    if (stat?.isDirectory()) {
      results = results.concat(getAllFiles(file, extension));
    } else if (file.endsWith(extension)) {
      results.push(file);
    }
  });
  return results;
}

function auditControllers() {
  console.log('🔍 S3: Auditing Controller Input Validation...');

  const controllers = getAllFiles('apps/api/src', '.controller.ts');
  let violations = 0;

  controllers.forEach((file) => {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    // Check for global validation pipe in the file or assumed global
    const _hasPipe =
      content.includes('UsePipes') || content.includes('ZodValidationPipe');

    lines.forEach((line, index) => {
      // 1. Detect any type in Body/Query/Param (S3 violation)
      if (line.match(/@(Body|Query|Param)\(.*\).*:.*any/)) {
        if (!line.trim().startsWith('//')) {
          console.error(
            `❌ S3 VIOLATION: 'any' type in input decorator at ${file}:${
              index + 1
            }`
          );
          console.error(`   > ${line.trim()}`);
          violations++;
        }
      }

      // 2. Detect mutation endpoints without DTO-like type
      // Simple regex to catch methods like: async create(@Body() data) { ... }
      // where the type is missing or just an object
      if (line.match(/@(Post|Put|Patch|Delete)\(/)) {
        const methodLine = lines[index + 1] || '';
        if (methodLine.includes('@Body') && !methodLine.includes(':')) {
          console.error(
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
      console.warn(
        `⚠️  S3 WARNING: Controller ${file} uses @Body but no DTO/Schema pattern detected.`
      );
    }
  });

  // 4. S3.3 Payload Size Check (New)
  console.log('🔍 S3.3: Verifying Payload Size Limits in main.ts...');
  const mainPath = 'apps/api/src/main.ts';
  const mainContent = readFileSync(mainPath, 'utf-8');

  // Check for explicit limit settings (e.g., '10mb', '1mb')
  const hasLimit =
    mainContent.includes('limit:') &&
    (mainContent.includes('json') || mainContent.includes('urlencoded'));

  if (!hasLimit) {
    console.error(
      `❌ S3.3 VIOLATION: Global payload size limit not found in ${mainPath}`
    );
    console.error(
      '   > Security best practice requires explicit limits to prevent DoS.'
    );
    violations++;
  } else {
    console.log('✅ S3.3: Global payload size limit detected');
  }

  if (violations > 0) {
    console.error(
      `\n🚨 S3 Audit Failed: Found ${violations} critical input validation violations.`
    );
    process.exit(1);
  }

  console.log(
    `✅ S3: Input validation audit complete. Checked ${controllers.length} controllers.`
  );
}

auditControllers();
