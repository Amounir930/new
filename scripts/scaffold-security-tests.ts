import * as fs from 'node:fs';
import * as path from 'node:path';
import { Project } from 'ts-morph';

/**
 * Apex Security Test Scaffolder
 * Recursively finds NestJS modules and generates *.security.spec.ts files.
 */

const PROJECT_ROOT = process.cwd();
const APPS_DIR = path.join(PROJECT_ROOT, 'apps');
const PACKAGES_DIR = path.join(PROJECT_ROOT, 'packages');

function findAllModules(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  let results: string[] = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat?.isDirectory()) {
      if (
        ['node_modules', 'dist', 'coverage', '.turbo', '.next'].includes(file)
      )
        continue;
      results = results.concat(findAllModules(fullPath));
    } else {
      // Heuristic for NestJS Modules: ends with .module.ts
      if (file.endsWith('.module.ts')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function generateSecurityTest(modulePath: string) {
  const dir = path.dirname(modulePath);
  const filename = path.basename(modulePath, '.ts'); // e.g., 'auth.module'
  const testFilename = `${filename}.security.spec.ts`;
  const testPath = path.join(dir, testFilename);

  // Skip if already exists
  if (fs.existsSync(testPath)) {
    console.log(`⏩ Skipping ${testFilename} (exists)`);
    return;
  }

  // Read Module Class Name
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(modulePath);
  const classDecl = sourceFile.getClasses()[0];

  if (!classDecl) {
    console.warn(`⚠️  Skipping ${modulePath}: No class found.`);
    return;
  }

  const className = classDecl.getName();
  if (!className) return;

  // Calculate relative path to test-utils
  // Note: In monorepo, usually use package alias, but let's check tsconfig paths or just use relative for robustness or alias if configured.
  // Assuming @apex/test-utils is available or we use relative path.
  // Best practice: use the package alias '@apex/test-utils' if acceptable by bundler,
  // otherwise extensive relative path calculation.
  // We'll stick to @apex/test-utils assuming tsconfig is set up (it is in package.json).

  const content = `
import { Test, TestingModule } from '@nestjs/testing';
import { ${className} } from './${path.basename(modulePath, '.ts')}';
import { BaseSecurityTest } from '@apex/test-utils';

describe('${className} Security Checks', () => {
    let moduleRef: TestingModule;

    beforeAll(async () => {
        // BaseSecurityTest.validateModule checks metadata and AST
        // We can also extend the class if we want instance-based checks
    });

    // Run Standard Security Suite
    BaseSecurityTest.validateModule(${className});
});
`.trim();

  fs.writeFileSync(testPath, content);
  console.log(`✅ Generated ${testFilename}`);
}

async function main() {
  console.log('🛡️  Scanning for NestJS Modules to Scaffold Security Tests...');

  const appModules = findAllModules(APPS_DIR);
  const pkgModules = findAllModules(PACKAGES_DIR);
  const allModules = [...appModules, ...pkgModules];

  console.log(`🔍 Found ${allModules.length} modules.`);

  for (const mod of allModules) {
    try {
      generateSecurityTest(mod);
    } catch (e) {
      console.error(`❌ Failed to scaffold for ${mod}:`, e);
    }
  }

  console.log('✨ Scaffolding Complete.');
}

main();
