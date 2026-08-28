import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it, vi } from 'vitest';

/**
 * The gate scripts decide whether a release is publishable, so a gate that
 * silently passes everything is worse than no gate at all. These tests drive
 * each script as a subprocess against throwaway fixture packages and assert
 * that it *fails*, with the message it promises, for every defect it exists to
 * catch -- including the two that shipped in 1.2.0.
 *
 * The fixtures are built from the real build output rather than hand-written
 * stubs, so a fixture cannot drift away from what the scripts actually read.
 * Every script resolves its own root from `import.meta.url`, so each one runs
 * against its fixture simply by being copied into it; nothing here needs, or
 * is allowed to touch, the repository's own dist/ or api-surface.txt.
 *
 * Everything in this file needs `npm run build` output. On a clean checkout the
 * suites skip, so `npm test` still passes.
 */

// Every test here spawns at least one Node process, and the zones gate spawns
// seven of its own, one per zone. Vitest's 5-second default is sized for unit
// tests; on a shared CI runner process startup alone can approach it, so these
// get a bound that fails on a genuine hang rather than on a slow machine.
vi.setConfig({ testTimeout: 120_000 });

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The artifacts the fixtures are cut from. Absent on a clean checkout. */
const ARTIFACTS = [
  'index.js',
  'index.cjs',
  'index.d.ts',
  'index.d.cts',
  'profiler.js',
  'profiler.cjs',
  'profiler.d.ts',
  'profiler.d.cts',
  'timesolver.global.js',
];

const isBuilt = ARTIFACTS.every((file) => existsSync(join(repo, 'dist', file)));

/** The seven functions zones.mjs imports from `dist/index.js`. */
const ZONE_IMPORTS = ['add', 'between', 'endOf', 'getString', 'parse', 'startOf', 'subtract'];

interface Manifest {
  exports: Record<string, unknown>;
  [field: string]: unknown;
}

interface Result {
  status: number | null;
  stdout: string;
  stderr: string;
}

const fixtures: string[] = [];

afterAll(() => {
  for (const fixture of fixtures.splice(0)) {
    rmSync(fixture, { recursive: true, force: true });
  }
});

/** A throwaway directory outside the repository, removed when the file is done. */
function scratch(name: string): string {
  const fixture = mkdtempSync(join(realpathSync(tmpdir()), `timesolver-${name}-`));
  fixtures.push(fixture);
  return fixture;
}

/**
 * Run a gate script from an unrelated working directory: every script derives
 * its root from its own location, and a script that reads the caller's cwd
 * would pass in CI and fail for anyone running it from a subdirectory.
 */
