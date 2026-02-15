/**
 * Public Decorator Tests
 * Rule 4.1: Test Coverage Mandate
 */

import { describe, expect, it } from 'bun:test';
import { IS_PUBLIC_KEY, Public } from './public.decorator.js';

describe('Public Decorator', () => {
  it('should have correct metadata key', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });

  it('should create decorator function', () => {
    const decorator = Public();
    expect(typeof decorator).toBe('function');
  });

  it('should be defined', () => {
    expect(Public).toBeDefined();
  });
});
