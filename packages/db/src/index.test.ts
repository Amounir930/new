import { describe, expect, it } from 'bun:test';
import * as db from './index.js';

describe('DB Module Exports', () => {
  it('should export tenants', () => {
    expect(db.tenants).toBeDefined();
  });

  it('should export users', () => {
    expect(db.users).toBeDefined();
  });

  it('should export stores', () => {
    expect(db.stores).toBeDefined();
  });

  it('should export settings', () => {
    expect(db.settings).toBeDefined();
  });

  it('should export auditLogs', () => {
    expect(db.auditLogs).toBeDefined();
  });

  it('should export publicDb', () => {
    expect(db.publicDb).toBeDefined();
  });

  it('should export publicPool', () => {
    expect(db.publicPool).toBeDefined();
  });
});
