import { describe, expect, it } from 'vitest';
import {
  InMemoryEventBus,
  TenantProvisioningStartedSchema,
  createCorrelationId,
  createEventId,
  createTimestamp,
  validateEvent,
} from './index.js';

describe('Events Module Exports', () => {
  it('should export InMemoryEventBus', () => {
    expect(InMemoryEventBus).toBeDefined();
  });

  it('should export createEventId', () => {
    expect(createEventId).toBeDefined();
  });

  it('should export createCorrelationId', () => {
    expect(createCorrelationId).toBeDefined();
  });

  it('should export createTimestamp', () => {
    expect(createTimestamp).toBeDefined();
  });

  it('should export validateEvent', () => {
    expect(validateEvent).toBeDefined();
  });

  it('should export TenantProvisioningStartedSchema', () => {
    expect(TenantProvisioningStartedSchema).toBeDefined();
  });
});
