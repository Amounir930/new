/**
 * CLI Provisioning Tool Tests
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';

// Define mocks first
const mockApp = {
  get: mock(),
  close: mock(),
};

mock.module('@nestjs/core', () => ({
  NestFactory: {
    createApplicationContext: mock().mockResolvedValue(mockApp),
  },
}));

// Mock ProvisioningService
const mockProvisioningService = {
  provision: mock().mockResolvedValue({ subdomain: 'test', durationMs: 100 }),
};

import { main } from './provision.js';

describe('CLI Provisioning', () => {
  beforeEach(() => {
    mock.restore();
    mockApp.get.mockClear();
    mockApp.close.mockClear();
    mockProvisioningService.provision.mockClear();
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
      expect(mockProvisioningService.provision).toHaveBeenCalled();
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
