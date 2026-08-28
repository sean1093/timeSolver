import { TimeSolverError } from './errors.js';

/** Day a week starts on: `0` for Sunday through `6` for Saturday. */
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Where the week boundary falls, for functions that truncate to a week. */
export interface WeekOptions {
  /**
   * Day the week starts on, `0` for Sunday through `6` for Saturday. Defaults
   * to `0`, matching `Date#getDay`. ISO-8601 weeks start on Monday, so pass
   * `1` for those; much of the Middle East uses `6`.
   */
  readonly weekStartsOn?: WeekDay;
}

/** Days in a week. */
export const DAYS_PER_WEEK = 7;

/** The week start used when a caller does not choose one. */
export const DEFAULT_WEEK_START: WeekDay = 0;

/**
 * Validate a week-start option and fall back to the default.
 *
 * @throws {TimeSolverError} `INVALID_ARGUMENT` when it is not an integer from 0 to 6.
 */
export function resolveWeekStart(options?: WeekOptions): WeekDay {
  const weekStartsOn = options?.weekStartsOn;

  if (weekStartsOn === undefined) {
    return DEFAULT_WEEK_START;
  }

  if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6) {
    throw new TimeSolverError(
      'INVALID_ARGUMENT',
      `weekStartsOn must be an integer from 0 (Sunday) to 6 (Saturday), received ${weekStartsOn}.`,
    );
  }

  return weekStartsOn;
}

/** How many days a date sits past the start of its week. */
export function daysSinceWeekStart(date: Date, weekStartsOn: WeekDay): number {
  return (date.getDay() - weekStartsOn + DAYS_PER_WEEK) % DAYS_PER_WEEK;
}