function runGate(packageRoot: string, script: string, args: readonly string[] = []): Result {
  const result = spawnSync(process.execPath, [join(packageRoot, 'scripts', script), ...args], {
    cwd: realpathSync(tmpdir()),
    encoding: 'utf8',
  });

  if (result.error) throw result.error;

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** A copy of this package: the real manifest, the real build, the real script. */
function packageFixture(name: string, script: string): string {
  const fixture = scratch(name);
  mkdirSync(join(fixture, 'scripts'));
  cpSync(join(repo, 'scripts', script), join(fixture, 'scripts', script));
  cpSync(join(repo, 'dist'), join(fixture, 'dist'), { recursive: true });
  cpSync(join(repo, 'package.json'), join(fixture, 'package.json'));
  return fixture;
}

function editManifest(fixture: string, edit: (manifest: Manifest) => void): void {
  const file = join(fixture, 'package.json');
  const manifest = JSON.parse(readFileSync(file, 'utf8')) as Manifest;
  edit(manifest);
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
}

/**
 * Replace `dist/index.js` with a module that re-exports the real build and
 * overrides one function. `export *` never re-exports a name the module
 * exports itself, so the override wins; `default` is not covered by `export *`
 * at all, hence the explicit re-export. Reusing the real implementation keeps
 * the fixture honest: only the named function misbehaves.
 */
function overrideEntry(fixture: string, override: string): void {
  const entry = join(fixture, 'dist', 'index.js');
  renameSync(entry, join(fixture, 'dist', 'index.impl.js'));
  writeFileSync(
    entry,
    `export { default } from './index.impl.js';\nexport * from './index.impl.js';\n${override}`,
  );
}

describe.skipIf(!isBuilt)('scripts/smoke.mjs', () => {
  it('passes against a faithful copy of the package', () => {
    const result = runGate(packageFixture('smoke-ok', 'smoke.mjs'), 'smoke.mjs');

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('smoke passed -');
    expect(result.stdout).not.toContain('not ok');

    // The count is a lower bound so adding a check does not fail this test,
    // while dropping one below the documented 42 does.
    const checks = Number(/smoke passed - (\d+) checks/.exec(result.stdout)?.[1]);
    expect(checks).toBeGreaterThanOrEqual(42);
  });

  it('fails with a build hint when dist/ is absent', () => {
    const fixture = packageFixture('smoke-unbuilt', 'smoke.mjs');
    rmSync(join(fixture, 'dist'), { recursive: true });

    const result = runGate(fixture, 'smoke.mjs');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('not ok - dist/ exists');
    expect(result.stderr).toContain('Run `npm run build` first');
    expect(result.stderr).toContain('artifacts a consumer would install');
  });

  it('fails when an exports target names a file the tarball does not contain', () => {
    const fixture = packageFixture('smoke-ghost-export', 'smoke.mjs');
    editManifest(fixture, (manifest) => {
      manifest.exports['./calendar'] = {
        import: './dist/calendar.js',
        require: './dist/calendar.cjs',
      };
    });

    const result = runGate(fixture, 'smoke.mjs');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('./dist/calendar.js exists on disk');
    expect(result.stderr).toContain('package.json advertises ./dist/calendar.js');
    expect(result.stderr).toContain('would fail to resolve it');
  });

  it('fails when the main entry point exports an empty namespace', () => {
    const fixture = packageFixture('smoke-empty-index', 'smoke.mjs');
    writeFileSync(join(fixture, 'dist', 'index.js'), 'export {};\n');

    const result = runGate(fixture, 'smoke.mjs');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('not ok - dist/index.js (ESM) has a default export object');
    expect(result.stderr).toContain('received undefined');
  });

  it('fails when the profiler entry point exports an empty namespace', () => {
    const fixture = packageFixture('smoke-empty-profiler', 'smoke.mjs');
    writeFileSync(join(fixture, 'dist', 'profiler.js'), 'export {};\n');

    const result = runGate(fixture, 'smoke.mjs');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('not ok - dist/profiler.js (ESM) exports createProfiler');
    expect(result.stderr).toContain('Available keys: (none)');
  });

  it('fails when a declared .d.ts was never generated', () => {
    const fixture = packageFixture('smoke-no-declarations', 'smoke.mjs');

    // A manifest that advertises types through the top-level `types` field
    // instead of an exports condition, which is how v1 advertised
    // declarations it never emitted.
    editManifest(fixture, (manifest) => {
      manifest.exports = {
        '.': { import: './dist/index.js', require: './dist/index.cjs' },
        './profiler': { import: './dist/profiler.js', require: './dist/profiler.cjs' },
        './package.json': './package.json',
      };
    });
    unlinkSync(join(fixture, 'dist', 'index.d.ts'));

    const result = runGate(fixture, 'smoke.mjs');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('not ok - dist/index.d.ts exists');
    expect(result.stderr).toContain('The build emitted no declarations for dist/index.d.ts');
  });

  it('fails when the IIFE bundle never assigns its global', () => {
    const fixture = packageFixture('smoke-no-global', 'smoke.mjs');
    writeFileSync(join(fixture, 'dist', 'timesolver.global.js'), '(() => {\n  void 0;\n})();\n');

    const result = runGate(fixture, 'smoke.mjs');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'not ok - dist/timesolver.global.js defines a timeSolver global',
    );
    expect(result.stderr).toContain('globalThis.timeSolver is undefined');
  });

  it('fails when add mutates its argument', () => {
    const fixture = packageFixture('smoke-mutating-add', 'smoke.mjs');
    overrideEntry(
      fixture,
      [
        "import { add as real } from './index.impl.js';",
        'export function add(date, amount, unit) {',
        '  const moved = real(date, amount, unit);',
        '  date.setTime(moved.getTime());',
        '  return moved;',
        '}',
        '',
      ].join('\n'),
    );

    const result = runGate(fixture, 'smoke.mjs');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "not ok - dist/index.js (ESM) add() leaves the caller's Date untouched",
    );
    expect(result.stderr).toContain('v1 mutated its argument; v2 must not');
  });
});

