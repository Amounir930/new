/**
 * @apex/test-utils Tests
 */

import { describe, expect, it } from 'bun:test';
import * as utils from './index';

describe('@apex/test-utils', () => {
  it('should export testing utilities', () => {
    expect(utils).toBeDefined();
  });
});
