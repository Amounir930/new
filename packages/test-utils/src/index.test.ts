/**
 * @apex/test-utils Tests
 */

import { describe, expect, it, vi } from 'vitest';
import * as utils from './index.js';

describe('@apex/test-utils', () => {
    it('should export testing utilities', () => {
        expect(utils).toBeDefined();
    });
});
