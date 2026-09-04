import { type DateInput, toDate } from './coerce.js';
import { TimeSolverError } from './errors.js';
import { MONTHS_PER_UNIT } from './units.js';

// Stryker disable StringLiteral: every string literal below this point is an
// error message or an English calendar name. The names are asserted by
// test/calendar.test.ts through the public helpers; the messages are
// deliberately not, because docs/support.md states message text is not API.

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const ABBREVIATION_LENGTH = 3;

function lookup(
  names: readonly string[],
  index: number,
  expectation: string,
  given: number,
): string {
  const name = names[index];

  if (name === undefined) {
    throw new TimeSolverError('INVALID_ARGUMENT', `${expectation}, received ${given}.`);
  }

  return name;
}

/**
 * English name of a month.
 *
 * @param month - Month number, 1 (January) through 12 (December).
 * @throws {TimeSolverError} `INVALID_ARGUMENT` outside that range.
 */
export function monthName(month: number): string {
  return lookup(MONTH_NAMES, month - 1, 'month must be an integer from 1 to 12', month);
}

/** Three-letter English abbreviation of a month, for example `'Mar'`. */
export function monthAbbreviation(month: number): string {
  return monthName(month).slice(0, ABBREVIATION_LENGTH);
}

/**
 * English name of a weekday.
 *
 * @param weekday - Day index, 0 (Sunday) through 6 (Saturday), as `Date#getDay` returns.
 * @throws {TimeSolverError} `INVALID_ARGUMENT` outside that range.
 */
export function weekdayName(weekday: number): string {
  return lookup(WEEKDAY_NAMES, weekday, 'weekday must be an integer from 0 to 6', weekday);
}

/** Three-letter English abbreviation of a weekday, for example `'Mon'`. */
export function weekdayAbbreviation(weekday: number): string {
  return weekdayName(weekday).slice(0, ABBREVIATION_LENGTH);
}

/**
 * Full weekday name of a date, for example `'Monday'`.
 *
 * v1 sliced `Date#toString()`, whose output depends on the engine's locale.
 * This reads a fixed English table instead.
 */
export function getFullWeek(date: DateInput): string {
  return weekdayName(toDate(date).getDay());
}

/** Abbreviated weekday name of a date, for example `'Mon'`. */
export function getAbbrWeek(date: DateInput): string {
  return weekdayAbbreviation(toDate(date).getDay());
}

/** Full month name of a date, for example `'March'`. */
export function getFullMonth(date: DateInput): string {
  return monthName(toDate(date).getMonth() + 1);
}

/** Abbreviated month name of a date, for example `'Mar'`. */
export function getAbbrMonth(date: DateInput): string {
  return monthAbbreviation(toDate(date).getMonth() + 1);
}

/** Calendar quarter of a date, 1 through 4. */
export function getQuarter(date: DateInput): number {
  return Math.floor(toDate(date).getMonth() / MONTHS_PER_UNIT.quarter) + 1;
}

/**
 * Quarter containing a month number.
 *
 * @param month - Month number, 1 through 12.
 * @returns The quarter, or `null` when `month` is not an integer in range.
 *   Returning `null` rather than throwing preserves v1 behaviour.
 */
export function getQuarterByMonth(month: number): number | null {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return Math.floor((month - 1) / MONTHS_PER_UNIT.quarter) + 1;
}

/**
 * First month of a quarter.
 *
 * @param quarter - Quarter number, 1 through 4.
 * @returns The month number, or `null` when `quarter` is not an integer in range.
 */
export function getFirstMonthByQuarter(quarter: number): number | null {
  if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
    return null;
  }

  return (quarter - 1) * MONTHS_PER_UNIT.quarter + 1;
}

/**
 * Whether a proleptic Gregorian year is a leap year.
 *
 * @param year - A full year number, for example `2024`.
 * @throws {TimeSolverError} `INVALID_ARGUMENT` when `year` is not an integer.
 */
export function isLeapYear(year: number): boolean {
  if (!Number.isInteger(year)) {
    throw new TimeSolverError('INVALID_ARGUMENT', `year must be an integer, received ${year}.`);
  }

  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Stryker disable next-line BooleanLiteral: only key presence is read, through
// Object.hasOwn, so the values cannot be observed by any test.
/** Months with 30 days. */
const SHORT_MONTHS: Record<number, true> = { 4: true, 6: true, 9: true, 11: true };

const FEBRUARY = 2;

/**
 * Number of days in a month.
 *
 * Arithmetic, not a `Date` probe: the length of a month is a calendar fact, so
 * it is the same answer for a year outside the range a `Date` can represent.
 * The probe this replaced returned `NaN` there, and `add` clamped with it, so a
 * shift into the last month of the range produced an Invalid Date by a longer
 * route.
 *
 * @param year - A full year number.
 * @param month - Month number, 1 through 12.
 * @throws {TimeSolverError} `INVALID_ARGUMENT` for a non-integer year or an
 *   out-of-range month.
 */
export function daysInMonth(year: number, month: number): number {
  if (!Number.isInteger(year)) {
    throw new TimeSolverError('INVALID_ARGUMENT', `year must be an integer, received ${year}.`);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new TimeSolverError(
      'INVALID_ARGUMENT',
      `month must be an integer from 1 to 12, received ${month}.`,
    );
  }

  if (month === FEBRUARY) {
    return isLeapYear(year) ? 29 : 28;
  }

  return Object.hasOwn(SHORT_MONTHS, month) ? 30 : 31;
}
