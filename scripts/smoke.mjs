#!/usr/bin/env node

/**
 * Packaging smoke test.
 *
 * timesolver@1.2.0 was published with `main` pointing at a file that was not in
 * the tarball, and with an `exports.types` entry naming a declaration file no
 * build step produced. Every unit test passed, because the suite imported a
 * stale copy of the source through Jest's CommonJS transform and never once
 * loaded the package entry point.
 *
 * This script closes that gap. It touches only build output and package.json,
 * exercises the three consumption paths a released tarball has to support --
 * ESM import, CommonJS require, and a plain <script> tag -- confirms every path
 * the exports map advertises exists on disk, and calls into each bundle so
 * "loads" is not mistaken for "works".
 *
 * Zero dependencies. Exits non-zero on the first failed assertion.
 */

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

/** The exports a consumer is most likely to reach for first. */
const CORE_EXPORTS = ['add', 'subtract', 'between', 'getString', 'isValid'];

/** March 17 2024, local time. Formats to a value with no ambiguous digits. */
const SAMPLE = new Date(2024, 2, 17);
const SAMPLE_FORMAT = 'YYYY-MM-DD';
const SAMPLE_RENDERED = '2024-03-17';

let passed = 0;

function ok(label) {
  passed += 1;
  console.log(`ok - ${label}`);
}

function fail(label, detail) {
  console.error(`not ok - ${label}`);
  if (detail) {
    console.error('');
    console.error(detail);
  }
  console.error('');
  console.error(`smoke failed after ${passed} passing check${passed === 1 ? '' : 's'}.`);
  process.exit(1);
}

function check(label, condition, detail) {
  if (condition) {
    ok(label);
  } else {
    fail(label, detail);
  }
}

function describe(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  return typeof value;
}

/** Resolve a build artifact, failing with a build hint when it is absent. */
function artifact(relative) {
  const target = join(dist, relative);
  if (!existsSync(target)) {
    fail(
      `dist/${relative} exists`,
      `The build did not emit dist/${relative}.\nRun \`npm run build\`, then run this check again.`,
    );
  }
  return target;
}

async function loadEsm(relative) {
  try {
    return await import(pathToFileURL(artifact(relative)).href);
  } catch (error) {
    return fail(`dist/${relative} imports as ESM`, `import() threw: ${error.message}`);
  }
}

function loadCjs(relative) {
  try {
    return require(artifact(relative));
  } catch (error) {
    return fail(`dist/${relative} loads as CommonJS`, `require() threw: ${error.message}`);
  }
}

/** Flatten an exports map into [description, target] pairs. */
function* exportTargets(node, trail) {
  if (node === null || node === undefined) return;
  if (typeof node === 'string') {
    yield [trail, node];
    return;
  }
  if (Array.isArray(node)) {
    for (const [index, value] of node.entries()) {
      yield* exportTargets(value, `${trail}[${index}]`);
    }
    return;
  }
  for (const [condition, value] of Object.entries(node)) {
    yield* exportTargets(value, `${trail}[${JSON.stringify(condition)}]`);
  }
}

function assertSurface(label, mod, names) {
  const missing = names.filter((name) => typeof mod[name] !== 'function');
  check(
    `${label} exports ${names.join(', ')}`,
    missing.length === 0,
    `Missing or not callable: ${missing.join(', ')}.\n` +
      `Available keys: ${Object.keys(mod).join(', ') || '(none -- the entry point exports nothing)'}`,
  );
}

function assertBehaviour(label, mod) {
  let rendered;
  try {
    rendered = mod.getString(SAMPLE, SAMPLE_FORMAT);
  } catch (error) {
    fail(`${label} getString() runs`, `getString() threw: ${error.message}`);
  }
  check(
    `${label} getString(2024-03-17, '${SAMPLE_FORMAT}') === '${SAMPLE_RENDERED}'`,
    rendered === SAMPLE_RENDERED,
    `Received ${JSON.stringify(rendered)}.`,
  );

  const input = new Date(0);
  mod.add(input, 1, 'D');
  check(
    `${label} add() leaves the caller's Date untouched`,
    input.getTime() === 0,
    `The input moved to ${input.toISOString()}. v1 mutated its argument; v2 must not.`,
  );
}

function assertProfiler(label, mod) {
  check(
    `${label} exports createProfiler`,
    typeof mod.createProfiler === 'function',
    `Available keys: ${Object.keys(mod).join(', ') || '(none)'}`,
  );

  let profiler;
  try {
    profiler = mod.createProfiler();
  } catch (error) {
    fail(`${label} createProfiler() runs`, `createProfiler() threw: ${error.message}`);
  }
  const methods = ['start', 'mark', 'report', 'print'];
  const missing = methods.filter((name) => typeof profiler?.[name] !== 'function');
  check(
    `${label} createProfiler() returns ${methods.join('/')}`,
    missing.length === 0,
    `Missing or not callable: ${missing.join(', ')}.`,
  );
}

if (!existsSync(dist)) {
  fail(
    'dist/ exists',
    'No build output found at dist/.\n' +
      'This check runs against the artifacts a consumer would install.\n' +
      'Run `npm run build` first, then `npm run smoke`.',
  );
}

// 1. ESM entry point -- `import 'timesolver'`.
const esm = await loadEsm('index.js');
check(
  'dist/index.js (ESM) has a default export object',
  esm.default !== null && typeof esm.default === 'object',
  `Expected an object, received ${describe(esm.default)}.`,
);
assertSurface('dist/index.js (ESM)', esm, CORE_EXPORTS);

