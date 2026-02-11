/**
 * CLI Provisioning Tool Tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { main } from './provision.js';

// Mock NestJS
const { mockApp } = vi.hoisted(() => ({
  mockApp: {
    get: vi.fn(),
    close: vi.fn(),
  },
}));

vi.mock('@nestjs/core', async () => {
  const actual = await vi.importActual<typeof import('@nestjs/core')>('@nestjs/core');
  return {
    ...actual,
    NestFactory: {
      createApplicationContext: vi.fn().mockResolvedValue(mockApp),
    },
  };
});

// Mock ProvisioningService
const mockProvisioningService = {
  provision: vi.fn().mockResolvedValue({ subdomain: 'test', durationMs: 100 }),
};

describe('CLI Provisioning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp.get.mockReturnValue(mockProvisioningService);
  });

  describe('Argument Parsing & Main Flow', () => {
    it('should execute successfully with valid arguments', async () => {
      const args = [
        '--subdomain=test',
        '--plan=pro',
        '--email=admin@test.com',
        '--password=pass123',
        '--store-name=Test Store',
        '--quiet',
      ];

      const result = await main(args);

      expect(result.subdomain).toBe('test');
      expect(mockProvisioningService.provision).toHaveBeenCalledWith(
        expect.objectContaining({
          subdomain: 'test',
          plan: 'pro',
          adminEmail: 'admin@test.com',
        })
      );
      expect(mockApp.close).toHaveBeenCalled();
    });

    it('should throw error for missing arguments', async () => {
      await expect(main(['--subdomain=only'])).rejects.toThrow(
        'Missing required arguments'
      );
    });

    it('should handle provisioning service failures', async () => {
      mockProvisioningService.provision.mockRejectedValueOnce(
        new Error('Provisioning Crash')
      );
      const args = [
        '--subdomain=x',
        '--email=x@x.com',
        '--password=p',
        '--store-name=X',
        '--quiet',
      ];
      await expect(main(args)).rejects.toThrow('Provisioning Crash');
    });
  });
});
