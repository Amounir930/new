import * as fs from 'fs';
import * as path from 'path';
import {
    Project,
    SyntaxKind,
    Node,
    Symbol,
    ImportSpecifier,
} from 'ts-morph';

interface Violation {
    file: string;
    line: number;
    message: string;
    severity: 'CRITICAL' | 'WARNING';
}

export class ApexSecurityScanner {
    private project: Project;
    private violations: Violation[] = [];

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
            if (text.includes('mkdir') || text.includes('write') || text.includes('readFile') || text.includes('spawn') || text.includes('tar')) {
                const args = call.getArguments();
                for (const arg of args) {
                    const argText = arg.getText();
                    // If the path contains '..' interpolation or is a raw variable suspicious of being user-controlled
                    if (argText.includes('..') && (Node.isTemplateExpression(arg) || Node.isBinaryExpression(arg))) {
                        this.addViolation(arg, 'S14: Potential Path Traversal detected via ".." interpolation.');
                    }
                }
            }
        }
    }

    // --- SQL Injection Checks (S11) ---

    private checkSQLInjection(sourceFile: any) {
        // 1. Tagged template 'sql' checks
        const taggedTemplates = sourceFile.getDescendantsOfKind(SyntaxKind.TaggedTemplateExpression);
        for (const node of taggedTemplates) {
            const tag = node.getTag();
            if (this.isDrizzleSymbol(tag, 'sql') || tag.getText() === 'sql') {
                // Check for nested sql.raw()
                const unsafeRawCalls = node.getTemplate().getDescendantsOfKind(SyntaxKind.CallExpression).filter((call: any) => {
                    return call.getExpression().getText().includes('raw');
                });

                for (const call of unsafeRawCalls) {
                    const args = call.getArguments();
                    if (args.length > 0 && this.isCreatedByConcatenation(args[0])) {
                        this.addViolation(node, 'S11: Unsafe sql.raw() nested inside sql template tag.');
                    }
                }
            }
        }

        // 2. Direct sql.raw() calls
        const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
        for (const call of calls) {
            const expr = call.getExpression();
            if (expr.getKind() === SyntaxKind.PropertyAccessExpression && expr.getText().endsWith('.raw')) {
                const obj = (expr as any).getExpression();
                if (this.isDrizzleSymbol(obj, 'sql') || obj.getText() === 'sql') {
                    const args = call.getArguments();
                    if (args.length > 0 && this.isCreatedByConcatenation(args[0])) {
                        this.addViolation(node, `S11: Unsafe string concatenation in sql.raw(): ${args[0].getText()}`);
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
        const hasCleanup = /rm.*-rf|rm.*-f|fs\.unlink|fs\.rm|cleanup|Bun\.spawn\(\['rm'/.test(content);

        // AST approach for more precision
        const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
        const cleanupCall = calls.find((c: any) => {
            const text = c.getText();
            return text.includes('rm') || text.includes('unlink') || text.includes('cleanup');
        });

        if (!hasCleanup && !cleanupCall) {
            this.addViolation(sourceFile, 'S14: Export strategy missing cleanup logic for temporary files.', 'CRITICAL');
        }
    }

    private checkTenantIsolation(sourceFile: any) {
        const content = sourceFile.getText();
        if (!content.includes('schemaName') && !content.includes('tenant_')) {
            this.addViolation(sourceFile, 'S14: Export strategy missing tenant schema isolation (schemaName/tenant_)');
        }
    }

    // --- Helpers ---

    private isCreatedByConcatenation(node: Node): boolean {
        if (Node.isBinaryExpression(node) && node.getOperatorToken().getKind() === SyntaxKind.PlusToken) return true;
        if (Node.isTemplateExpression(node)) return true; // Template literals with interpolation are risky for raw()

        if (Node.isIdentifier(node)) {
            const defs = node.getDefinitions();
            for (const def of defs) {
                const decl = def.getDeclarationNode();
                if (decl && Node.isVariableDeclaration(decl)) {
                    const init = decl.getInitializer();
                    if (init && this.isCreatedByConcatenation(init)) return true;
                }
            }
        }
        return false;
    }

    private isDrizzleSymbol(node: Node, symbolName: string): boolean {
        const symbol = node.getSymbol();
        if (symbol) {
            const decls = symbol.getDeclarations();
            for (const decl of decls) {
                if (Node.isImportSpecifier(decl)) {
                    const imp = decl.getImportDeclaration();
                    if (imp.getModuleSpecifierValue() === 'drizzle-orm' && decl.getName() === symbolName) return true;
                }
            }
        }
        return node.getText() === symbolName;
    }

    private getFilesRecursive(dir: string, pattern: RegExp, fileList: string[] = []): string[] {
        if (!fs.existsSync(dir)) return [];
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                if (!['node_modules', 'dist', '.git', '.next'].includes(file)) {
                    this.getFilesRecursive(fullPath, pattern, fileList);
                }
            } else if (pattern.test(file) && !file.includes('.test.') && !file.includes('.spec.')) {
                fileList.push(fullPath);
            }
        }
        return fileList;
    }

    private addViolation(node: any, message: string, severity: 'CRITICAL' | 'WARNING' = 'CRITICAL') {
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
if (require.main === module) {
    const tsConfig = path.resolve(process.cwd(), 'tsconfig.json');
    const scanner = new ApexSecurityScanner(tsConfig);

    console.log('🚀 Apex AST Security Scanner starting...');

    const targetDirs = ['packages/export/src', 'packages/db/src', 'apps/api/src'];
    let allViolations: Violation[] = [];

    for (const dir of targetDirs) {
        const fullPath = path.resolve(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            console.log(`🔍 Scanning ${dir}...`);
            allViolations = allViolations.concat(scanner.scanDirectory(fullPath));
        }
    }

    if (allViolations.length > 0) {
        console.log(`\n❌ Found ${allViolations.length} Security Violations:`);
        allViolations.forEach(v => {
            console.log(`[${v.severity}] ${v.file}:${v.line} - ${v.message}`);
        });
        process.exit(1);
    } else {
        console.log('\n✅ No AST security violations found. Project is compliant.');
        process.exit(0);
    }
}
