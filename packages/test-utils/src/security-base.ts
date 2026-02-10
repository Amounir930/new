import * as fs from 'node:fs';
import * as path from 'node:path';
import { Test } from '@nestjs/testing';
import 'reflect-metadata';
import { type CallExpression, Node, Project, type SourceFile } from 'ts-morph';
import { describe, expect, it } from 'vitest';

/**
 * Validates the security compliance of a NestJS module.
 * Checks for hardcoded secrets (S1) and SQL Injection vulnerabilities (S11).
 */
export function validateModuleSecurity(module: any, providers: any[] = []) {
  describe(`${module.name} Security Compliance (Reference Architecture)`, () => {
    // S1: Secrets Management (Deep Scan)
    it('S1: Should NOT have hardcoded secrets in providers or metadata (Deep Scan)', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [module],
        providers: providers,
      }).compile();

      const modules = moduleRef.get(module, { strict: false });
      const metadataKeys = Reflect.getMetadataKeys(modules);

      for (const key of metadataKeys) {
        const value = Reflect.getMetadata(key, modules);
        try {
          validateMetadataValue(value, key.toString());
        } catch (e: any) {
          expect.fail(e.message);
        }
      }
    });

    // S11: SQL Injection (AST Analysis)
    it('S11: Should pass AST SQLi check for module files', () => {
      const rootDir = process.cwd();
      const moduleClassFile = findModuleFile(rootDir, module.name);

      if (!moduleClassFile) {
        console.warn(
          `⚠️ [S11] Could not locate source file for ${module.name}. AST check skipped.`
        );
        return;
      }

      runASTCheck(moduleClassFile);
    });
  });
}

export function validateMetadataValue(value: any, pathIdx: string) {
  if (typeof value === 'string') {
    // Postgres/MySQL/Redis connection strings
    if (/(postgres|mysql|redis):\/\//.test(value)) {
      throw new Error(
        `S1 Violation: Database connection string detected at metadata path: ${pathIdx}`
      );
    }
    // JWT Pattern (heuristic: header.payload.signature)
    if (
      /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/.test(
        value
      )
    ) {
      throw new Error(
        `S1 Violation: Potential hardcoded JWT detected at metadata path: ${pathIdx}`
      );
    }
  } else if (typeof value === 'object' && value !== null) {
    // Recursive scan
    for (const key in value) {
      if (Object.hasOwn(value, key)) {
        validateMetadataValue(value[key], `${pathIdx}.${key}`);
      }
    }
  }
}

function runASTCheck(moduleClassFile: string) {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });

  // Add all files in the module's directory
  const moduleDir = path.dirname(moduleClassFile);
  project.addSourceFilesAtPaths(path.join(moduleDir, '**/*.ts'));

  const violations: string[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    // Skip test files
    if (
      sourceFile.getFilePath().includes('.test.') ||
      sourceFile.getFilePath().includes('.spec.')
    )
      continue;

    sourceFile.forEachDescendant((node: Node) => {
      if (Node.isCallExpression(node)) {
        checkNodeForSQLi(node, sourceFile, violations);
      }
    });
  }

  expect(
    violations,
    `S11 Violations Found:\n${violations.join('\n')}`
  ).toHaveLength(0);
}

function checkNodeForSQLi(
  node: CallExpression,
  sourceFile: SourceFile,
  violations: string[]
) {
  const expression = node.getExpression();
  // Check for .raw() usage
  if (expression.getText().endsWith('.raw')) {
    // Get the line content for comment checking
    const lineNum = sourceFile.getLineAndColumnAtPos(node.getStart()).line;
    const lineContent = sourceFile.getFullText().split('\n')[lineNum - 1];

    // Strict Safe Comment Check: // safe (TICKET-123)
    const hasStrictSafeComment = /\/\/\s*safe\s*\(TICKET-\d+\)/.test(
      lineContent
    );

    if (!hasStrictSafeComment) {
      violations.push(
        `${sourceFile.getBaseName()}:${lineNum} uses sql.raw() without strict safety comment '// safe (TICKET-xxx)'`
      );
    }
  }
}

// Robust Module Finder (Apps & Packages)
function findModuleFile(root: string, moduleName: string): string | null {
  const searchDirs = [path.join(root, 'apps', 'api', 'src')];

  // Add packages/*/src
  const packagesDir = path.join(root, 'packages');
  if (fs.existsSync(packagesDir)) {
    const pkgs = fs.readdirSync(packagesDir);
    for (const pkg of pkgs) {
      const src = path.join(packagesDir, pkg, 'src');
      if (fs.existsSync(src)) {
        searchDirs.push(src);
      }
    }
  }

  for (const dir of searchDirs) {
    const res = walkAndFind(dir, moduleName);
    if (res) return res;
  }
  return null;
}

function walkAndFind(dir: string, className: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (['node_modules', 'dist', 'coverage', '.turbo'].includes(entry.name))
      continue;
    const res = processEntry(dir, entry, className);
    if (res) return res;
  }
  return null;
}

function processEntry(
  dir: string,
  entry: fs.Dirent,
  className: string
): string | null {
  const fullPath = path.join(dir, entry.name);
  if (entry.isDirectory()) {
    return walkAndFind(fullPath, className);
  }
  if (entry.isFile() && entry.name.endsWith('.ts')) {
    if (
      isLikelyModuleFile(entry.name) &&
      fileContainsClass(fullPath, className)
    ) {
      return fullPath;
    }
  }
  return null;
}

function isLikelyModuleFile(filename: string): boolean {
  return filename.includes('.module') || filename.includes('index');
}

function fileContainsClass(filePath: string, className: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes(`class ${className}`);
}

/**
 * @deprecated Use validateModuleSecurity instead. Kept for backward compatibility if needed.
 */
export const BaseSecurityTest = {
  validateModule: validateModuleSecurity,
  validateMetadataValue,
  // Expose internal helpers if needed by other tests, or keep them private to the module
  findModuleFile,
  runASTCheck,
};
