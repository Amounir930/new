import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplateLoader } from './loader';

// Mock @apex/audit
vi.mock('@apex/audit', () => ({
  logSecurityEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('TemplateLoader', () => {
  let loader: TemplateLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    loader = new TemplateLoader({ enableAudit: true });
  });

  it('should reject path traversal in templateName', async () => {
    await expect(loader.loadComponent('../secret')).rejects.toThrow(
      'S2 Violation'
    );
  });

  it('should reject path traversal in componentPath', async () => {
    await expect(
      loader.loadComponent('fashion', '../../etc/passwd')
    ).rejects.toThrow('S2 Violation');
  });

  it('should reject paths with dots', async () => {
    await expect(loader.loadComponent('fashion.old')).rejects.toThrow(
      'S2 Violation'
    );
  });

  it('should successfully bind tenant context (HOC)', () => {
    const MockComponent = ({ config, name }: any) =>
      React.createElement(
        'div',
        null,
        `Store: ${config.storeName}, User: ${name}`
      );
    const MockProviders = ({ config, children }: any) =>
      React.createElement('section', { title: config.storeName }, children);

    const tenantConfig = { storeName: 'Apex Store' };
    const Bound = loader.bindTenantContext(
      MockComponent as any,
      tenantConfig,
      MockProviders as any
    );

    expect(Bound).toBeDefined();
    expect(Bound.displayName).toContain('Bound');
  });
});
