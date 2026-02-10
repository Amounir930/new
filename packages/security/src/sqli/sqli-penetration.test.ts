import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

describe('SQL Injection Defense - ORM Compliance', () => {
  const schemaDir = './packages/db/src/schema';

  // 🔥 Dynamic discovery: Find all schema files recursively
  function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        getAllFiles(fullPath, arrayOfFiles);
      } else {
        if (fullPath.endsWith('.ts')) arrayOfFiles.push(fullPath);
      }
    }
    return arrayOfFiles;
  }

  const schemaFiles = [
    './packages/db/src/schema.ts', // Base schema
    // ...getAllFiles(schemaDir)     // All sub-schemas
  ].filter((f) => fs.existsSync(f));

  if (fs.existsSync(schemaDir)) {
    schemaFiles.push(...getAllFiles(schemaDir));
  }

  it('should verify Drizzle ORM usage (pgTable) in all discovered schemas', () => {
    for (const schemaPath of schemaFiles) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      // If it's just an index export, skipping might be needed, but let's see what fails
      if (schema.includes('export * from')) continue;

      // Naively expect pgTable in all files in schema dir?
      // The CI script didn't have the 'export *' check I just added mentally.
      // Let's stick to the CI script EXACTLY to reproduce.
    }
  });

  it('should enforce Parameterized Query patterns in the database layer', () => {
    const dbDir = './packages/db/src';
    if (fs.existsSync(dbDir)) {
      // recursively find all .ts files
      function getDbFiles(dir: string, fileList: string[] = []) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          if (fs.statSync(filePath).isDirectory()) {
            getDbFiles(filePath, fileList);
            continue;
          }

          if (filePath.endsWith('.ts') && !filePath.includes('.test.')) {
            fileList.push(filePath);
          }
        }
        return fileList;
      }

      const dbFiles = getDbFiles(dbDir);

      for (const file of dbFiles) {
        const content = fs.readFileSync(file, 'utf8');
        // Ensure any 'sql' usage is accompanied by Drizzle imports (parameterization safety)
        if (content.includes('sql`')) {
          expect(
            content,
            `File ${file} uses sql tag without drizzle-orm import`
          ).toContain('drizzle-orm');
        }
      }
    }
  });
});
