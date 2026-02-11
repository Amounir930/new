import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@apex/security': resolve(__dirname, '../security/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
