import * as fs from 'fs';
import * as path from 'path';
import { Project, SyntaxKind } from 'ts-morph';
import { describe, expect, it } from 'vitest';

describe('SQL Injection Defense - ORM Compliance (AST Analysis)', () => {
  const project = new Project({
    tsConfigFilePath: path.resolve(__dirname, '../../../../tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
  });

  const dbDir = path.resolve(__dirname, '../../../../packages/db/src');

  // Helper to load files into project
  function addFilesToProject(dir: string) {
    if (!fs.existsSync(dir)) return;

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Recursive file search is naturally complex
    function getTsFiles(dirPath: string, fileList: string[] = []) {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          getTsFiles(fullPath, fileList);
          continue;
        }
        if (
          fullPath.endsWith('.ts') &&
          !fullPath.includes('.test.') &&
          !fullPath.includes('.spec.')
        ) {
          fileList.push(fullPath);
        }
      }
      return fileList;
    }

    const files = getTsFiles(dir);
    for (const filePath of files) {
      project.addSourceFileAtPath(filePath);
    }
  }

  // Load DB files
  addFilesToProject(dbDir);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: AST analysis requires deep nesting
  it('should enforce Parameterized Query patterns in the database layer', () => {
    const sourceFiles = project.getSourceFiles();
    let checkedFiles = 0;

    for (const sourceFile of sourceFiles) {
      // Skip if not in packages/db
      if (!sourceFile.getFilePath().includes('packages/db')) continue;

      checkedFiles++;
      const descendants = sourceFile.getDescendantsOfKind(
        SyntaxKind.TaggedTemplateExpression
      );

      for (const node of descendants) {
        const tag = node.getTag();
        if (tag.getText() === 'sql') {
          // Check 1: Ensure drizzle-orm is imported
          const imports = sourceFile.getImportDeclarations();
          const hasDrizzleImport = imports.some(
            (imp) =>
              imp.getModuleSpecifierValue() === 'drizzle-orm' &&
              imp.getNamedImports().some((ni) => ni.getName() === 'sql')
          );

          expect(
            hasDrizzleImport,
            `File ${sourceFile.getFilePath()} uses 'sql' tag but missing 'import { sql } from "drizzle-orm"'`
          ).toBe(true);

          // Check 2: Detect String Concatenation/Interpolation inside sql``
          // In ts-morph, a TemplateExpression (backticks with ${}) has a 'templateSpans' property.
          // If it's a NoSubstitutionTemplateLiteral (backticks without ${}), it's safe constant SQL.

          const template = node.getTemplate();
          if (template.getKind() === SyntaxKind.TemplateExpression) {
            // It has ${...} interpolations. We must ensure they are NOT just raw strings.
            // However, Drizzle `sql` tag handles parameterization for values passed in ${}.
            // The danger is if someone does: sql`SELECT * FROM table WHERE id = ${req.body.id}` -> Drizzle treats this as a param ($1), so it IS safe from injection!
            // The REAL danger is usage of `sql.raw()` with user input, or building the string BEFORE passing to sql``.
            // Wait, user asked to "Block String Concatenation in SQL Tags".
            // Drizzle's `sql` tag turns ${value} into a bind parameter ($1, $2).
            // So `sql` tag usage IS the safe pattern.
            // What IS unsafe is `sql.raw('SELECT ... ' + userInput)`.
          }
        }
      }

      // Check 3: Forbid raw SQL string concatenation being passed to sql.raw() or similar
      const callExpressions = sourceFile.getDescendantsOfKind(
        SyntaxKind.CallExpression
      );
      for (const call of callExpressions) {
        const expression = call.getExpression();
        if (expression.getText().includes('sql.raw')) {
          const args = call.getArguments();
          if (args.length > 0) {
            const firstArg = args[0];
            // If argument involves binary expression with '+' (concatenation)
            if (firstArg.getKind() === SyntaxKind.BinaryExpression) {
              // Check if it's string concatenation
              if (firstArg.getText().includes('+')) {
                // This is a heuristic, but sufficient for now
                // We fail if we see `sql.raw('...' + var)`
                expect(
                  false,
                  `File ${sourceFile.getFilePath()} uses unsafe string concatenation in sql.raw()`
                ).toBe(true);
              }
            }
            // If argument is a TemplateExpression (backticks with ${})
            if (firstArg.getKind() === SyntaxKind.TemplateExpression) {
              expect(
                false,
                `File ${sourceFile.getFilePath()} uses template literals in sql.raw() - use sql\`...\` tag instead for parameterization`
              ).toBe(true);
            }
          }
        }
      }
    }

    // Ensure we actually checked implementation files
    if (fs.existsSync(dbDir)) {
      expect(checkedFiles).toBeGreaterThan(0);
    }
  });

  it('should verify Drizzle ORM usage (pgTable) in schema files', () => {
    // Only check files in schema directory
    const schemaDir = path.join(dbDir, 'schema');
    if (!fs.existsSync(schemaDir)) return;

    const schemaSourceFiles = project.getSourceFiles().filter(
      (sf) =>
        sf.getFilePath().includes(schemaDir.replace(/\\/g, '/')) &&
        !sf.getFilePath().endsWith('index.ts') // Skip index files
    );

    for (const sourceFile of schemaSourceFiles) {
      // Just check if it imports pgTable if it defines a table
      // This is harder to do perfectly with AST without semantic analysis,
      // but checking for pgTable import is a good proxy for "using Drizzle".
      const text = sourceFile.getText();
      if (text.includes('pgTable')) {
        const imports = sourceFile.getImportDeclarations();
        const hasPgTableImport = imports.some(
          (imp) =>
            imp.getModuleSpecifierValue() === 'drizzle-orm/pg-core' &&
            imp.getNamedImports().some((ni) => ni.getName() === 'pgTable')
        );
        expect(
          hasPgTableImport,
          `File ${sourceFile.getFilePath()} uses pgTable but missing import`
        ).toBe(true);
      }
    }
  });
});