// 2. CommonJS entry point -- `require('timesolver')`, the path v1 broke outright.
const cjs = loadCjs('index.cjs');
check(
  'dist/index.cjs (CJS) has a default export object',
  cjs.default !== null && typeof cjs.default === 'object',
  `Expected an object, received ${describe(cjs.default)}.`,
);
assertSurface('dist/index.cjs (CJS)', cjs, CORE_EXPORTS);

// 3. The `timesolver/profiler` subpath, both conditions.
assertProfiler('dist/profiler.js (ESM)', await loadEsm('profiler.js'));
assertProfiler('dist/profiler.cjs (CJS)', loadCjs('profiler.cjs'));

// 4. The <script> bundle, evaluated in a context that starts with no globals of
//    ours, so a bundle that quietly relies on the caller's scope fails here.
const sandbox = createContext({ console });
try {
  runInContext(readFileSync(artifact('timesolver.global.js'), 'utf8'), sandbox, {
    filename: 'dist/timesolver.global.js',
  });
} catch (error) {
  fail('dist/timesolver.global.js evaluates', `Evaluation threw: ${error.message}`);
}
check(
  'dist/timesolver.global.js defines a timeSolver global',
  sandbox.timeSolver !== null && typeof sandbox.timeSolver === 'object',
  `globalThis.timeSolver is ${describe(sandbox.timeSolver)} after evaluating the bundle.`,
);
check(
  'the timeSolver global carries getString',
  typeof sandbox.timeSolver.getString === 'function',
  `Available keys: ${Object.keys(sandbox.timeSolver).join(', ') || '(none)'}`,
);
// Built inside the context so the Date is the sandbox's own intrinsic.
check(
  `the timeSolver global renders '${SAMPLE_RENDERED}'`,
  runInContext(
    `timeSolver.getString(new Date(2024, 2, 17), ${JSON.stringify(SAMPLE_FORMAT)})`,
    sandbox,
    { filename: 'smoke:global-behaviour' },
  ) === SAMPLE_RENDERED,
  'The global bundle loaded but did not format correctly.',
);
// Built inside the context so the Date is the sandbox's own intrinsic. A
// bundle whose add() mutates its argument passes every other check here.
check(
  "the timeSolver global leaves the caller's Date untouched",
  runInContext(
    '(() => { const d = new Date(0); timeSolver.add(d, 1, "D"); return d.getTime() === 0; })()',
    sandbox,
    { filename: 'smoke:global-immutability' },
  ) === true,
  'The global bundle mutated its input. v1 mutated its argument; v2 must not.',
);

// 5. Every path the manifest advertises must exist. This is the exact check
//    that would have stopped the 1.2.0 release.
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const targets = [...exportTargets(pkg.exports, 'exports')];
check('package.json declares an exports map', targets.length > 0, 'package.json has no "exports" field.');

for (const [trail, target] of targets) {
  if (target.includes('*')) {
    fail(
      `${trail} -> ${target} resolves`,
      'Subpath patterns cannot be resolved by an existence check.\nExtend scripts/smoke.mjs when the exports map gains a wildcard.',
    );
  }
  check(
    `${trail} -> ${target} exists on disk`,
    existsSync(resolve(root, target)),
    `package.json advertises ${target}, but that path does not exist.\n` +
      'A consumer installing this tarball would fail to resolve it.',
  );
}

for (const declaration of ['index.d.ts', 'profiler.d.ts']) {
  check(
    `dist/${declaration} exists`,
    existsSync(join(dist, declaration)),
    `The build emitted no declarations for dist/${declaration}.\n` +
      'v1 advertised types it never generated; TypeScript consumers saw "any".',
  );
}

// 6. Each entry point computes, rather than merely resolving.
assertBehaviour('dist/index.js (ESM)', esm);
assertBehaviour('dist/index.cjs (CJS)', cjs);

// 7. Consume the package the way a dependent does: by name, so resolution goes
//    through the exports map instead of reaching into dist/ directly. Node
//    self-references a package by its own name when it declares "exports", so a
//    broken or misordered condition fails here even though the files exist.
const { name } = pkg;

for (const [specifier, loader] of [
  [name, async () => await import(name)],
  [`${name}/profiler`, async () => await import(`${name}/profiler`)],
]) {
  try {
    const mod = await loader();

    ok(`import '${specifier}' resolves through the exports map`);
    if (specifier === name) {
      assertSurface(`import '${specifier}'`, mod, CORE_EXPORTS);
      assertBehaviour(`import '${specifier}'`, mod);
    } else {
      assertProfiler(`import '${specifier}'`, mod);
    }
  } catch (error) {
    fail(`import '${specifier}' resolves through the exports map`, error.message);
  }
}

for (const specifier of [name, `${name}/profiler`]) {
  try {
    const mod = require(specifier);

    ok(`require('${specifier}') resolves through the exports map`);
    if (specifier === name) {
      assertSurface(`require('${specifier}')`, mod, CORE_EXPORTS);
      assertBehaviour(`require('${specifier}')`, mod);
    } else {
      assertProfiler(`require('${specifier}')`, mod);
    }
  } catch (error) {
    fail(`require('${specifier}') resolves through the exports map`, error.message);
  }
}

console.log('');
console.log(
  `smoke passed - ${passed} checks over ESM, CommonJS, the global bundle, the exports map, package-name resolution, and behaviour.`,
);
