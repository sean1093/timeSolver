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

const DAYS_PER_WEEK = 7;

/**
 * Calendar days between two dates, with the fractional part taken from the
 * difference in time of day.
 *
 * Counting whole days from local midnights keeps the result correct across
 * daylight-saving changes, where dividing elapsed milliseconds by 86 400 000
 * would report 0.958 days for a 23-hour day.
 */
function daysBetween(from: Date, to: Date): number {
  const fromStart = startOf(from, 'day');
  const toStart = startOf(to, 'day');
  const wholeDays = Math.round((toStart.getTime() - fromStart.getTime()) / MS_PER_DAY);
  const timeOfDayDelta = to.getTime() - toStart.getTime() - (from.getTime() - fromStart.getTime());

  return wholeDays + timeOfDayDelta / MS_PER_DAY;
}

/**
 * Calendar months between two dates, with the fractional part scaled by the
 * length of the month the remainder falls in. January 1 to February 1 is
 * exactly 1, where v1's average-month constant reported 1.0184804928131417.
 */
function monthsBetween(from: Date, to: Date): number {
  const wholeMonths =
    (to.getFullYear() - from.getFullYear()) * MONTHS_PER_UNIT.year +
    (to.getMonth() - from.getMonth());
  const anchor = add(from, wholeMonths, 'month');
  const anchorTime = anchor.getTime();
  const toTime = to.getTime();

  if (toTime === anchorTime) {
    return wholeMonths;
  }

  if (toTime > anchorTime) {
    const next = add(from, wholeMonths + 1, 'month').getTime();

    return wholeMonths + (toTime - anchorTime) / (next - anchorTime);
  }

  const previous = add(from, wholeMonths - 1, 'month').getTime();

  return wholeMonths - (anchorTime - toTime) / (anchorTime - previous);
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
 * Whether two dates are the same instant, or the same `unit` when one is given.
 *
 * v1 compared `Date#toString()`, which has no millisecond field, so two dates
 * 998 ms apart compared equal.
 *
 * @example
 * equal('2020-01-01T00:00:00.001', '2020-01-01T00:00:00.999');          // false
 * equal('2020-01-01T00:00:00.001', '2020-01-01T00:00:00.999', 'SECOND'); // true
 */
export function equal(first: DateInput, second: DateInput, unit?: UnitInput): boolean {
  const resolved = normalizeUnit(unit);

  return startOf(first, resolved).getTime() === startOf(second, resolved).getTime();
}

/**
 * Whether `first` is strictly after `second`, compared at `unit` granularity.
 *
 * v1 accepted a `unit` argument and ignored it, so two times on the same day
 * compared as different days.
 *
 * @example
 * after('2020-01-01T23:00', '2020-01-01T01:00');        // true
 * after('2020-01-01T23:00', '2020-01-01T01:00', 'DAY'); // false, same day
 */
export function after(first: DateInput, second: DateInput, unit?: UnitInput): boolean {
  const resolved = normalizeUnit(unit);

  return startOf(first, resolved).getTime() > startOf(second, resolved).getTime();
}

/** Whether `first` is strictly before `second`, compared at `unit` granularity. */
export function before(first: DateInput, second: DateInput, unit?: UnitInput): boolean {
  const resolved = normalizeUnit(unit);

  return startOf(first, resolved).getTime() < startOf(second, resolved).getTime();
}

/** Whether a date falls on a later calendar day than today. */
export function afterToday(date: DateInput): boolean {
  return after(date, new Date(), 'day');
}

/** Whether a date falls on an earlier calendar day than today. */
export function beforeToday(date: DateInput): boolean {
  return before(date, new Date(), 'day');
}
