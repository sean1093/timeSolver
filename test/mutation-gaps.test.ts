import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { between } from '../src/compare.js';
import { TimeSolverError } from '../src/errors.js';
import { getString } from '../src/format.js';
import { createProfiler } from '../src/profiler.js';

/**
 * Assertions added because mutation testing showed a surviving mutant: the code
 * could be changed in a way no existing test noticed. Each block names the
 * mutation it kills, so a future reader can tell why an oddly specific
 * assertion exists.
 */

describe('day differences use every clock field', () => {
  // Killed mutants: `msIntoLocalDay` computing minutes, seconds or milliseconds
  // with the wrong operator. Every earlier test used whole hours, so replacing
  // `getMinutes() * 60000` with `getMinutes() / 60000` changed nothing they saw.
  it('counts minutes in the fraction of a day', () => {
    const from = new Date(2024, 5, 15, 0, 0, 0, 0);
    const to = new Date(2024, 5, 15, 0, 30, 0, 0);

    expect(between(from, to, 'day')).toBeCloseTo(30 / 1440, 12);
  });

  it('counts seconds in the fraction of a day', () => {
    const from = new Date(2024, 5, 15, 0, 0, 0, 0);
    const to = new Date(2024, 5, 15, 0, 0, 30, 0);

    expect(between(from, to, 'day')).toBeCloseTo(30 / 86_400, 12);
  });

  it('counts milliseconds in the fraction of a day', () => {
    const from = new Date(2024, 5, 15, 0, 0, 0, 0);
    const to = new Date(2024, 5, 15, 0, 0, 0, 500);

    expect(between(from, to, 'day')).toBeCloseTo(0.5 / 86_400, 15);
  });

  it('combines every field', () => {
    const from = new Date(2024, 5, 15, 1, 2, 3, 4);
    const to = new Date(2024, 5, 16, 5, 6, 7, 8);
    const expected = 1 + (4 * 3_600_000 + 4 * 60_000 + 4 * 1000 + 4) / 86_400_000;

    expect(between(from, to, 'day')).toBeCloseTo(expected, 12);
  });
});

describe('month differences interpolate in both directions', () => {
  // Killed mutants: the `endTime < anchorTime` branch of `monthsBetween`, and
  // the arithmetic inside it. Earlier tests covered a forward fraction and a
  // whole negative span, but never a target that falls short of its anchor.
  it('interpolates backwards from the anchor', () => {
    // 31 January plus one month clamps to 29 February, so a target of
    // 15 February falls short of that anchor and the remainder is negative.
    const result = between(new Date(2024, 0, 31), new Date(2024, 1, 15), 'month');

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
    expect(result).toBeCloseTo(0.5172413793103448, 12);
  });

  it('interpolates backwards across a year boundary', () => {
    const result = between(new Date(2023, 11, 31), new Date(2024, 0, 20), 'month');

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });

  it('stays antisymmetric on a backwards interpolation', () => {
    const from = new Date(2024, 0, 31);
    const to = new Date(2024, 1, 15);

    expect(between(from, to, 'month')).toBeCloseTo(-between(to, from, 'month'), 12);
  });

  it('lands exactly on a whole month when the target is the anchor', () => {
    expect(between(new Date(2024, 0, 31), new Date(2024, 1, 29), 'month')).toBe(1);
  });
});

describe('formats ending in a literal', () => {
  // Killed mutant: the trailing-literal branch of `tokenize` returning the
  // whole format instead of the remainder. Every earlier format ended in a
  // token, so that branch never ran with anything to append.
  const sample = new Date(2024, 2, 17, 14, 30, 45, 123);

  it('appends a trailing separator', () => {
    expect(getString(sample, 'DD/MM/')).toBe('17/03/');
    expect(getString(sample, 'YYYY-')).toBe('2024-');
    expect(getString(sample, 'HH:mm:ss - ')).toBe('14:30:45 - ');
  });

  it('appends a trailing literal after an escape', () => {
    expect(getString(sample, '[at] HH:mm!')).toBe('at 14:30!');
  });
});

describe('error messages carry the library prefix', () => {
  // Killed mutant: emptying the `[timeSolver]` prefix in the error constructor.
  it('prefixes every code', () => {
    const cases: Array<() => unknown> = [
      () => getString('nonsense', 'YYYY'),
      () => getString(new Date(), '###'),
      () => between(new Date(), new Date(), 'fortnight'),
    ];

    for (const run of cases) {
      try {
        run();
        expect.unreachable('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TimeSolverError);
        expect((error as TimeSolverError).message.startsWith('[timeSolver] ')).toBe(true);
        expect((error as TimeSolverError).message.length).toBeGreaterThan('[timeSolver] '.length);
      }
    }
  });
});

describe('profiler report details', () => {
  let logged: string[];

  beforeEach(() => {
    logged = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logged.push(args.map(String).join(' '));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function scriptClock(...stamps: number[]): void {
    const clock = vi.spyOn(performance, 'now');

    for (const stamp of stamps) {
      clock.mockReturnValueOnce(stamp);
    }
  }

  // Killed mutant: replacing the `slowest === undefined` short-circuit with
  // `true`, which makes the *last* mark always win. Earlier tests happened to
  // have the slowest mark last.
  it('finds the slowest mark when it is first', () => {
    scriptClock(0, 100, 110, 120);
    const profiler = createProfiler();

    profiler.start();
    profiler.mark('slow');
    profiler.mark('quick');
    profiler.mark('quicker');

    expect(profiler.report().slowest?.label).toBe('slow');
  });

  it('finds the slowest mark when it is in the middle', () => {
    scriptClock(0, 10, 200, 210);
    const profiler = createProfiler();

    profiler.start();
    profiler.mark('first');
    profiler.mark('slow');
    profiler.mark('last');

    expect(profiler.report().slowest?.label).toBe('slow');
  });

  // Killed mutant: `candidate.ms > slowest.ms` weakened to `>=`, which would
  // report the later of two equal marks.
  it('keeps the first of two equally slow marks', () => {
    scriptClock(0, 50, 100);
    const profiler = createProfiler();

    profiler.start();
    profiler.mark('first');
    profiler.mark('second');

    const report = profiler.report();

    expect(report.marks.map((mark) => mark.ms)).toEqual([50, 50]);
    expect(report.slowest?.label).toBe('first');
  });

  // Killed mutant: the `marks.length === 0` branch always taken, which would
  // print "no marks recorded" under a populated report.
  it('does not claim there are no marks when there are', () => {
    scriptClock(0, 30, 100, 100);
    const profiler = createProfiler();

    profiler.start();
    profiler.mark('load');
    profiler.mark('render');
    profiler.print();

    expect(logged.join('\n')).not.toContain('no marks recorded');
    expect(logged).toHaveLength(3);
  });
});
