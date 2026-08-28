import { defineConfig } from 'tsup';

export default defineConfig([
  // Library entries: ESM (.js, because package.json is type: module) + CJS (.cjs) + types.
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    target: 'es2022',
    outDir: 'dist',
    dts: true,
    sourcemap: true,
    treeshake: true,
    clean: true,
  },
  // Browser global for <script> tags. Keeps the v1 `timeSolver.getString(...)` usage working.
  {
    entry: { timesolver: 'src/index.ts' },
    format: ['iife'],
    globalName: 'timeSolver',
    target: 'es2018',
    outDir: 'dist',
    outExtension: () => ({ js: '.global.js' }),
    minify: true,
    sourcemap: true,
  },
]);
