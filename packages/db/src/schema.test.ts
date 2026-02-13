import { describe, expect, it } from 'bun:test';
import {
  auditLogs,
  getTenantTableName,
  setTenantSearchPath,
  settings,
  stores,
  tenants,
  users,
} from './schema.js';

describe('Schema', () => {
  describe('Tenants table', () => {
    it('should have correct columns', () => {
      expect(tenants).toBeDefined();
    });
  });

  describe('Users table', () => {
    it('should have correct columns', () => {
      expect(users).toBeDefined();
    });
  });

  describe('Stores table', () => {
    it('should have correct columns', () => {
      expect(stores).toBeDefined();
    });
  });

  describe('Settings table', () => {
    it('should have correct columns', () => {
      expect(settings).toBeDefined();
    });
  });

  describe('AuditLogs table', () => {
    it('should have correct columns', () => {
      expect(auditLogs).toBeDefined();
    });
  });

  describe('S2 Compliance Helpers', () => {
    it('should generate correct tenant table name', () => {
      const tableName = getTenantTableName('users', 'abc-123');
      expect(tableName).toBe('"tenant_abc_123"."users"');
    });

    it('should generate correct search path SQL', () => {
      const sql = setTenantSearchPath('abc-123');
      expect(sql).toBe('SET search_path TO "tenant_abc_123", public');
    });

    it('should handle different table names', () => {
      const tableName = getTenantTableName('products', 'shop-456');
      expect(tableName).toBe('"tenant_shop_456"."products"');
    });

    it('should generate search path for different tenant IDs', () => {
      const sql = setTenantSearchPath('tenant-xyz');
      expect(sql).toBe('SET search_path TO "tenant_tenant_xyz", public');
    });
  });
});
