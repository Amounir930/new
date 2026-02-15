/**
 * @apex/validators Tests
 */

import { describe, expect, it } from 'bun:test';
import * as validators from './index.js';

describe('@apex/validators', () => {
  it('should export all required storefront schemas', () => {
    expect(validators.TenantConfigSchema).toBeDefined();
    expect(validators.ProductSchema).toBeDefined();
    expect(validators.CartSchema).toBeDefined();
    expect(validators.OrderSchema).toBeDefined();
    expect(validators.CategorySchema).toBeDefined();
    expect(validators.ReviewSchema).toBeDefined();
    expect(validators.CustomerSchema).toBeDefined();
  });
});
