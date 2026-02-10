
import { Test } from '@nestjs/testing';
import { expect, it, describe } from 'vitest';
import { Project, Node } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';
import 'reflect-metadata';

/**
 * Base Security Test Suite
 * Inherit from this class or use its static methods to enforce security compliance.
 */
export abstract class BaseSecurityTest {
    static async validateModule(module: any, providers: any[] = []) {
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
                        BaseSecurityTest.validateMetadataValue(value, key.toString());
                    } catch (e: any) {
                        expect.fail(e.message);
                    }
                }
            });

            // S11: SQL Injection (AST Analysis)
            it('S11: Should pass AST SQLi check for module files', () => {
                const rootDir = process.cwd();
                const moduleClassFile = BaseSecurityTest.findModuleFile(rootDir, module.name);

                if (!moduleClassFile) {
                    console.warn(`⚠️ [S11] Could not locate source file for ${module.name}. AST check skipped.`);
                    return;
                }

                BaseSecurityTest.runASTCheck(moduleClassFile);
            });
        });
    }

    private static validateMetadataValue(value: any, pathIdx: string) {
        if (typeof value === 'string') {
            // Postgres/MySQL/Redis connection strings
            if (/(postgres|mysql|redis):\/\//.test(value)) {
                throw new Error(`S1 Violation: Database connection string detected at metadata path: ${pathIdx}`);
            }
            // JWT Pattern (heuristic: header.payload.signature)
            if (/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/.test(value)) {
                throw new Error(`S1 Violation: Potential hardcoded JWT detected at metadata path: ${pathIdx}`);
            }
        } else if (typeof value === 'object' && value !== null) {
            // Recursive scan
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    BaseSecurityTest.validateMetadataValue(value[key], `${pathIdx}.${key}`);
                }
            }
        }
    }

    private static runASTCheck(moduleClassFile: string) {
        const project = new Project({
            skipAddingFilesFromTsConfig: true,
        });

        // Add all files in the module's directory
        const moduleDir = path.dirname(moduleClassFile);
        project.addSourceFilesAtPaths(path.join(moduleDir, '**/*.ts'));

        const violations: string[] = [];

        for (const sourceFile of project.getSourceFiles()) {
            // Skip test files
            if (sourceFile.getFilePath().includes('.test.') || sourceFile.getFilePath().includes('.spec.')) continue;

            sourceFile.forEachDescendant((node) => {
                if (Node.isCallExpression(node)) {
                    BaseSecurityTest.checkNodeForSQLi(node, sourceFile, violations);
                }
            });
        }

        expect(violations, `S11 Violations Found:\n${violations.join('\n')}`).toHaveLength(0);
    }

    private static checkNodeForSQLi(node: any, sourceFile: any, violations: string[]) {
        const expression = node.getExpression();
        // Check for .raw() usage
        if (expression.getText().endsWith('.raw')) {
            // Get the line content for comment checking
            const lineNum = sourceFile.getLineAndColumnAtPos(node.getStart()).line;
            const lineContent = sourceFile.getFullText().split('\n')[lineNum - 1];

            // Strict Safe Comment Check: // safe (TICKET-123)
            const hasStrictSafeComment = /\/\/\s*safe\s*\(TICKET-\d+\)/.test(lineContent);

            if (!hasStrictSafeComment) {
                violations.push(`${sourceFile.getBaseName()}:${lineNum} uses sql.raw() without strict safety comment '// safe (TICKET-xxx)'`);
            }
        }
    }

    // Robust Module Finder (Apps & Packages)
    private static findModuleFile(root: string, moduleName: string): string | null {
        const searchDirs = [
            path.join(root, 'apps', 'api', 'src'),
        ];

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
            const res = BaseSecurityTest.walkAndFind(dir, moduleName);
            if (res) return res;
        }
        return null;
    }

    private static walkAndFind(dir: string, className: string): string | null {
        if (!fs.existsSync(dir)) return null;
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (['node_modules', 'dist', 'coverage', '.turbo'].includes(entry.name)) continue;
                const res = BaseSecurityTest.walkAndFind(fullPath, className);
                if (res) return res;
            } else if (entry.isFile() && entry.name.endsWith('.ts')) {
                // Optimization: Only check files likely to be modules
                if (entry.name.includes('.module') || entry.name.includes('index')) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    if (content.includes(`class ${className}`)) return fullPath;
                }
            }
        }
        return null;
    }
}
