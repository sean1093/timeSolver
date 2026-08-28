import { type DateInput, toDate } from './coerce.js';
import { startOf } from './manipulate.js';
import { MS_PER_DAY } from './units.js';
import { DAYS_PER_WEEK, daysSinceWeekStart, resolveWeekStart, type WeekOptions } from './week.js';

/** ISO-8601 weeks start on Monday, which is index 1 for `Date#getDay`. */
const ISO_WEEK_START = 1;

/** ISO-8601 week 1 is the week containing 4 January, equivalently the first Thursday. */
const ISO_ANCHOR_DAY = 4;

/** Whole days between two local midnights, rounded so a DST shift cannot bias it. */
function wholeDaysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * The Thursday of the ISO week containing a date. ISO week numbering is defined
 * by that Thursday: it is always in the week's own ISO year, which is what makes
 * the year at a January or December boundary unambiguous.
 */
function isoThursday(date: Date): Date {
  const thursday = startOf(date, 'day');
  const daysIntoWeek = daysSinceWeekStart(thursday, ISO_WEEK_START);

  thursday.setDate(thursday.getDate() - daysIntoWeek + 3);

  return startOf(thursday, 'day');
}

/**
 * ISO-8601 week-numbering year of a date, which is not always its calendar year.
 *
 * 29 December 2025 falls in ISO week 1 of 2026, and 1 January 2023 falls in ISO
 * week 52 of 2022. Pair this with {@link getISOWeek} whenever you render a week
 * label, or the year will be wrong for a few days either side of January.
 *
 * @example
 * getISOWeekYear('2024-12-30T12:00'); // 2025
 * getISOWeekYear('2023-01-01T12:00'); // 2022
 */
export function getISOWeekYear(date: DateInput): number {
  return isoThursday(toDate(date)).getFullYear();
}

/**
 * ISO-8601 week number of a date, 1 through 53.
 *
 * Weeks start on Monday and week 1 is the week containing 4 January. Use
 * {@link getISOWeekYear} for the matching year.
 *
 * @example
 * getISOWeek('2024-01-01T12:00'); // 1
 * getISOWeek('2024-12-30T12:00'); // 1, of ISO year 2025
 * getISOWeek('2020-12-31T12:00'); // 53
 */
export function getISOWeek(date: DateInput): number {
  const thursday = isoThursday(toDate(date));
  const anchor = isoThursday(new Date(thursday.getFullYear(), 0, ISO_ANCHOR_DAY));

  return 1 + wholeDaysBetween(anchor, thursday) / DAYS_PER_WEEK;
}

/**
 * Week of the calendar year, counting the week that contains 1 January as week 1.
 *
 * This is the plain reading of "week number" and it is not the ISO rule: the
 * count follows the calendar year rather than the week-numbering year, and the
 * first and last weeks may be partial. Because a partial week at each end still
 * counts, the result runs from 1 to as high as 54. For the ISO definition, which
 * is what `2024-W01` means, use {@link getISOWeek}.
 *
 * @param options - `weekStartsOn` moves the week boundary, defaulting to Sunday.
 *
 * @example
 * getWeekOfYear('2024-01-01T12:00');                      // 1
 * getWeekOfYear('2024-12-31T12:00');                      // 53
 * getWeekOfYear('2024-06-15T12:00', { weekStartsOn: 1 }); // 24
 */
export function getWeekOfYear(date: DateInput, options?: WeekOptions): number {
  const weekStartsOn = resolveWeekStart(options);
  const target = startOf(date, 'day');
  const januaryFirst = startOf(new Date(target.getFullYear(), 0, 1), 'day');
  const daysIntoYear = wholeDaysBetween(januaryFirst, target);
  const offsetOfJanuaryFirst = daysSinceWeekStart(januaryFirst, weekStartsOn);

  return Math.floor((daysIntoYear + offsetOfJanuaryFirst) / DAYS_PER_WEEK) + 1;
}