describe.skipIf(!isBuilt)('scripts/zones.mjs', () => {
  /** zones.mjs reads `dist/index.js` and nothing else. */
  function zonesFixture(name: string, entry: string, { withImpl = false } = {}): string {
    const fixture = scratch(name);
    mkdirSync(join(fixture, 'scripts'));
    cpSync(join(repo, 'scripts', 'zones.mjs'), join(fixture, 'scripts', 'zones.mjs'));
    mkdirSync(join(fixture, 'dist'));
    if (withImpl) {
      cpSync(join(repo, 'dist', 'index.js'), join(fixture, 'dist', 'index.impl.js'));
    }
    writeFileSync(join(fixture, 'dist', 'index.js'), entry);
    return fixture;
  }

  it('passes against the real built dist/', () => {
    const result = runGate(repo, 'zones.mjs');

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^\d+ of 7 zones hold/m);
    expect(result.stdout).not.toContain('not ok');
  });

  it('fails when a broken invariant makes endOf leave the calendar date', () => {
    // One millisecond past the end of the day, so endOf(day) rolls over onto
    // the next calendar date -- the America/Santiago defect, made universal.
    const fixture = zonesFixture(
      'zones-broken-endof',
      [
        "export { default } from './index.impl.js';",
        "export * from './index.impl.js';",
        "import { endOf as real } from './index.impl.js';",
        'export function endOf(date, unit, options) {',
        '  return new Date(real(date, unit, options).getTime() + 1);',
        '}',
        '',
      ].join('\n'),
      { withImpl: true },
    );

    const result = runGate(fixture, 'zones.mjs');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('not ok - UTC');
    expect(result.stderr).toContain('endOf(day) stays on the same calendar date');
    expect(result.stderr).toContain('7 of 7 zones failed.');
  });

  it('reports skip and exits non-zero when every zone is skipped', () => {
    // Each child compares the offsets the runtime reports against the offsets
    // the parent computed through Intl, and skips honestly when they disagree,
    // because some platforms ignore a TZ set by the parent process. An entry
    // point that reports an offset no zone has forces that path for all seven.
    const fixture = zonesFixture(
      'zones-all-skipped',
      [
        'Date.prototype.getTimezoneOffset = () => 4242;',
        ...ZONE_IMPORTS.map(
          (name) => `export function ${name}() { throw new Error('unreachable'); }`,
        ),
        '',
      ].join('\n'),
    );

    const result = runGate(fixture, 'zones.mjs');

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('skip - UTC (runtime reported offsets -4242,-4242');
    expect(result.stdout).toContain('skip - Pacific/Chatham');
    expect(result.stdout.match(/ {2}skip - /g)).toHaveLength(7);
    expect(result.stderr).toContain('Every zone was skipped');
    expect(result.stderr).toContain('proved nothing about other zones');
  });
});

