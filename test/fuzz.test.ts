import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { TimeSolverError } from '../src/errors.js';
import { getString } from '../src/format.js';
import { isValid, parse } from '../src/parse.js';

/**
 * The format grammar is the only part of this library that takes an arbitrary
 * string from a caller and builds something executable out of it: `getString`
 * walks it, and `parse` compiles it into a regular expression. Two things must
 * hold for every string a caller could pass, not just the documented ones.
 *
 * **Only declared failures.** A malformed format is a programmer error and
 * throws `TimeSolverError`. Nothing else may escape -- no `TypeError` from an
 * unbalanced bracket, no `RangeError` from a long literal, no `SyntaxError` from
 * a pattern that was pasted into a regular expression without escaping.
 *
 * **Bounded work.** A regular expression built from caller input is where
 * catastrophic backtracking lives. The generated patterns use bounded digit runs
 * and fixed alternations with nothing nested, so cost stays close to linear in
 * the format length; these tests fail if that ever stops being true, because a
 * format arriving from a config file or a URL should not be able to hang a
 * process.
 */

/** Every token the grammar knows, so generated formats look like real ones. */
const TOKEN_NAMES = [
  'YYYY',
  'YY',
  'MMMM',
  'MMM',
  'MM',
  'M',
  'DD',
  'D',
  'dddd',
  'ddd',
  'HH',
  'H',
  'hh',
  'h',
  'mm',
  'm',
  'ss',
  's',
  'SSS',
  'A',
  'a',
  'Q',
  'ZZ',
  'Z',
];

/** Characters chosen to provoke: escapes, regex metacharacters, separators. */
const LITERAL_CHARS = [...'[]-/.:,() \t\\^$*+?|{}#%@!"\'<>=~`&;'];

const formatPiece = fc.oneof(
  { arbitrary: fc.constantFrom(...TOKEN_NAMES), weight: 3 },
  { arbitrary: fc.constantFrom(...LITERAL_CHARS), weight: 2 },
  { arbitrary: fc.string({ maxLength: 6 }), weight: 1 },
  { arbitrary: fc.string({ unit: 'binary', maxLength: 4 }), weight: 1 },
);

/** Formats assembled from grammar-shaped pieces. */
const shapedFormat = fc.array(formatPiece, { maxLength: 24 }).map((parts) => parts.join(''));

/** Any string at all, including lone surrogates and control characters. */
const anyFormat = fc.oneof(
  { arbitrary: shapedFormat, weight: 4 },
  { arbitrary: fc.string({ maxLength: 40 }), weight: 1 },
  { arbitrary: fc.string({ unit: 'binary', maxLength: 40 }), weight: 1 },
);

const anyInput = fc.oneof(
  { arbitrary: fc.string({ maxLength: 40 }), weight: 3 },
  { arbitrary: fc.string({ unit: 'binary', maxLength: 40 }), weight: 1 },
  {
    arbitrary: fc
      .array(fc.constantFrom(...'0123456789-/.: TZ+'), { maxLength: 30 })
      .map((c) => c.join('')),
    weight: 3,
  },
);

const anyDate = fc
  .integer({ min: Date.UTC(1900, 0, 1), max: Date.UTC(2100, 0, 1) })
  .map((ms) => new Date(ms));

/** Runs `body`, returning either its value or the escaping error. */
function outcome<T>(body: () => T): { value: T } | { error: unknown } {
  try {
    return { value: body() };
  } catch (error) {
    return { error };
  }
}

function expectOnlyTimeSolverError(result: { error: unknown }, codes: string[]) {
  expect(result.error, `threw a non-library error: ${String(result.error)}`).toBeInstanceOf(
    TimeSolverError,
  );
  expect(codes).toContain((result.error as TimeSolverError).code);
}

