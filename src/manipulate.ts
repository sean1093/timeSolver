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

const DAYS_PER_WEEK = 7;

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
  shifted.setDate(Math.min(day, daysInMonth(shifted.getFullYear(), shifted.getMonth() + 1)));

  return shifted;
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
    return new Date(target.getTime() + amount * MS_PER_EXACT_UNIT[resolved]);
  }

  requireWholeAmount(amount, resolved);

  if (resolved === 'day' || resolved === 'week') {
    target.setDate(target.getDate() + amount * (resolved === 'week' ? DAYS_PER_WEEK : 1));
    return target;
  }

  return shiftMonths(target, amount * MONTHS_PER_UNIT[resolved]);
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
const TRUNCATE: Record<Unit, (date: Date) => void> = {
  millisecond: () => {
    // Already the finest granularity a `Date` can express.
  },
  second: (date) => date.setMilliseconds(0),
  minute: (date) => date.setSeconds(0, 0),
  hour: (date) => date.setMinutes(0, 0, 0),
  day: (date) => date.setHours(0, 0, 0, 0),
  week: (date) => {
    date.setDate(date.getDate() - date.getDay());
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
 * Weeks start on Sunday, matching `Date#getDay`.
 *
 * @example
 * startOf('2024-03-17T14:30:45.123', 'day'); // 2024-03-17T00:00:00.000
 */
export function startOf(date: DateInput, unit: UnitInput): Date {
  const target = toDate(date);

  TRUNCATE[normalizeUnit(unit)](target);

  return target;
}

/**
 * Last representable millisecond of the local calendar unit containing a date.
 *
 * @example
 * endOf('2024-02-10', 'month'); // 2024-02-29T23:59:59.999
 */
export function endOf(date: DateInput, unit: UnitInput): Date {
  const resolved = normalizeUnit(unit);

  return new Date(add(startOf(date, resolved), 1, resolved).getTime() - 1);
}