describe.skipIf(!isBuilt)('scripts/api-surface.mjs', () => {
  /** api-surface.mjs reads the ESM declarations and the committed snapshot. */
  function apiFixture(name: string): string {
    const fixture = scratch(name);
    mkdirSync(join(fixture, 'scripts'));
    cpSync(join(repo, 'scripts', 'api-surface.mjs'), join(fixture, 'scripts', 'api-surface.mjs'));
    mkdirSync(join(fixture, 'dist'));
    for (const file of ['index.d.ts', 'profiler.d.ts']) {
      cpSync(join(repo, 'dist', file), join(fixture, 'dist', file));
    }
    cpSync(join(repo, 'api-surface.txt'), join(fixture, 'api-surface.txt'));
    return fixture;
  }

  /** Append a declaration the snapshot has never seen. */
  function addExport(fixture: string): void {
    const file = join(fixture, 'dist', 'index.d.ts');
    writeFileSync(
      file,
      `${readFileSync(file, 'utf8')}\ndeclare function nextBusinessDay(date: DateInput, options?: WeekOptions): Date;\nexport { nextBusinessDay };\n`,
    );
  }

  it('passes on the committed snapshot', () => {
    const result = runGate(apiFixture('api-ok'), 'api-surface.mjs');

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(
      /api-surface passed - \d+ entries match api-surface\.txt across timesolver and timesolver\/profiler\./,
    );
  });

  it('fails with a legible diff when the surface gains an export', () => {
    const fixture = apiFixture('api-gained');
    addExport(fixture);

    const result = runGate(fixture, 'api-surface.mjs');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--- api-surface.txt');
    expect(result.stderr).toContain('+++ dist/ (generated)');
    expect(result.stderr).toContain(
      '+timesolver nextBusinessDay  function nextBusinessDay(date: DateInput, options?: WeekOptions): Date',
    );
    expect(result.stderr).toContain(
      'api-surface failed - the public API surface does not match api-surface.txt',
    );
  });

  it('fails with a legible diff when the surface loses an export', () => {
    const fixture = apiFixture('api-lost');
    const file = join(fixture, 'dist', 'profiler.d.ts');
    const dropped = readFileSync(file, 'utf8').replace(', timeLookReport,', ',');
    expect(dropped).not.toContain('timeLookReport,');
    writeFileSync(file, dropped);

    const result = runGate(fixture, 'api-surface.mjs');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      '-timesolver/profiler timeLookReport  function timeLookReport(): ProfileReport',
    );
    expect(result.stderr).toContain(
      'api-surface failed - the public API surface does not match api-surface.txt',
    );
  });

  it('regenerates the snapshot with --update, and then passes', () => {
    const snapshot = join(repo, 'api-surface.txt');
    const committed = readFileSync(snapshot, 'utf8');
    const fixture = apiFixture('api-updated');
    addExport(fixture);

    const updated = runGate(fixture, 'api-surface.mjs', ['--update']);

    expect(updated.status).toBe(0);
    expect(updated.stdout).toContain('api-surface updated -');
    expect(updated.stdout).toContain('Commit it with the change that moved the surface.');
    expect(readFileSync(join(fixture, 'api-surface.txt'), 'utf8')).toContain(
      'timesolver nextBusinessDay',
    );

    const verified = runGate(fixture, 'api-surface.mjs');

    expect(verified.status).toBe(0);
    expect(verified.stdout).toContain('api-surface passed -');

    // The gate under test writes its own snapshot, never this repository's.
    expect(readFileSync(snapshot, 'utf8')).toBe(committed);
  });

  it('fails with a build hint when dist/ is absent', () => {
    const fixture = apiFixture('api-unbuilt');
    rmSync(join(fixture, 'dist'), { recursive: true });

    const result = runGate(fixture, 'api-surface.mjs');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('api-surface failed - dist/ is missing');
    expect(result.stderr).toContain('Run `npm run build`');
  });

  it('rejects an unrecognised argument', () => {
    const result = runGate(apiFixture('api-bad-argument'), 'api-surface.mjs', ['--fix']);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('api-surface: unrecognised argument --fix');
    expect(result.stderr).toContain('Usage: node scripts/api-surface.mjs [--update]');
  });
});
