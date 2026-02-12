import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    external: ['react', 'react-dom'],
    tsconfig: './tsconfig.json',
    splitting: true,
    sourcemap: false,
    clean: true,
});
