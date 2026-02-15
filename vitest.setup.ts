// 🛡️ Root Vitest Setup
// Used to initialize test environment across all workspace packages

import { beforeAll } from 'vitest';

beforeAll(() => {
  // Global test setup logic (e.g., setting up mock env vars)
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL || 'postgres://localhost:5432/test';
});
