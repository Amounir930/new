import * as fs from 'fs';
import * as path from 'path';
import {
  CallExpression,
  type ImportDeclaration,
  Node,
  Project,
  SourceFile,
  SyntaxKind,
  TaggedTemplateExpression,
} from 'ts-morph';
import { describe, expect, it } from 'vitest';

// --- Top Level Helpers ---

function getTsFiles(dirPath: string, fileList: string[] = []): string[] {
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

function addFilesToProject(project: Project, dir: string): void {
  if (!fs.existsSync(dir)) return;
  const files = getTsFiles(dir);
  for (const filePath of files) {
    project.addSourceFileAtPath(filePath);
  }
}

function checkIdentifierInitialization(node: Node): boolean {
  const definitions = node.getSymbol()?.getDeclarations() || [];
  for (const declaration of definitions) {
    if (Node.isVariableDeclaration(declaration)) {
      const initializer = declaration.getInitializer();
      if (initializer && isCreatedByConcatenation(initializer)) {
        return true;
      }
    }
  }
  return false;
}

function isCreatedByConcatenation(node: Node): boolean {
  if (Node.isBinaryExpression(node)) {
    return node.getOperatorToken().getKind() === SyntaxKind.PlusToken;
  }
  if (Node.isIdentifier(node)) {
    return checkIdentifierInitialization(node);
  }
  return Node.isTemplateExpression(node);
}

function isDrizzleSymbol(node: Node, symbolName: string): boolean {
  const symbol = node.getSymbol();
  if (symbol) {
    const declarations = symbol.getDeclarations();
    for (const decl of declarations) {
      if (Node.isImportSpecifier(decl)) {
        const importDecl = decl.getImportDeclaration();
        if (
          importDecl.getModuleSpecifierValue() === 'drizzle-orm' &&
          decl.getName() === symbolName
        ) {
          return true;
        }
      }
    }
  }
  return node.getText() === symbolName;
}

function validateSqlTaggedTemplate(
  sourceFile: SourceFile,
  node: TaggedTemplateExpression
): void {
  const imports: ImportDeclaration[] = sourceFile.getImportDeclarations();
  const hasDrizzleImport = imports.some(
    (imp) =>
      imp.getModuleSpecifierValue() === 'drizzle-orm' &&
      imp.getNamedImports().some((ni) => ni.getName() === 'sql')
  );

  expect(
    hasDrizzleImport,
    `File ${sourceFile.getFilePath()} uses 'sql' tag but missing import`
  ).toBe(true);

  const unsafeRawCalls = node
    .getTemplate()
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((call: CallExpression) => {
      return call.getExpression().getText().includes('raw');
    });

  for (const call of unsafeRawCalls) {
    const args = call.getArguments();
    if (args.length > 0 && isCreatedByConcatenation(args[0])) {
      expect(
        false,
        `File ${sourceFile.getFilePath()} uses unsafe sql.raw() inside sql tag`
      ).toBe(true);
    }
  }
}

function validateSqlRawCall(
  sourceFile: SourceFile,
  call: CallExpression
): void {
  const expression = call.getExpression();
  if (
    Node.isPropertyAccessExpression(expression) &&
    expression.getText().endsWith('.raw')
  ) {
    const obj = expression.getExpression();
    if (isDrizzleSymbol(obj, 'sql') || obj.getText() === 'sql') {
      const args = call.getArguments();
      if (args.length > 0 && isCreatedByConcatenation(args[0])) {
        expect(
          false,
          `File ${sourceFile.getFilePath()} uses unsafe string concatenation in sql.raw()`
        ).toBe(true);
      }
    }
  }
}

function processSourceFileForSql(sourceFile: SourceFile): void {
  const taggedTemplates = sourceFile.getDescendantsOfKind(
    SyntaxKind.TaggedTemplateExpression
  );
  for (const node of taggedTemplates) {
    const tag = node.getTag();
    if (isDrizzleSymbol(tag, 'sql') || tag.getText() === 'sql') {
      validateSqlTaggedTemplate(sourceFile, node);
    }
  }

  const callExpressions = sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression
  );
  for (const call of callExpressions) {
    validateSqlRawCall(sourceFile, call);
  }
}

// --- Test Suite ---

describe('SQL Injection Defense - ORM Compliance (Advanced AST)', () => {
  const project = new Project({
    tsConfigFilePath: path.resolve(__dirname, '../../../../tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
  });

  const dbDir = path.resolve(__dirname, '../../../../packages/db/src');
  addFilesToProject(project, dbDir);

  it('should enforce Parameterized Query patterns in the database layer', () => {
    for (const sourceFile of project.getSourceFiles()) {
      if (!sourceFile.getFilePath().includes('packages/db')) continue;
      processSourceFileForSql(sourceFile);
    }

    if (fs.existsSync(dbDir)) {
      expect(project.getSourceFiles().length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should verify Drizzle ORM usage (pgTable) in schema files', () => {
    const schemaDir = path.join(dbDir, 'schema');
    if (!fs.existsSync(schemaDir)) return;

    const schemaFiles = project
      .getSourceFiles()
      .filter(
        (sf) =>
          sf.getFilePath().includes(schemaDir.replace(/\\/g, '/')) &&
          !sf.getFilePath().endsWith('index.ts')
      );

    for (const sourceFile of schemaFiles) {
      if (sourceFile.getText().includes('pgTable')) {
        const hasPgTableImport = sourceFile
          .getImportDeclarations()
          .some(
            (imp) =>
              imp.getModuleSpecifierValue() === 'drizzle-orm/pg-core' &&
              imp.getNamedImports().some((ni) => ni.getName() === 'pgTable')
          );
        expect(
          hasPgTableImport,
          `File ${sourceFile.getFilePath()} missing pgTable import`
        ).toBe(true);
      }
    }
  });
});
