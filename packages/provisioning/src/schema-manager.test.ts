/**
 * Schema Manager Tests
 * S2: Tenant Isolation Protocol
 * Rule 4.1: Test Coverage Mandate
 */

import { publicPool } from '@apex/db';
import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import {
  createTenantSchema,
  dropTenantSchema,
  sanitizeSchemaName,
  verifySchemaExists,
} from './schema-manager.js';

mock.module('@apex/db', () => ({
  publicPool: {
    connect: mock(),
  },
}));

describe('SchemaManager', () => {
  let mockClient: any;

  beforeEach(() => {
    mock.restore();
    mockClient = {
      query: mock(),
      release: mock(),
    };
    (publicPool.connect as any).mockResolvedValue(mockClient);
  });

  describe('sanitizeSchemaName', () => {
    it.each([
      { input: 'Alpha', expected: 'tenant_alpha' },
      { input: '  beta-123  ', expected: 'tenant_beta-123' },
      { input: 'gamma_delta', expected: 'tenant_gamma_delta' },
      { input: '123store', expected: 'tenant__123store' },
    ])('should sanitize "$input" to "$expected"', ({ input, expected }) => {
      expect(sanitizeSchemaName(input)).toBe(expected);
    });

    it.each([
      { input: 'a!', error: 'Invalid subdomain' },
      { input: 'a', error: 'too short' },
      { input: 'a'.repeat(60), error: 'exceeds 50 character limit' },
    ])('should throw for invalid input "$input"', ({ input, error }) => {
      expect(() => sanitizeSchemaName(input)).toThrow(error);
    });
  });

  describe('createTenantSchema', () => {
    it('should create schema when it does not exist', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // existence check
      mockClient.query.mockResolvedValueOnce({}); // create schema

      const result = await createTenantSchema('new-tenant');

      expect(result.schemaName).toBe('tenant_new-tenant');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE SCHEMA')
      );
    });

    it('should throw if schema already exists', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ schema_name: 'tenant_exists' }],
      });

      await expect(createTenantSchema('exists')).rejects.toThrow(
        'already exists'
      );
    });
  });

  describe('verifySchemaExists', () => {
    it('should return true and table count if schema exists', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ schema_name: 'tenant_tenant1' }],
      });
      mockClient.query.mockResolvedValueOnce({ rows: [{ count: '10' }] });

      const result = await verifySchemaExists('tenant1');

      expect(result.exists).toBe(true);
      expect(result.tableCount).toBe(10);
    });

    it('should return false if schema does not exist', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await verifySchemaExists('missing-tenant');

      expect(result.exists).toBe(false);
      expect(result.tableCount).toBe(0);
    });
  });

  describe('dropTenantSchema', () => {
    it('should drop existing schema', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ schema_name: 'tenant_tenant2' }],
      });
      mockClient.query.mockResolvedValueOnce({}); // drop

      const result = await dropTenantSchema('tenant2');

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DROP SCHEMA')
      );
    });

    it('should return false if schema does not exist', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await dropTenantSchema('non-existent');

      expect(result).toBe(false);
    });

    it('should prevent dropping non-empty schema if verifyEmpty is true', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ schema_name: 'tenant_busy' }],
      });
      mockClient.query.mockResolvedValueOnce({ rows: [{ count: '5' }] });

      await expect(dropTenantSchema('busy', true)).rejects.toThrow(
        'is not empty'
      );
    });

    it('should allow dropping empty schema if verifyEmpty is true', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ schema_name: 'tenant_empty' }],
      });
      mockClient.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      mockClient.query.mockResolvedValueOnce({}); // drop

      const result = await dropTenantSchema('empty', true);
      expect(result).toBe(true);
    });
  });

  describe('listTenantSchemas', () => {
    it('should return a list of tenant schemas', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ schema_name: 'tenant_a' }, { schema_name: 'tenant_b' }],
      });

      const { listTenantSchemas } = await import('./schema-manager.js');
      const result = await listTenantSchemas();

      expect(result).toEqual(['tenant_a', 'tenant_b']);
    });
  });
});
