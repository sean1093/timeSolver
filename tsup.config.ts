import { defineConfig } from 'tsup';

export default defineConfig([
  // Library entries: ESM (.js, because package.json is type: module) + CJS (.cjs) + types.
  {
    entry: { index: 'src/index.ts', profiler: 'src/profiler.ts' },
    format: ['esm', 'cjs'],
    target: 'es2022',
    outDir: 'dist',
    dts: true,
    sourcemap: true,
    treeshake: true,
    // Two entries only, sharing a few hundred bytes. Self-contained files beat
    // a shared chunk here: nothing to resolve, and `size` measures the truth.
    splitting: false,
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
    // No source map for this one. It was 102 kB against a 17 kB bundle -- a
    // fifth of everything an install downloads, and unpkg and jsdelivr serve it
    // next to the script tag it describes. The ESM and CJS builds keep theirs,
    // because a bundler consumer really does step into this code; nobody
    // debugs a minified browser global against the TypeScript sources.
    sourcemap: false,
  },
]);
