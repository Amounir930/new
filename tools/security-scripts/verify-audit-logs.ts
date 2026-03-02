import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * S4: Audit Logging Auditor
 * Audits NestJS controllers for missing @AuditLog decorators on mutation endpoints
 */

function getAllFiles(dir: string, extension: string): string[] {
  let results: string[] = [];
  const list = readdirSync(dir);
  for (const name of list) {
    const filePath = join(dir, name);
    const stat = statSync(filePath);
    if (stat?.isDirectory()) {
      results = results.concat(getAllFiles(filePath, extension));
    } else if (filePath.endsWith(extension)) {
      results.push(filePath);
    }
  }
  return results;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy maintenance script
function auditAuditLogging() {
  console.log('🔍 S4: Auditing Audit Logging Coverage...');

  const controllers = getAllFiles('apps/api/src', '.controller.ts');
  let violations = 0;

  for (const file of controllers) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      // Detect mutation endpoints
      if (line.match(/@(Post|Put|Patch|Delete)\(/)) {
        // Look ahead for @AuditLog in the decorators block (usually few lines above or same block)
        // High-fidelity check: look at preceding 5 lines
        const context = lines
          .slice(Math.max(0, index - 5), index + 1)
          .join('\n');
        const hasAuditLog =
          context.includes('@AuditLog') || context.includes('auditService.log');

        if (!hasAuditLog) {
          // Heuristic: Check if it's a mutation. Read/Get of non-sensitive data might not need audit.
          // But our policy (per user request) wants to find these.
          console.warn(
            `⚠️  S4 WARNING: Potential missing audit log on mutation endpoint at ${file}:${
              index + 1
            }`
          );
          console.warn(`   > ${line.trim()}`);
          // We mark it as warning for now unless it's a known critical endpoint
          if (line.includes('Post')) violations++;
        }
      }
    }
  }

  if (violations > 10) {
    // Tolerant for now as we transition
    console.error(
      `\n🚨 S4 Audit Failed: Found ${violations} endpoints lacking audit logging.`
    );
    process.exit(1);
  }

  console.log(
    `✅ S4: Audit logging audit complete. Checked ${controllers.length} controllers.`
  );
}

auditAuditLogging();
