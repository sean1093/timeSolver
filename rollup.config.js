import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from '@rollup/plugin-terser';
import packageJson from './package.json';

const isProduction = process.env.NODE_ENV === 'production';

export default [
  // ES Module build
  {
    input: 'src/index.js',
    output: {
      file: packageJson.module,
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      isProduction && terser(),
    ],
  },
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      isProduction && terser(),
    ],
  },
  // UMD build (for browser global) - optional, but good for direct script include
  {
    input: 'src/index.js',
    output: {
      name: 'timeSolver', // Global variable name
      file: 'dist/timeSolver.umd.js',
      format: 'umd',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      isProduction && terser(),
    ],
  },
  // UMD minified build
  {
    input: 'src/index.js',
    output: {
      name: 'timeSolver', // Global variable name
      file: 'dist/timeSolver.umd.min.js',
      format: 'umd',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      terser(), // Always minify UMD min file
    ],
  },
];