describe('getString against arbitrary formats', () => {
  it('returns a string or throws INVALID_FORMAT, and nothing else', () => {
    fc.assert(
      fc.property(anyDate, anyFormat, (date, format) => {
        const result = outcome(() => getString(date, format));

        if ('error' in result) {
          expectOnlyTimeSolverError(result, ['INVALID_FORMAT']);
          return;
        }

        expect(typeof result.value).toBe('string');
      }),
      { numRuns: 600 },
    );
  });

  it('renders literal text through unchanged, whatever is in it', () => {
    fc.assert(
      fc.property(anyDate, fc.string({ unit: 'grapheme', maxLength: 30 }), (date, text) => {
        // Square brackets are the escape delimiters, so they cannot appear
        // inside an escape; everything else must survive verbatim.
        const literal = text.replace(/[[\]]/g, '');

        expect(getString(date, `[${literal}]`)).toBe(literal);
        expect(getString(date, `[${literal}]YYYY`)).toBe(`${literal}${getString(date, 'YYYY')}`);
      }),
      { numRuns: 300 },
    );
  });

  it('grows no faster than the format it was given', () => {
    fc.assert(
      fc.property(anyDate, shapedFormat, (date, format) => {
        const result = outcome(() => getString(date, format));

        if ('error' in result) {
          return;
        }

        // The widest token renders 4 characters from 1 (`Q` is 1 character, and
        // `MMMM` renders up to 9 from 4), so 10x the format length plus a
        // constant is a generous ceiling that still catches a runaway.
        expect(result.value.length).toBeLessThanOrEqual(format.length * 10 + 16);
      }),
      { numRuns: 400 },
    );
  });
});

describe('parse and isValid against arbitrary formats and inputs', () => {
  it('isValid returns a boolean or throws INVALID_FORMAT, and nothing else', () => {
    fc.assert(
      fc.property(anyInput, anyFormat, (input, format) => {
        const result = outcome(() => isValid(input, format));

        if ('error' in result) {
          expectOnlyTimeSolverError(result, ['INVALID_FORMAT']);
          return;
        }

        expect(typeof result.value).toBe('boolean');
      }),
      { numRuns: 600 },
    );
  });

  it('parse returns a real Date or throws a declared code, and nothing else', () => {
    fc.assert(
      fc.property(anyInput, anyFormat, (input, format) => {
        const result = outcome(() => parse(input, format));

        if ('error' in result) {
          expectOnlyTimeSolverError(result, ['INVALID_FORMAT', 'INVALID_DATE']);
          return;
        }

        // A returned Date is never the Invalid Date; that is the whole point of
        // throwing instead.
        expect(result.value).toBeInstanceOf(Date);
        expect(Number.isNaN(result.value.getTime())).toBe(false);
      }),
      { numRuns: 600 },
    );
  });

  it('agrees with itself: isValid is true exactly when parse succeeds', () => {
    fc.assert(
      fc.property(anyInput, anyFormat, (input, format) => {
        const valid = outcome(() => isValid(input, format));
        const parsed = outcome(() => parse(input, format));

        if ('error' in valid) {
          // A malformed format fails both, with the same code.
          expect('error' in parsed).toBe(true);
          return;
        }

        expect(valid.value).toBe(!('error' in parsed));
      }),
      { numRuns: 600 },
    );
  });
});

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const built = join(repo, 'dist', 'index.js');

/**
 * Catastrophic backtracking cannot be caught in process. A regular expression
 * runs synchronously, so it never reaches an await point and no test timeout can
 * interrupt it -- a runaway pattern hangs the whole suite instead of failing it.
 * Measured, not assumed: introducing one nested quantifier into the generated
 * matcher made this file run for ten minutes without reporting anything.
 *
 * So the pathological cases run in a child process with a hard wall-clock limit,
 * where a hang is a killed process and therefore a failure with a message. That
 * needs the build, so this suite skips on a clean checkout the same way the gate
 * script tests do.
 */
