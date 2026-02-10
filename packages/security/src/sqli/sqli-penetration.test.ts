import * as fs from 'fs';
import * as path from 'path';
import {
  BinaryExpression,
  CallExpression,
  Identifier,
  Node,
  Project,
  SyntaxKind,
  TaggedTemplateExpression,
  VariableDeclaration,
} from 'ts-morph';
import { describe, expect, it } from 'vitest';

describe('SQL Injection Defense - ORM Compliance (Advanced AST)', () => {
  const project = new Project({
    tsConfigFilePath: path.resolve(__dirname, '../../../../tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
  });

  const dbDir = path.resolve(__dirname, '../../../../packages/db/src');

  function addFilesToProject(dir: string) {
    if (!fs.existsSync(dir)) return;

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Recursive file search by nature is complex
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

  addFilesToProject(dbDir);

  // Helper: Trace variable definition to check for string concatenation
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: AST traversal checks are complex
  function isCreatedByConcatenation(node: Node): boolean {
    if (Node.isBinaryExpression(node)) {
      if (node.getOperatorToken().getKind() === SyntaxKind.PlusToken) {
        return true; // Direct concatenation
      }
    } else if (Node.isIdentifier(node)) {
      const definitions = node.getDefinitions();
      for (const def of definitions) {
        const declaration = def.getDeclarationNode();
        if (declaration && Node.isVariableDeclaration(declaration)) {
          const initializer = declaration.getInitializer();
          if (initializer && isCreatedByConcatenation(initializer)) {
            return true;
          }
        }
      }
    } else if (Node.isTemplateExpression(node)) {
      return true; // Template literal with substitutions is risky if passed to raw()
      // Note: Helper logic might need refinement if we want to allow SAFE templates, but for raw(), avoiding templates is safer.
    }
    return false;
  }

  // Helper: Check if a node refers to 'drizzle-orm' symbol (handling aliases)
  function isDrizzleSymbol(node: Node, symbolName: string): boolean {
    // Naive symbol check might fail if types aren't fully resolved/installed in this env context
    // Fallback to text + import check is robust enough for now if symbol fails.
    // However, let's try to trace the symbol.
    const symbol = node.getSymbol();
    if (symbol) {
      const declarations = symbol.getDeclarations();
      for (const decl of declarations) {
        const sourceFile = decl.getSourceFile();
        // Check if declaration comes from drizzle-orm module or import
        if (Node.isImportSpecifier(decl)) {
          const importDecl = decl.getImportDeclaration();
          if (importDecl.getModuleSpecifierValue() === 'drizzle-orm' && decl.getName() === symbolName) {
            return true;
          }
        }
      }
    }
    // Fallback: Check text and existing imports (for safety if symbol resolution fails in test env)
    if (node.getText() === symbolName) return true; // Weak check, but standard
    return false;
  }


  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Analysis needs deep nesting
  it('should enforce Parameterized Query patterns in the database layer', () => {
    const sourceFiles = project.getSourceFiles();
    let checkedFiles = 0;

    for (const sourceFile of sourceFiles) {
      if (!sourceFile.getFilePath().includes('packages/db')) continue;

      checkedFiles++;

      // 1. Detect 'sql' tag usage
      const taggedTemplates = sourceFile.getDescendantsOfKind(SyntaxKind.TaggedTemplateExpression);
      for (const node of taggedTemplates) {
        const tag = node.getTag();
        // Check if it's the drizzle 'sql' tag
        if (isDrizzleSymbol(tag, 'sql') || tag.getText() === 'sql') {
          // Basic Check: Ensure drizzle-orm is imported (redundant if symbol check passed, but good for reporting)
          const imports = sourceFile.getImportDeclarations();
          const hasDrizzleImport = imports.some(imp =>
            imp.getModuleSpecifierValue() === 'drizzle-orm' &&
            imp.getNamedImports().some(ni => ni.getName() === 'sql')
          );
          expect(hasDrizzleImport, `File ${sourceFile.getFilePath()} uses 'sql' tag but missing 'import { sql } from "drizzle-orm"'`).toBe(true);

          // Advanced Check: Nested sql.raw() inside sql``
          // Example: sql`SELECT * FROM ${ sql.raw(userInput) } `
          const templateSpans = node.getTemplate().getKind() === SyntaxKind.TemplateExpression
            ? (node.getTemplate() as any).getTemplateSpans() // cast to access spans
            : [];

          // Traverse template spans/parts involves checking expressions within ${}
          // For simplicity, we just check all descendants of the template for CallExpressions to sql.raw
          const unsafeRawCalls = node.getTemplate().getDescendantsOfKind(SyntaxKind.CallExpression).filter(call => {
            const expr = call.getExpression();
            return expr.getText().includes('raw'); // heuristic for sql.raw or raw()
          });

          for (const call of unsafeRawCalls) {
            // If we find raw() inside sql``, we must check if its arg is safe
            const args = call.getArguments();
            if (args.length > 0 && isCreatedByConcatenation(args[0])) {
              expect(false, `File ${sourceFile.getFilePath()} uses unsafe sql.raw() inside sql template tag`).toBe(true);
            }
          }
        }
      }

      // 2. Detect direct 'sql.raw()' usage
      const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
      for (const call of callExpressions) {
        const expression = call.getExpression();
        // Check for 'sql.raw' or aliased usage
        // Note: tracing 'sql.raw' properly requires checking PropertyAccessExpression
        if (expression.getKind() === SyntaxKind.PropertyAccessExpression && expression.getText().endsWith('.raw')) {
          // Check if the object is 'sql' (or alias)
          const obj = (expression as any).getExpression(); // accessing 'sql' in 'sql.raw'
          if (isDrizzleSymbol(obj, 'sql') || obj.getText() === 'sql') {
            // This IS sql.raw()
            const args = call.getArguments();
            if (args.length > 0) {
              const firstArg = args[0];
              // Check for pre-concatenation or binary expression
              if (isCreatedByConcatenation(firstArg)) {
                expect(
                  false,
                  `File ${sourceFile.getFilePath()} uses unsafe string concatenation in sql.raw(). Trace: ${firstArg.getText()}`
                ).toBe(true);
              }
            }
          }
        }
      }
    }

    if (fs.existsSync(dbDir)) {
      expect(checkedFiles).toBeGreaterThan(0);
    }
  }, 30000);

  it('should verify Drizzle ORM usage (pgTable) in schema files', () => {
    const schemaDir = path.join(dbDir, 'schema');
    if (!fs.existsSync(schemaDir)) return;

    const schemaSourceFiles = project.getSourceFiles().filter(
      (sf) =>
        sf.getFilePath().includes(schemaDir.replace(/\\/g, '/')) &&
        !sf.getFilePath().endsWith('index.ts')
    );

    for (const sourceFile of schemaSourceFiles) {
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
          `File ${sourceFile.getFilePath()} uses pgTable but missing import `
        ).toBe(true);
      }
    }
  });
});
