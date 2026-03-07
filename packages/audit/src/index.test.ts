import { describe, expect, it } from 'bun:test';
import {
  AuditService,
  initializeAuditTable,
  log,
  logProvisioning,
  logSecurityEvent,
  query,
} from './index';

describe('Audit Module Exports', () => {
  it('should export AuditService', () => {
    expect(AuditService).toBeDefined();
  });

  it('should export log function', () => {
    expect(log).toBeDefined();
  });

  it('should export logProvisioning function', () => {
    expect(logProvisioning).toBeDefined();
  });

  it('should export logSecurityEvent function', () => {
    expect(logSecurityEvent).toBeDefined();
  });

  it('should export query function', () => {
    expect(query).toBeDefined();
  });

  it('should export initializeAuditTable function', () => {
    expect(initializeAuditTable).toBeDefined();
  });
});
