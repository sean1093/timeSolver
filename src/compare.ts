import { type DateInput, toDate } from './coerce.js';
import { add, startOf } from './manipulate.js';
import {
  MONTHS_PER_UNIT,
  MS_PER_DAY,
  MS_PER_EXACT_UNIT,
  normalizeUnit,
  type Unit,
  type UnitInput,
} from './units.js';

import { DAYS_PER_WEEK, type WeekOptions } from './week.js';

/** Wall-clock milliseconds elapsed since local midnight, ignoring any DST shift. */
function msIntoLocalDay(date: Date): number {
  return (
    date.getHours() * MS_PER_EXACT_UNIT.hour +
    date.getMinutes() * MS_PER_EXACT_UNIT.minute +
    date.getSeconds() * MS_PER_EXACT_UNIT.second +
    date.getMilliseconds()
  );
}

/**
 * Calendar days between two dates, with the fractional part taken from the
 * difference in wall-clock time of day.
 *
 * Both halves are deliberately offset-independent. Counting whole days between
 * local midnights survives a daylight-saving change, and reading the remainder
 * from the clock fields rather than from elapsed milliseconds keeps the same
 * local time on adjacent dates exactly one day apart, instead of 0.958 across
 * a spring transition and 1.042 across an autumn one.
 */
function daysBetween(from: Date, to: Date): number {
  const wholeDays = Math.round(
    (startOf(to, 'day').getTime() - startOf(from, 'day').getTime()) / MS_PER_DAY,
  );

  return wholeDays + (msIntoLocalDay(to) - msIntoLocalDay(from)) / MS_PER_DAY;
}

/**
 * Calendar months between two dates, with the fractional part scaled by the
 * length of the month the remainder falls in. January 1 to February 1 is
 * exactly 1, where v1's average-month constant reported 1.0184804928131417.
 *
 * Month arithmetic clamps, so it is not invertible: January 31 plus one month
 * is February 29, but February 29 minus one month is January 29. Measuring
 * always in the forward direction and negating preserves the guarantee callers
 * rely on, that `between(a, b)` equals `-between(b, a)`.
 */
function monthsBetween(from: Date, to: Date): number {
  const reversed = to.getTime() < from.getTime();
  const start = reversed ? to : from;
  const end = reversed ? from : to;
  const wholeMonths =
    (end.getFullYear() - start.getFullYear()) * MONTHS_PER_UNIT.year +
    (end.getMonth() - start.getMonth());
  const anchorTime = add(start, wholeMonths, 'month').getTime();
  const endTime = end.getTime();

  // One formula covers every case. The neighbouring anchor is the next month
  // when the target overshoots this one and the previous month otherwise; the
  // distance between the two anchors is the month length the remainder is
  // scaled by, and the signed numerator supplies the direction. When the target
  // sits exactly on its anchor the numerator is zero, so no special case is
  // needed and the two anchors are always a month apart, never zero.
  // Stryker disable next-line EqualityOperator: at equality the numerator is
  // zero, so either neighbour gives the same answer. Unkillable by construction.
  const step = endTime > anchorTime ? 1 : -1;
  const neighbourTime = add(start, wholeMonths + step, 'month').getTime();
  const months = wholeMonths + (endTime - anchorTime) / Math.abs(neighbourTime - anchorTime);

  return reversed ? -months : months;
}

/** Signed difference per unit, keyed by canonical unit name. */
const DIFFERENCE: Record<Unit, (from: Date, to: Date) => number> = {
  millisecond: (from, to) => to.getTime() - from.getTime(),
  second: (from, to) => (to.getTime() - from.getTime()) / MS_PER_EXACT_UNIT.second,
  minute: (from, to) => (to.getTime() - from.getTime()) / MS_PER_EXACT_UNIT.minute,
  hour: (from, to) => (to.getTime() - from.getTime()) / MS_PER_EXACT_UNIT.hour,
  day: daysBetween,
  week: (from, to) => daysBetween(from, to) / DAYS_PER_WEEK,
  month: monthsBetween,
  quarter: (from, to) => monthsBetween(from, to) / MONTHS_PER_UNIT.quarter,
  year: (from, to) => monthsBetween(from, to) / MONTHS_PER_UNIT.year,
};

/**
 * Signed difference `to − from`, expressed in `unit`.
 *
 * Millisecond through hour are exact elapsed time, so a 23-hour
 * daylight-saving day really is 23 hours. Day and week are calendar based, so
 * that same day is 1. Month, quarter and year are calendar based with a
 * fractional remainder.
 *
 * @param unit - Defaults to `'millisecond'`, as in v1.
 * @throws {TimeSolverError} `INVALID_DATE` or `INVALID_UNIT`. v1 logged to the
 *   console and returned `0` for an unknown unit.
 *
 * @example
 * between('2020-01-01', '2020-01-02', 'H'); // 24
 * between('2020-01-01', '2020-02-01', 'M'); // 1
 */
export function between(from: DateInput, to: DateInput, unit?: UnitInput): number {
  return DIFFERENCE[normalizeUnit(unit)](toDate(from), toDate(to));
}

/**
 * Whether two dates are the same instant, or fall in the same `unit` when one
 * is given.
 *
 * v1 compared `Date#toString()`, which has no millisecond field, so two dates
 * 998 ms apart compared equal.
 *
 * @param options - `weekStartsOn` moves the week boundary when `unit` is
 *   `'week'`; see {@link startOf}.
 *
 * @example
 * equal('2020-01-01T00:00:00.001', '2020-01-01T00:00:00.999');           // false
 * equal('2020-01-01T00:00:00.001', '2020-01-01T00:00:00.999', 'SECOND'); // true
 * equal('2024-03-10', '2024-03-16', 'week', { weekStartsOn: 1 });        // false
 */
export function equal(
  first: DateInput,
  second: DateInput,
  unit?: UnitInput,
  options?: WeekOptions,
): boolean {
  const resolved = normalizeUnit(unit);

  return (
    startOf(first, resolved, options).getTime() === startOf(second, resolved, options).getTime()
  );
}

/**
 * Whether `first` is strictly after `second`, compared at `unit` granularity.
 *
 * v1 accepted a `unit` argument and ignored it, so two times on the same day
 * compared as different days.
 *
 * @param options - See {@link equal}.
 *
 * @example
 * after('2020-01-01T23:00', '2020-01-01T01:00');        // true
 * after('2020-01-01T23:00', '2020-01-01T01:00', 'DAY'); // false, same day
 */
export function after(
  first: DateInput,
  second: DateInput,
  unit?: UnitInput,
  options?: WeekOptions,
): boolean {
  const resolved = normalizeUnit(unit);

  return startOf(first, resolved, options).getTime() > startOf(second, resolved, options).getTime();
}

/**
 * Whether `first` is strictly before `second`, compared at `unit` granularity.
 *
 * @param options - See {@link equal}.
 */
export function before(
  first: DateInput,
  second: DateInput,
  unit?: UnitInput,
  options?: WeekOptions,
): boolean {
  const resolved = normalizeUnit(unit);

  return startOf(first, resolved, options).getTime() < startOf(second, resolved, options).getTime();
}

/** Whether a date falls on a later calendar day than today. */
export function afterToday(date: DateInput): boolean {
  return after(date, new Date(), 'day');
}

/** Whether a date falls on an earlier calendar day than today. */
export function beforeToday(date: DateInput): boolean {
  return before(date, new Date(), 'day');
}
