import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Node, Project, Symbol as TsSymbol, SyntaxKind } from 'ts-morph';

interface Violation {
  file: string;
  line: number;
  message: string;
  severity: 'CRITICAL' | 'WARNING';
}

export class ApexSecurityScanner {
  private project: Project;
  private violations: Violation[] = [];

  public clearViolations() {
    this.violations = [];
  }

  constructor(tsConfigPath: string) {
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: true,
    });
  }

  public scanDirectory(dir: string, includePattern = /\.ts$/) {
    const files = this.getFilesRecursive(dir, includePattern);
    for (const file of files) {
      this.project.addSourceFileAtPath(file);
    }

    const sourceFiles = this.project.getSourceFiles();
    for (const sf of sourceFiles) {
      this.scanFile(sf);
    }

    return this.violations;
  }

  private scanFile(sourceFile: any) {
    this.checkSQLInjection(sourceFile);
    this.checkExportSecurity(sourceFile);
    this.checkPathTraversal(sourceFile);
  }

  // --- Path Traversal Checks ---
  private checkPathTraversal(sourceFile: any) {
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const call of calls) {
      const text = call.getText();
      // Heuristic: identify path-related operations
      const isKnownSafeRedisExec =
        text.includes('.exec()') &&
        (text.includes('multi') || text.includes('client'));

      const isPathOp =
        (text.includes('mkdir') ||
          text.includes('write') ||
          text.includes('readFile') ||
          text.includes('spawn') ||
          text.includes('tar')) &&
        !isKnownSafeRedisExec;

      if (isPathOp) {
        this.analyzePathArguments(call);
      }
    }
  }

  private analyzePathArguments(call: any) {
    const args = call.getArguments();
    for (const arg of args) {
      if (this.isRiskyPathNode(arg)) {
        this.addViolation(
          arg,
          'S14: Potential Path Traversal detected. Ensure user input is sanitized and does not contain ".." or absolute paths.'
        );
      }
    }
  }

  private isRiskyPathNode(node: Node): boolean {
    const text = node.getText();
    if (text.includes('..')) return true;

    if (Node.isTemplateExpression(node)) {
      for (const span of node.getTemplateSpans()) {
        if (this.isRiskyPathNode(span.getExpression())) return true;
      }
    }

    if (Node.isBinaryExpression(node)) {
      return (
        this.isRiskyPathNode(node.getLeft()) ||
        this.isRiskyPathNode(node.getRight())
      );
    }

    if (Node.isIdentifier(node)) {
      return this.traceRiskyValue(node, /\.\./);
    }

    return false;
  }

  private traceRiskyValue(node: Node, pattern: RegExp): boolean {
    const symbol = node.getSymbol();
    if (!symbol) return false;

    for (const decl of symbol.getDeclarations()) {
      if (this.isRiskyDeclaration(decl, node, pattern)) return true;
    }
    return false;
  }

  private isRiskyDeclaration(
    decl: Node,
    originalNode: Node,
    pattern: RegExp
  ): boolean {
    if (!Node.isVariableDeclaration(decl)) return false;

    const init = decl.getInitializer();
    if (!init || init === originalNode) return false;

    if (init.getText().match(pattern)) return true;

    return this.isRiskyInitializer(init, pattern);
  }

  private isRiskyInitializer(init: Node, pattern: RegExp): boolean {
    if (Node.isTemplateExpression(init)) {
      return init
        .getTemplateSpans()
        .some((span) => this.traceRiskyValue(span.getExpression(), pattern));
    }

    if (Node.isBinaryExpression(init)) {
      return (
        this.traceRiskyValue(init.getLeft(), pattern) ||
        this.traceRiskyValue(init.getRight(), pattern)
      );
    }

    if (Node.isIdentifier(init)) {
      return this.traceRiskyValue(init, pattern);
    }

    return false;
  }

  // --- SQL Injection Checks (S11) ---

  private checkSQLInjection(sourceFile: any) {
    this.checkSQLTaggedTemplates(sourceFile);
    this.checkDirectSQLRaw(sourceFile);
  }

  private checkSQLTaggedTemplates(sourceFile: any) {
    const taggedTemplates = sourceFile.getDescendantsOfKind(
      SyntaxKind.TaggedTemplateExpression
    );
    for (const node of taggedTemplates) {
      const tag = node.getTag();
      if (this.isDrizzleSymbol(tag, 'sql') || tag.getText() === 'sql') {
        this.validateNestedRawInsideSql(node);
      }
    }
  }

  private validateNestedRawInsideSql(node: any) {
    const unsafeRawCalls = node
      .getTemplate()
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((call: any) => {
        const exprText = call.getExpression().getText();
        return exprText.includes('raw') || exprText.endsWith('.raw');
      });

    for (const call of unsafeRawCalls) {
      const args = call.getArguments();
      if (args.length > 0 && this.isCreatedByConcatenation(args[0])) {
        this.addViolation(
          node,
          'S11: Unsafe sql.raw() nested inside sql template tag.'
        );
      }
    }
  }

  private checkDirectSQLRaw(sourceFile: any) {
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const call of calls) {
      const expr = call.getExpression();
      if (
        Node.isPropertyAccessExpression(expr) &&
        expr.getText().endsWith('.raw')
      ) {
        const obj = expr.getExpression();
        if (this.isDrizzleSymbol(obj, 'sql') || obj.getText() === 'sql') {
          const args = call.getArguments();
          if (args.length > 0 && this.isCreatedByConcatenation(args[0])) {
            this.addViolation(
              call,
              `S11: Unsafe string concatenation in sql.raw(): ${args[0].getText()}`
            );
          }
        }
      }
    }
  }

  // --- Export Security Checks (S14) ---

  private checkExportSecurity(sourceFile: any) {
    const filePath = sourceFile.getFilePath();
    if (filePath.includes('packages/export/src/strategies/')) {
      this.checkCleanup(sourceFile);
      this.checkTenantIsolation(sourceFile);
    }
  }

  private checkCleanup(sourceFile: any) {
    const content = sourceFile.getText();
    const hasCleanupStr =
      /\b(rm\s+.*-rf|rm\s+.*-f|fs\.unlink|fs\.rm|Bun\.spawn\(\['rm')\b/.test(
        content
      );

    // AST approach for more precision
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    const cleanupCall = calls.find((c: any) => {
      const text = c.getText();
      return (
        text.includes('rm') ||
        text.includes('unlink') ||
        text.includes('cleanup')
      );
    });

    if (!hasCleanupStr && !cleanupCall) {
      this.addViolation(
        sourceFile,
        'S14: Export strategy missing cleanup logic for temporary files.',
        'CRITICAL'
      );
    }
  }

  private checkTenantIsolation(sourceFile: any) {
    const content = sourceFile.getText();
    if (!content.includes('schemaName') && !content.includes('tenant_')) {
      this.addViolation(
        sourceFile,
        'S14: Export strategy missing tenant schema isolation (schemaName/tenant_)'
      );
    }
  }

  // --- Helpers ---

  private isCreatedByConcatenation(node: Node): boolean {
    if (
      Node.isBinaryExpression(node) &&
      (node.getOperatorToken().getKind() === SyntaxKind.PlusToken ||
        node.getOperatorToken().getText() === '+')
    )
      return true;

    // Check for both TemplateExpression and NoSubstitutionTemplateLiteral if they contain variables
    if (Node.isTemplateExpression(node)) return true;

    // String interpolation check for TemplateHead/TemplateMiddle/TemplateTail
    if (node.getKind() === SyntaxKind.TemplateExpression) return true;

    if (Node.isIdentifier(node)) {
      return this.traceVariableInitialization(node);
    }

    // Support for string concatenation via .concat()
    if (Node.isCallExpression(node)) {
      const expr = node.getExpression();
      if (
        Node.isPropertyAccessExpression(expr) &&
        expr.getName() === 'concat'
      ) {
        return true;
      }
    }

    return false;
  }

  private traceVariableInitialization(node: Node): boolean {
    const symbol = node.getSymbol();
    if (!symbol) return false;

    for (const decl of symbol.getDeclarations()) {
      if (Node.isVariableDeclaration(decl)) {
        const init = decl.getInitializer();
        if (init && this.isCreatedByConcatenation(init)) return true;
      }
    }
    return false;
  }

  private isDrizzleSymbol(node: Node, symbolName: string): boolean {
    const symbol = node.getSymbol() as TsSymbol | undefined;
    if (symbol) {
      const decls = symbol.getDeclarations();
      for (const decl of decls) {
        if (Node.isImportSpecifier(decl)) {
          const imp = decl.getImportDeclaration();
          if (
            imp.getModuleSpecifierValue() === 'drizzle-orm' &&
            decl.getName() === symbolName
          )
            return true;
        }
      }
    }
    return node.getText() === symbolName;
  }

  private getFilesRecursive(
    dir: string,
    pattern: RegExp,
    fileList: string[] = []
  ): string[] {
    if (!existsSync(dir)) return [];
    const files = readdirSync(dir);
    for (const file of files) {
      const fullPath = join(dir, file);
      if (statSync(fullPath).isDirectory()) {
        this.handleDirectoryRecursion(fullPath, file, pattern, fileList);
      } else if (
        pattern.test(file) &&
        !file.includes('.test.') &&
        !file.includes('.spec.')
      ) {
        fileList.push(fullPath);
      }
    }
    return fileList;
  }

  private handleDirectoryRecursion(
    fullPath: string,
    name: string,
    pattern: RegExp,
    fileList: string[]
  ) {
    if (!['node_modules', 'dist', '.git', '.next'].includes(name)) {
      this.getFilesRecursive(fullPath, pattern, fileList);
    }
  }

  private addViolation(
    node: any,
    message: string,
    severity: 'CRITICAL' | 'WARNING' = 'CRITICAL'
  ) {
    const sourceFile = node.getSourceFile();
    const line = sourceFile.getLineAndColumnAtPos(node.getStart()).line;
    this.violations.push({
      file: sourceFile.getFilePath(),
      line,
      message,
      severity,
    });
  }
}

// CLI Runner
if (import.meta.main) {
  const tsConfig = resolve(process.cwd(), 'tsconfig.json');
  const scanner = new ApexSecurityScanner(tsConfig);

  console.log('🚀 Apex AST Security Scanner starting...');

  const targetDirs = ['packages/export/src', 'packages/db/src', 'apps/api/src'];
  let allViolations: Violation[] = [];

  for (const dir of targetDirs) {
    const fullPath = resolve(process.cwd(), dir);
    if (existsSync(fullPath)) {
      console.log(`🔍 Scanning ${dir}...`);
      allViolations = allViolations.concat(scanner.scanDirectory(fullPath));
    }
  }

  if (allViolations.length > 0) {
    console.log(`\n❌ Found ${allViolations.length} Security Violations:`);
    for (const v of allViolations) {
      console.log(`[${v.severity}] ${v.file}:${v.line} - ${v.message}`);
    }
    process.exit(1);
  } else {
    console.log('\n✅ No AST security violations found. Project is compliant.');
    process.exit(0);
  }
}
