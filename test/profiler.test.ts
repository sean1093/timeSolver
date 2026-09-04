import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TimeSolverError } from '../src/errors.js';
import type { Profiler } from '../src/profiler.js';
import { createProfiler, timeLook, timeLookReport, timeLookStart } from '../src/profiler.js';

/** Feed `performance.now()` a scripted sequence so timings are deterministic. */
function scriptClock(...stamps: number[]): void {
  const clock = vi.spyOn(performance, 'now');

  for (const stamp of stamps) {
    clock.mockReturnValueOnce(stamp);
  }
}

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

describe('createProfiler', () => {
  it('measures each segment and its share of the run', () => {
    scriptClock(0, 30, 100, 100);
    const profiler = createProfiler();

    profiler.start();
    profiler.mark('load');
    profiler.mark('render');

    const report = profiler.report();

    expect(report.total).toBe(100);
    expect(report.marks).toEqual([
      { label: 'load', ms: 30, share: 0.3 },
      { label: 'render', ms: 70, share: 0.7 },
    ]);
    expect(report.slowest?.label).toBe('render');
  });

  it('keeps timelines isolated, unlike the v1 singleton', () => {
    scriptClock(0, 10, 1000, 1005);
    const outer = createProfiler();
    const inner = createProfiler();

    outer.start();
    outer.mark('outer step');
    inner.start();
    inner.mark('inner step');

    expect(outer.report().marks).toHaveLength(1);
    expect(outer.report().total).toBe(10);
    expect(inner.report().marks).toHaveLength(1);
    expect(inner.report().total).toBe(5);
  });

  it('discards previous marks on restart', () => {
    scriptClock(0, 5, 100, 110);
    const profiler = createProfiler();

    profiler.start();
    profiler.mark('first run');
    profiler.start();
    profiler.mark('second run');

    const report = profiler.report();

    expect(report.marks).toHaveLength(1);
    expect(report.marks[0]?.label).toBe('second run');
    expect(report.total).toBe(10);
  });

  it('reports a run with no marks', () => {
    scriptClock(0);
    const profiler = createProfiler();

    profiler.start();

    const report = profiler.report();

    expect(report).toEqual({ total: 0, slowest: undefined, marks: [] });
  });

  it('gives every mark a zero share when no time passed', () => {
    scriptClock(0, 0);
    const profiler = createProfiler();

    profiler.start();
    profiler.mark('instant');

    expect(profiler.report().marks[0]?.share).toBe(0);
  });

  it('survives destructuring, so the API needs no this binding', () => {
    scriptClock(0, 42);
    const { start, mark, report } = createProfiler();

    start();
    mark('step');

    expect(report().total).toBe(42);
  });

  it.each([
    ['mark', (profiler: Profiler) => profiler.mark('x')],
    ['report', (profiler: Profiler) => profiler.report()],
  ])('requires start() before %s()', (name, call) => {
    const profiler = createProfiler();

    try {
      call(profiler);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as TimeSolverError).code).toBe('INVALID_ARGUMENT');
      expect((error as TimeSolverError).message).toContain(`before ${name}()`);
    }
  });

  it.each([
    ['an empty string', ''],
    ['no label at all', undefined],
    ['a number', 7],
  ])('rejects %s as a mark label', (_description, label) => {
    const profiler = createProfiler();

    profiler.start();

    expect(() => profiler.mark(label as string)).toThrowError(/needs a non-empty label/);
  });
});

describe('print', () => {
  it('writes plain text outside a browser, where %c is not interpreted', () => {
    scriptClock(0, 30, 100, 100);
    const profiler = createProfiler();

    profiler.start();
    profiler.mark('load');
    profiler.mark('render');
    profiler.print();

    expect(logged[0]).toBe('[timeSolver] 2 mark(s) in 100.000 ms');
    expect(logged[1]).toBe('  1. load    30.000 ms  30.0%');
    expect(logged[2]).toBe('  2. render  70.000 ms  70.0%  <- slowest');
    expect(logged.join('\n')).not.toContain('%c');
  });

  it('returns the same report it printed', () => {
    scriptClock(0, 10, 10);
    const profiler = createProfiler();

    profiler.start();
    profiler.mark('step');

    expect(profiler.print()).toEqual(profiler.report());
  });

  it('says so when there is nothing to report', () => {
    scriptClock(0);
    const profiler = createProfiler();

    profiler.start();
    profiler.print();

    expect(logged[1]).toBe('  no marks recorded');
  });

  it('uses console styling when a window object is present', () => {
    vi.stubGlobal('window', {});
    scriptClock(0, 5, 5);
    const profiler = createProfiler();

    profiler.start();
    profiler.mark('step');
    profiler.print();

    expect(logged[0]).toContain('%c[timeSolver]');
    expect(logged[0]).toContain('font-weight: bold');
    expect(logged[1]).toContain('%c');
    vi.unstubAllGlobals();
  });

  it('says so in the browser too when there is nothing to report', () => {
    vi.stubGlobal('window', {});
    scriptClock(0);
    const profiler = createProfiler();

    profiler.start();
    profiler.print();

    expect(logged[1]).toBe('%c  no marks recorded color: #4CAF50');
    vi.unstubAllGlobals();
  });
  it('styles a slowest mark differently from the rest', () => {
    vi.stubGlobal('window', {});
    scriptClock(0, 10, 100, 100);
    const profiler = createProfiler();

    profiler.start();
    profiler.mark('quick');
    profiler.mark('slow');
    profiler.print();

    expect(logged[1]).toContain('color: #2962FF');
    expect(logged[2]).toContain('color: #FF1744');
    vi.unstubAllGlobals();
  });
});

describe('v1 timeLook compatibility', () => {
  it('drives a shared profiler through the v1 function names', () => {
    scriptClock(0, 25, 100, 100, 100);

    timeLookStart();
    timeLook('step one');
    timeLook('step two');

    const report = timeLookReport();

    expect(report.total).toBe(100);
    expect(report.marks.map((mark) => mark.label)).toEqual(['step one', 'step two']);
    expect(logged[0]).toContain('2 mark(s)');
  });

  it('shares one timeline across separate copies of the module', async () => {
    // The published package builds `timesolver` and `timesolver/profiler` as
    // independent bundles, so a caller can hold two copies of this module at
    // once. Resetting the module registry reproduces that: `second` is a fresh
    // instance with its own closures, and it must still see the run `first`
    // started, which is what the docs promise in three places.
    scriptClock(0, 40, 100, 100, 100);

    const first = await import('../src/profiler.js');
    vi.resetModules();
    const second = await import('../src/profiler.js');

    expect(second.timeLook).not.toBe(first.timeLook);

    first.timeLookStart();
    second.timeLook('step one');
    first.timeLook('step two');

    expect(second.timeLookReport().marks.map((mark) => mark.label)).toEqual([
      'step one',
      'step two',
    ]);
  });
});
