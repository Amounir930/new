/**
 * @apex/provisioning
 * The 60-Second Store Provisoning Engine
 */

export {
  MASTER_FEATURE_LIST,
  MASTER_QUOTA_LIST,
} from './blueprint/constants';
export type { MasterFeature } from './blueprint/constants';
export { validateBlueprint } from './blueprint/executor'; // Explicit export
export * from './blueprint/types'; // Export types for BlueprintTemplate
export * from './blueprint';
export * from './quota-service';
export * from './runner';
export * from './schema-manager';
export * from './seeder';
export * from './snapshot-manager';
export * from './storage-manager';
export * from './tenant-overview';

export interface ProvisioningOptions {
  subdomain: string;
  adminEmail: string;
  storeName: string;
  plan?: 'free' | 'basic' | 'pro' | 'enterprise';
}

export interface ProvisioningResult {
  tenantId: string;
  subdomain: string;
  dbSchema: string;
  storageBucket: string;
  provisionedAt: Date;
  status: 'complete' | 'failed';
}
