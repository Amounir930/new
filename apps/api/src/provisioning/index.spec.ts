import { describe, expect, it } from 'bun:test';
import {
  ProvisioningController,
  ProvisioningModule,
  ProvisioningService,
} from './index.js';

describe('Provisioning Index Exports', () => {
  it('should export ProvisioningController', () => {
    expect(ProvisioningController).toBeDefined();
  });

  it('should export ProvisioningService', () => {
    expect(ProvisioningService).toBeDefined();
  });

  it('should export ProvisioningModule', () => {
    expect(ProvisioningModule).toBeDefined();
  });
});
