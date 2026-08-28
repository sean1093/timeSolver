import { daysInMonth } from './calendar.js';
import { type DateInput, toDate } from './coerce.js';
import { TimeSolverError } from './errors.js';
import {
  isExactUnit,
  MONTHS_PER_UNIT,
  MS_PER_EXACT_UNIT,
  normalizeUnit,
  type Unit,
  type UnitInput,
} from './units.js';
import {
  DAYS_PER_WEEK,
  daysSinceWeekStart,
  resolveWeekStart,
  type WeekDay,
  type WeekOptions,
} from './week.js';

/**
 * Shift a date by whole calendar months, clamping to the end of the target
 * month. Native `setMonth` overflows instead: v1's `add(Jan 31, 1, 'M')`
 * returned March 2.
 */
function shiftMonths(date: Date, months: number): Date {
  const day = date.getDate();
  const shifted = new Date(date.getTime());

  shifted.setDate(1);
  shifted.setFullYear(shifted.getFullYear(), shifted.getMonth() + months, 1);

  if (Number.isNaN(shifted.getTime())) {
    return shifted;
  }

  shifted.setDate(Math.min(day, daysInMonth(shifted.getFullYear(), shifted.getMonth() + 1)));

  return shifted;
}

/**
 * A shift can leave the range `Date` can represent, roughly 100 million days
 * either side of the epoch. Returning that Invalid Date would defer the failure
 * to whatever touched it next, which is exactly the v1 behaviour this library
 * exists to avoid.
 */
function requireRepresentable(result: Date, amount: number, unit: Unit): Date {
  if (Number.isNaN(result.getTime())) {
    throw new TimeSolverError(
      'INVALID_ARGUMENT',
      `Shifting by ${amount} ${unit}(s) leaves the range a Date can represent.`,
    );
  }

  return result;
}

function requireWholeAmount(amount: number, unit: Unit): void {
  if (!Number.isInteger(amount)) {
    throw new TimeSolverError(
      'INVALID_ARGUMENT',
      `A ${unit} amount must be a whole number, received ${amount}. Fractional ${unit}s have no fixed length; use hours or days instead.`,
    );
  }
}

/**
 * Add time to a date and return a new `Date`.
 *
 * The input is never modified — v1 mutated the caller's `Date` in place.
 *
 * Millisecond through hour are exact multiples of their length, so fractional
 * amounts are allowed. Day and week follow the local calendar, keeping the
 * wall-clock time across a daylight-saving change. Month, quarter and year are
 * calendar operations that clamp to the last valid day of the target month.
 *
 * @param date - The starting date.
 * @param amount - How much to add. Defaults to `0`. Negative values subtract.
 * @param unit - Any unit alias. Defaults to `'millisecond'`, as in v1.
 * @throws {TimeSolverError} `INVALID_DATE`, `INVALID_UNIT`, or
 *   `INVALID_ARGUMENT` for a non-finite amount, or a fractional amount of a
 *   calendar unit.
 *
 * @example
 * add('2024-01-31', 1, 'MONTH'); // 2024-02-29, not 2024-03-02
 */
export function add(date: DateInput, amount = 0, unit?: UnitInput): Date {
  const resolved = normalizeUnit(unit);
  const target = toDate(date);

  if (!Number.isFinite(amount)) {
    throw new TimeSolverError(
      'INVALID_ARGUMENT',
      `amount must be a finite number, received ${amount}.`,
    );
  }

  if (isExactUnit(resolved)) {
    return requireRepresentable(
      new Date(target.getTime() + amount * MS_PER_EXACT_UNIT[resolved]),
      amount,
      resolved,
    );
  }

  requireWholeAmount(amount, resolved);

  if (resolved === 'day' || resolved === 'week') {
    target.setDate(target.getDate() + amount * (resolved === 'week' ? DAYS_PER_WEEK : 1));
    return requireRepresentable(target, amount, resolved);
  }

  return requireRepresentable(
    shiftMonths(target, amount * MONTHS_PER_UNIT[resolved]),
    amount,
    resolved,
  );
}

/**
 * Subtract time from a date and return a new `Date`.
 *
 * Equivalent to {@link add} with a negated amount; see it for unit semantics.
 */
export function subtract(date: DateInput, amount = 0, unit?: UnitInput): Date {
  return add(date, -amount, unit);
}

/** Truncations, one per unit, applied to a copy of the input date. */
const TRUNCATE: Record<Unit, (date: Date, weekStartsOn: WeekDay) => void> = {
  millisecond: () => {
    // Already the finest granularity a `Date` can express.
  },
  second: (date) => date.setMilliseconds(0),
  minute: (date) => date.setSeconds(0, 0),
  hour: (date) => date.setMinutes(0, 0, 0),
  day: (date) => date.setHours(0, 0, 0, 0),
  week: (date, weekStartsOn) => {
    date.setDate(date.getDate() - daysSinceWeekStart(date, weekStartsOn));
    date.setHours(0, 0, 0, 0);
  },
  month: (date) => {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
  },
  quarter: (date) => {
    date.setMonth(
      Math.floor(date.getMonth() / MONTHS_PER_UNIT.quarter) * MONTHS_PER_UNIT.quarter,
      1,
    );
    date.setHours(0, 0, 0, 0);
  },
  year: (date) => {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  },
};

/**
 * Start of the local calendar unit containing a date.
 *
 * @param options - `weekStartsOn` moves the week boundary; it defaults to `0`
 *   (Sunday), matching `Date#getDay`, and is ignored by every other unit.
 *
 * @example
 * startOf('2024-03-17T14:30:45.123', 'day');                    // 2024-03-17T00:00:00.000
 * startOf('2024-03-13', 'week');                                // Sunday 2024-03-10
 * startOf('2024-03-13', 'week', { weekStartsOn: 1 });           // Monday 2024-03-11
 */
export function startOf(date: DateInput, unit: UnitInput, options?: WeekOptions): Date {
  const target = toDate(date);

  TRUNCATE[normalizeUnit(unit)](target, resolveWeekStart(options));

  return target;
}

/**
 * Last representable millisecond of the local calendar unit containing a date.
 *
 * @param options - See {@link startOf}.
 *
 * @example
 * endOf('2024-02-10', 'month');                       // 2024-02-29T23:59:59.999
 * endOf('2024-03-13', 'week', { weekStartsOn: 1 });   // Sunday 2024-03-17T23:59:59.999
 */
export function endOf(date: DateInput, unit: UnitInput, options?: WeekOptions): Date {
  const resolved = normalizeUnit(unit);
  // Truncate again after the shift. In a zone whose clocks jump at midnight,
  // startOf('day') is 01:00, so start plus one day is 01:00 the next day and
  // subtracting a millisecond would land on the wrong calendar date.
  const nextStart = startOf(add(startOf(date, resolved, options), 1, resolved), resolved, options);

  return new Date(nextStart.getTime() - 1);
}
