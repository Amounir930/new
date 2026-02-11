import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@apex/audit': resolve(__dirname, '../audit/src/index.ts'),
            '@apex/db': resolve(__dirname, '../db/src/index.ts'),
            '@apex/test-utils': resolve(__dirname, '../test-utils/src/index.ts'),
            '@apex/config': resolve(__dirname, '../config/src/index.ts'),
            '@apex/export': resolve(__dirname, './src/index.ts'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'istanbul',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/**',
                'dist/**',
                '**/*.d.ts',
                '**/*.test.ts',
                '**/*.spec.ts',
            ],
        },
    },
});