describe.skipIf(!existsSync(built))('pathological formats stay bounded', () => {
  /**
   * Generous: sized to catch a change in complexity class on a shared CI runner,
   * not to measure throughput. The real numbers are milliseconds.
   */
  const LIMIT_MS = 20_000;

  function probe(body: string): { stdout: string; stderr: string; status: number | null } {
    const source = `const { getString, isValid } = await import(${JSON.stringify(built)});\n${body}`;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
      encoding: 'utf8',
      timeout: LIMIT_MS,
      killSignal: 'SIGKILL',
    });

    // A killed child reports no status, which is exactly the runaway case.
    expect(
      result.status,
      `probe did not finish within ${LIMIT_MS}ms, which means it backtracked: ${result.stderr}`,
    ).toBe(0);

    return { stdout: result.stdout, stderr: result.stderr, status: result.status };
  }

  const SHAPES = [
    ['nested escapes', "'['.repeat(n) + ']'.repeat(n)"],
    ['escape runs', "'[a]'.repeat(n)"],
    ['one long literal', "'[' + 'x'.repeat(n) + ']'"],
    ['token runs', "'YYYY'.repeat(n)"],
    ['unterminated escape', "'[' + 'x'.repeat(n)"],
    ['separator runs', "'YYYY' + '.'.repeat(n) + 'MM'"],
    ['every token', "'YYYYMMDDHHmmssSSS'.repeat(n)"],
    ['empty escapes', "'[]'.repeat(n)"],
    ['reversed brackets', "']['.repeat(n)"],
    ['name tokens', "'MMMMdddd'.repeat(n)"],
    ['regex metacharacters', "'YYYY' + '(.*)+$'.repeat(n)"],
  ] as const;

  it.each(SHAPES)('formats and validates a %s format', (_label, expression) => {
    const result = probe(`
      const date = new Date(2024, 2, 17, 14, 30, 45, 123);
      const build = (n) => ${expression};

      for (const n of [1, 10, 100, 1000, 4000]) {
        const format = build(n);
        let rendered = null;

        try {
          rendered = getString(date, format);
        } catch (error) {
          if (error.code !== 'INVALID_FORMAT') throw error;
        }

        try {
          // Validate against the format's own output where there is one, so the
          // match runs deep instead of failing on the first character.
          isValid(rendered ?? 'x'.repeat(n), format);
        } catch (error) {
          if (error.code !== 'INVALID_FORMAT') throw error;
        }
      }

      console.log('done');
    `);

    expect(result.stdout.trim()).toBe('done');
  });

  it('does not blow up on a long input against a short format', () => {
    const result = probe(`
      for (const n of [1e3, 1e5, 1e6, 1e7]) {
        if (isValid('2'.repeat(n), 'YYYY-MM-DD') !== false) throw new Error('matched at ' + n);
      }

      console.log('done');
    `);

    expect(result.stdout.trim()).toBe('done');
  });

  it('stays near-linear as a name-token format grows', () => {
    // MMMM and dddd compile to alternations of month and weekday names, the
    // widest patterns the grammar builds. Nested quantifiers over overlapping
    // alternations are what make a regular expression explode, so this is the
    // shape to watch, and the ratio is what tells a slow machine from a
    // different complexity class.
    const result = probe(`
      const measure = (n) => {
        const format = 'MMMM '.repeat(n).trimEnd();
        const input = 'January '.repeat(n).trimEnd();
        const started = performance.now();

        for (let run = 0; run < 5; run += 1) isValid(input, format);

        return performance.now() - started;
      };

      measure(20);
      const small = Math.max(measure(40), 0.5);
      const large = measure(320);
      const ratio = large / small;

      console.log(JSON.stringify({ small, large, ratio }));

      // Eight times the work. Anything under 64x is not exponential.
      if (!(ratio < 64)) throw new Error('ratio ' + ratio.toFixed(1) + ' suggests backtracking');
    `);

    const { ratio } = JSON.parse(result.stdout.trim());

    expect(ratio).toBeLessThan(64);
  });
});
