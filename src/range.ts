import { type DateInput, toDate } from './coerce.js';
import { TimeSolverError } from './errors.js';
import { startOf } from './manipulate.js';
import { normalizeUnit, type UnitInput } from './units.js';
import type { WeekOptions } from './week.js';

/**
 * Which endpoints of a range count as inside it, in interval notation: `[` and
 * `]` include an endpoint, `(` and `)` exclude it.
 *
 * `'[)'` is the shape most date ranges want — a month is 1 January up to but not
 * including 1 February — so back-to-back ranges neither overlap nor leave a gap.
 */
export type Bounds = '[]' | '[)' | '(]' | '()';

// Stryker disable next-line BooleanLiteral: only key presence is read, through
// Object.hasOwn, so the values cannot be observed by any test.
const BOUNDS: Record<Bounds, true> = { '[]': true, '[)': true, '(]': true, '()': true };

const DEFAULT_BOUNDS: Bounds = '[]';

/** Everything {@link isBetween} can be told, in one argument. */
export interface BetweenOptions extends WeekOptions {
  /** Compare at this granularity. Defaults to the exact instant. */
  readonly unit?: UnitInput;
  /** Which endpoints count as inside. Defaults to `'[]'`, both. */
  readonly bounds?: Bounds;
}

/**
 * Whether a date falls between two others.
 *
 * Takes either an options object or the positional arguments below; the object
 * exists because the useful combinations are `bounds` alone and `bounds` with a
 * unit, and reaching `bounds` positionally means writing `undefined` first.
 *
 * @param date - The date to test.
 * @param start - Lower end of the range.
 * @param end - Upper end of the range.
 * @param unit - Compare at this granularity, as {@link equal} does. Defaults to
 *   the exact instant.
 * @param bounds - Which endpoints count as inside. Defaults to `'[]'`, both.
 * @param options - `weekStartsOn`, used when `unit` is `'week'`.
 * @returns `false` when `start` is later than `end`; the range is read as given
 *   rather than silently reordered.
 * @throws {TimeSolverError} `INVALID_DATE`, `INVALID_UNIT`, or
 *   `INVALID_ARGUMENT` for unrecognised bounds.
 *
 * @example
 * isBetween('2024-03-15T12:00', '2024-03-01T00:00', '2024-04-01T00:00');       // true
 * isBetween('2024-04-01T00:00', '2024-03-01T00:00', '2024-04-01T00:00', { bounds: '[)' }); // false
 * isBetween('2024-03-15T12:00', '2024-03-01T00:00', '2024-03-31T00:00', 'month'); // true
 */
export function isBetween(
  date: DateInput,
  start: DateInput,
  end: DateInput,
  options?: BetweenOptions,
): boolean;
export function isBetween(
  date: DateInput,
  start: DateInput,
  end: DateInput,
  unit?: UnitInput,
  bounds?: Bounds,
  options?: WeekOptions,
): boolean;
export function isBetween(
  date: DateInput,
  start: DateInput,
  end: DateInput,
  unit?: UnitInput | BetweenOptions,
  bounds?: Bounds,
  options?: WeekOptions,
): boolean {
  // One `typeof` decides both readings: an object is the grouped form, anything
  // else is a unit name, since `UnitInput` is always a string.
  const grouped = typeof unit === 'object' ? unit : undefined;
  const name = typeof unit === 'object' ? unit.unit : unit;
  const interval = grouped?.bounds ?? bounds ?? DEFAULT_BOUNDS;

  if (!Object.hasOwn(BOUNDS, interval)) {
    throw new TimeSolverError(
      'INVALID_ARGUMENT',
      `bounds must be one of '[]', '[)', '(]' or '()', received ${JSON.stringify(interval)}.`,
    );
  }

  const resolved = normalizeUnit(name);
  const week = grouped ?? options;
  const target = startOf(date, resolved, week).getTime();
  const lower = startOf(start, resolved, week).getTime();
  const upper = startOf(end, resolved, week).getTime();
  const afterLower = interval[0] === '[' ? target >= lower : target > lower;
  const beforeUpper = interval[1] === ']' ? target <= upper : target < upper;

  return afterLower && beforeUpper;
}

/**
 * Earliest of the given dates.
 *
 * @returns A new `Date`; the inputs are untouched.
 * @throws {TimeSolverError} `INVALID_DATE` if any input cannot be read.
 *
 * @example
 * min('2024-03-17T00:00', '2024-01-01T00:00', '2024-12-31T00:00'); // 2024-01-01
 */
export function min(first: DateInput, ...rest: readonly DateInput[]): Date {
  return pick(first, rest, -1);
}

/**
 * Latest of the given dates.
 *
 * @returns A new `Date`; the inputs are untouched.
 * @throws {TimeSolverError} `INVALID_DATE` if any input cannot be read.
 *
 * @example
 * max('2024-03-17T00:00', '2024-01-01T00:00', '2024-12-31T00:00'); // 2024-12-31
 */
export function max(first: DateInput, ...rest: readonly DateInput[]): Date {
  return pick(first, rest, 1);
}

function pick(first: DateInput, rest: readonly DateInput[], direction: 1 | -1): Date {
  let chosen = toDate(first);

  for (const candidate of rest) {
    const date = toDate(candidate);

    // Stryker disable next-line ArithmeticOperator,EqualityOperator: direction is
    // +1 or -1, for which multiply and divide agree, and two equal instants are
    // indistinguishable, so the boundary cannot be observed.
    if ((date.getTime() - chosen.getTime()) * direction > 0) {
      chosen = date;
    }
  }

  return chosen;
}

/**
 * Constrain a date to a range, returning the nearest endpoint when it falls outside.
 *
 * @throws {TimeSolverError} `INVALID_ARGUMENT` when `lower` is later than `upper`,
 *   because there is no sensible answer and silently swapping them would hide a
 *   bug in the caller.
 *
 * @example
 * clamp('2024-06-01T00:00', '2024-01-01T00:00', '2024-03-01T00:00'); // 2024-03-01
 * clamp('2024-02-01T00:00', '2024-01-01T00:00', '2024-03-01T00:00'); // 2024-02-01
 */
export function clamp(date: DateInput, lower: DateInput, upper: DateInput): Date {
  const target = toDate(date);
  const low = toDate(lower);
  const high = toDate(upper);

  if (low.getTime() > high.getTime()) {
    throw new TimeSolverError(
      'INVALID_ARGUMENT',
      `clamp needs lower <= upper, received ${low.toISOString()} and ${high.toISOString()}.`,
    );
  }

  // Stryker disable next-line EqualityOperator: at the boundary both branches
  // return the same instant, so the comparison cannot be observed.
  if (target.getTime() < low.getTime()) {
    return low;
  }

  // Stryker disable next-line EqualityOperator: as above, the boundary returns
  // the same instant either way.
  return target.getTime() > high.getTime() ? high : target;
}
