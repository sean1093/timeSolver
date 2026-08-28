import { TimeSolverError } from './errors.js';

/** One measured segment of a profiling run. */
export interface ProfileMark {
  readonly label: string;
  /** Milliseconds since the previous mark, or since `start()` for the first. */
  readonly ms: number;
  /** Fraction of the run this segment took, 0 to 1. */
  readonly share: number;
}

/** Result of a profiling run. */
export interface ProfileReport {
  /** Milliseconds from `start()` to the last mark. */
  readonly total: number;
  /** The longest segment, or `undefined` when nothing was marked. */
  readonly slowest: ProfileMark | undefined;
  readonly marks: readonly ProfileMark[];
}

/** An isolated profiling timeline. */
export interface Profiler {
  /** Begin a run, discarding any previous marks. */
  start(): void;
  /** Close the current segment and label it. */
  mark(label: string): void;
  /** Build the report without printing it. */
  report(): ProfileReport;
  /** Print the report and return it. */
  print(): ProfileReport;
}

const PERCENT = 100;
const MS_DECIMALS = 3;
const SHARE_DECIMALS = 1;

const STYLES = {
  title: 'font-weight: bold; color: #3F51B5',
  mark: 'color: #2962FF',
  slowest: 'color: #FF1744',
  total: 'color: #4CAF50',
} as const;

/**
 * Create an isolated profiler.
 *
 * Each profiler owns its own timeline, so nested or concurrent measurements do
 * not interfere — v1 kept a single array on the exported singleton. Timing uses
 * `performance.now()`, a monotonic clock, rather than `new Date()`, which moves
 * when the system clock is adjusted.
 *
 * @example
 * const profiler = createProfiler();
 * profiler.start();
 * loadRows();
 * profiler.mark('load');
 * render();
 * profiler.mark('render');
 * profiler.print();
 */
export function createProfiler(): Profiler {
  // Stryker disable next-line ArrayDeclaration: start() clears this before any
  // read, so its initial contents cannot be observed.
  const segments: Array<{ label: string; ms: number }> = [];
  let origin: number | undefined;
  let previous = 0;

  function start(): void {
    origin = performance.now();
    previous = origin;
    segments.length = 0;
  }

  function mark(label: string): void {
    if (typeof label !== 'string' || label.length === 0) {
      // Stryker disable next-line StringLiteral: not API; see docs/support.md
      throw new TimeSolverError('INVALID_ARGUMENT', 'A profiler mark needs a non-empty label.');
    }
    if (origin === undefined) {
      throw new TimeSolverError('INVALID_ARGUMENT', 'Call start() before mark().');
    }

    const stamp = performance.now();

    segments.push({ label, ms: stamp - previous });
    previous = stamp;
  }

  function report(): ProfileReport {
    if (origin === undefined) {
      throw new TimeSolverError('INVALID_ARGUMENT', 'Call start() before report().');
    }

    const total = previous - origin;
    const marks: ProfileMark[] = segments.map((segment) => ({
      label: segment.label,
      ms: segment.ms,
      share: total === 0 ? 0 : segment.ms / total,
    }));

    let slowest: ProfileMark | undefined;

    for (const candidate of marks) {
      if (slowest === undefined || candidate.ms > slowest.ms) {
        slowest = candidate;
      }
    }

    return { total, slowest, marks };
  }

  function print(): ProfileReport {
    const result = report();
    // v1 always passed `%c` CSS directives, which Node prints literally.
    const styled = typeof window !== 'undefined';
    const width = result.marks.reduce((longest, entry) => Math.max(longest, entry.label.length), 0);
    const heading = `[timeSolver] ${result.marks.length} mark(s) in ${result.total.toFixed(MS_DECIMALS)} ms`;

    if (styled) {
      console.log(`%c${heading}`, STYLES.title);
    } else {
      console.log(heading);
    }

    for (const [index, entry] of result.marks.entries()) {
      const isSlowest = entry === result.slowest;
      const line = `  ${index + 1}. ${entry.label.padEnd(width)}  ${entry.ms.toFixed(MS_DECIMALS)} ms  ${(entry.share * PERCENT).toFixed(SHARE_DECIMALS)}%${isSlowest ? '  <- slowest' : ''}`;

      if (styled) {
        console.log(`%c${line}`, isSlowest ? STYLES.slowest : STYLES.mark);
      } else {
        console.log(line);
      }
    }

    if (result.marks.length === 0) {
      const note = '  no marks recorded';

      if (styled) {
        console.log(`%c${note}`, STYLES.total);
      } else {
        console.log(note);
      }
    }

    return result;
  }

  return { start, mark, report, print };
}

const SHARED = createProfiler();

/** v1 compatibility: begin a run on the shared profiler. */
export function timeLookStart(): void {
  SHARED.start();
}

/** v1 compatibility: mark a checkpoint on the shared profiler. */
export function timeLook(label: string): void {
  SHARED.mark(label);
}

/**
 * v1 compatibility: print the shared profiler's report.
 *
 * Returns the report as well, which v1 did not.
 */
export function timeLookReport(): ProfileReport {
  return SHARED.print();
}
