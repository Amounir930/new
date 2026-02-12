import { logSecurityEvent } from '@apex/audit';
import type React from 'react';
import type { ComponentType } from 'react';

export interface TemplateLoaderOptions {
  baseUrl?: string;
  enableAudit?: boolean;
}

/**
 * TemplateLoader handles dynamic importing of templates and binding them to tenant context
 */
export class TemplateLoader {
  private cache = new Map<string, ComponentType<any>>();
  private readonly baseUrl: string;

  constructor(private options: TemplateLoaderOptions = {}) {
    // S1 Compliance: Default to config-driven base URL
    this.baseUrl = options.baseUrl || 'templates';
  }

  /**
   * Validates path to prevent Path Traversal (S1/S2 Protection)
   */
  private isSafePath(input: string): boolean {
    // Allow only alphanumeric, hyphens, and slashes. No dots or backslashes.
    return /^[a-zA-Z0-9\-/]+$/.test(input) && !input.includes('..');
  }

  /**
   * Dynamically loads a template component with safety checks
   * @param templateName The name of the template directory
   * @param componentPath Path within the template (e.g., 'layout', 'page')
   */
  async loadComponent<T = any>(
    templateName: string,
    componentPath = 'layout'
  ): Promise<ComponentType<T>> {
    // Path Traversal Protection
    if (!this.isSafePath(templateName) || !this.isSafePath(componentPath)) {
      const errorMsg = `Suspicious template path detected: ${templateName}/${componentPath}`;

      if (this.options.enableAudit !== false) {
        await logSecurityEvent(
          'TEMPLATE_PATH_TRAVERSAL_ATTEMPT',
          'system',
          templateName,
          '0.0.0.0',
          { componentPath, reason: 'invalid_characters' }
        );
      }

      throw new Error(`S2 Violation: ${errorMsg}`);
    }

    const cacheKey = `${templateName}:${componentPath}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as ComponentType<T>;
    }

    try {
      // Dynamic import with sanitized paths
      // Note: The @templates alias should be configured in tsconfig/next.config
      const module = await import(
        `@templates/${templateName}/src/app/${componentPath}`
      );
      const Component = module.default;

      if (!Component) {
        throw new Error(
          `Template component "${componentPath}" in "${templateName}" does not have a default export`
        );
      }

      this.cache.set(cacheKey, Component);
      return Component;
    } catch (error) {
      // Audit Logging (S4)
      if (this.options.enableAudit !== false) {
        await logSecurityEvent(
          'TEMPLATE_LOAD_FAILURE',
          'system',
          templateName,
          '0.0.0.0',
          { componentPath, errorMessage: (error as Error).message }
        );
      }

      console.error(
        `Failed to load template component: ${templateName}/${componentPath}`,
        error
      );
      throw new Error(`Template loading failed: ${(error as Error).message}`);
    }
  }

  /**
   * Binds a template to a specific tenant configuration
   */
  bindTenantContext<T = any>(
    Component: ComponentType<T>,
    tenantConfig: any,
    Providers: ComponentType<{ config: any; children: React.ReactNode }>
  ): ComponentType<T> {
    const BoundComponent = (props: T & { children?: React.ReactNode }) => (
      <Providers config={tenantConfig}>
        <Component {...props} />
      </Providers>
    );

    BoundComponent.displayName = `Bound(${
      Component.displayName || Component.name || 'Component'
    })`;
    return BoundComponent as ComponentType<T>;
  }
}

/**
 * Singleton instance of the loader
 */
export const templateLoader = new TemplateLoader();
