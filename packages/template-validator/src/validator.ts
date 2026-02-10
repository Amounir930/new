import fs from 'fs';
import path from 'path';
import { TemplateConfigSchema } from '@apex/template-config';
import type { TemplateConfig } from '@apex/template-config';
import fg from 'fast-glob';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config?: TemplateConfig;
}

export class TemplateValidator {
  /**
   * Entry point for template validation
   */
  async validate(templatePath: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let config: TemplateConfig | undefined;

    try {
      // 1. Validate template.config.json
      const configResult = await this.validateConfig(templatePath);
      errors.push(...configResult.errors);
      warnings.push(...configResult.warnings);
      config = configResult.config;

      // 2. Validate essential file structure
      const structureResult = await this.validateStructure(templatePath);
      errors.push(...structureResult.errors);
      warnings.push(...structureResult.warnings);

      // 3. Resolve cross-field dependencies
      // 3. Resolve cross-field dependencies
      if (config) {
        const depResult = await this.validateDependencies(templatePath, config);
        errors.push(...depResult.errors);
        warnings.push(...depResult.warnings);
      }
    } catch (error) {
      errors.push(`Fatal validation error: ${(error as Error).message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      config,
    };
  }

  private async validateConfig(templatePath: string): Promise<{
    errors: string[];
    warnings: string[];
    config?: TemplateConfig;
  }> {
    const configPath = path.join(templatePath, 'template.config.json');

    if (!fs.existsSync(configPath)) {
      return { errors: ['Missing template.config.json'], warnings: [] };
    }

    try {
      const content = fs.readFileSync(configPath, 'utf8');
      const data = JSON.parse(content);
      const result = TemplateConfigSchema.safeParse(data);

      if (!result.success) {
        return {
          errors: result.error.errors.map(
            (e) => `Config error: ${e.path.join('.')} - ${e.message} (Got: ${JSON.stringify(data)})`
          ),
          warnings: [],
        };
      }

      return { errors: [], warnings: [], config: result.data };
    } catch (error) {
      return {
        errors: [`Failed to parse config: ${(error as Error).message}`],
        warnings: [],
      };
    }
  }

  private async validateStructure(
    templatePath: string
  ): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];

    const requiredFiles = [
      'README.md',
      'package.json',
      'tsconfig.json',
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/app/(shop)/products/page.tsx',
      'src/app/(shop)/products/[slug]/page.tsx',
      'src/app/(shop)/cart/page.tsx',
      'src/app/(shop)/checkout/page.tsx',
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(templatePath, file))) {
        errors.push(`Missing required file: ${file}`);
      }
    }

    return { errors, warnings: [] };
  }

  private async validateDependencies(
    templatePath: string,
    config: TemplateConfig
  ): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Example: If search is enabled in config, verify search page exists
    if (
      config.features.pages.search &&
      !fs.existsSync(path.join(templatePath, 'src/app/(shop)/search/page.tsx'))
    ) {
      errors.push(
        'Search feature enabled but src/app/(shop)/search/page.tsx is missing'
      );
    }

    // Check package.json for required @apex dependencies
    const pkgPath = path.join(templatePath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      const requiredDeps = ['@apex/ui', '@apex/validators'];
      for (const dep of requiredDeps) {
        if (!deps[dep]) {
          warnings.push(
            `Missing recommended dependency in package.json: ${dep}`
          );
        }
      }
    }

    return { errors, warnings };
  }
}
