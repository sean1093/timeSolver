import { describe, expect, it } from 'vitest';
import type { TimeSolverError } from '../src/errors.js';
import { getISOWeek, getISOWeekYear, getWeekOfYear } from '../src/weeknumber.js';

/**
 * Dates whose ISO week and week-year are fixed by the standard. Every one is a
 * boundary case: the week either starts in the previous calendar year or ends in
 * the next one.
 */
const ISO_CASES: ReadonlyArray<readonly [string, number, number]> = [
  // date (local noon), ISO week, ISO week-year
  ['2024-01-01T12:00', 1, 2024], // a Monday, so week 1 starts on 1 January
  ['2024-01-07T12:00', 1, 2024], // the Sunday that ends week 1
  ['2024-01-08T12:00', 2, 2024],
  ['2024-06-15T12:00', 24, 2024],
  ['2024-12-29T12:00', 52, 2024], // Sunday, last day of week 52
  ['2024-12-30T12:00', 1, 2025], // Monday, so week 1 of 2025 starts in December
  ['2024-12-31T12:00', 1, 2025],
  ['2025-01-01T12:00', 1, 2025],
  ['2023-01-01T12:00', 52, 2022], // Sunday, so it belongs to 2022
  ['2023-01-02T12:00', 1, 2023],
  ['2021-01-01T12:00', 53, 2020], // 2020 is a 53-week ISO year
  ['2021-01-03T12:00', 53, 2020],
  ['2021-01-04T12:00', 1, 2021],
  ['2020-12-31T12:00', 53, 2020],
  ['2015-12-31T12:00', 53, 2015],
  ['2016-01-01T12:00', 53, 2015],
];

describe('getISOWeek and getISOWeekYear', () => {
  it.each(ISO_CASES)('reports %s as week %i of %i', (date, week, weekYear) => {
    expect(getISOWeek(date)).toBe(week);
    expect(getISOWeekYear(date)).toBe(weekYear);
  });

  it('returns a whole number for every day of a decade', () => {
    const start = new Date(2016, 0, 1, 12);

    for (let index = 0; index < 3653; index += 1) {
      const day = new Date(start.getTime());
      day.setDate(day.getDate() + index);

      const week = getISOWeek(day);

      expect(Number.isInteger(week)).toBe(true);
      expect(week).toBeGreaterThanOrEqual(1);
      expect(week).toBeLessThanOrEqual(53);
    }
  });

  it('gives every day of an ISO week the same number and year', () => {
    // 2024-W09 runs from Monday 26 February to Sunday 3 March.
    for (let day = 26; day <= 29; day += 1) {
      expect(getISOWeek(new Date(2024, 1, day, 12))).toBe(9);
      expect(getISOWeekYear(new Date(2024, 1, day, 12))).toBe(2024);
    }
    for (let day = 1; day <= 3; day += 1) {
      expect(getISOWeek(new Date(2024, 2, day, 12))).toBe(9);
      expect(getISOWeekYear(new Date(2024, 2, day, 12))).toBe(2024);
    }

    expect(getISOWeek(new Date(2024, 2, 4, 12))).toBe(10);
  });

  it('advances by one every seven days', () => {
    let previous = getISOWeek(new Date(2024, 0, 1, 12));

    for (let index = 1; index < 52; index += 1) {
      const day = new Date(2024, 0, 1, 12);
      day.setDate(day.getDate() + index * 7);

      const week = getISOWeek(day);

      expect(week).toBe(previous + 1);
      previous = week;
    }
  });

  it('throws for unreadable input', () => {
    expect(() => getISOWeek('nope')).toThrowError(/Cannot read a date/);
    expect(() => getISOWeekYear('nope')).toThrowError(/Cannot read a date/);
  });
});

describe('getWeekOfYear', () => {
  it('counts the week containing 1 January as week 1', () => {
    expect(getWeekOfYear('2024-01-01T12:00')).toBe(1);
    expect(getWeekOfYear('2024-01-06T12:00')).toBe(1);
    expect(getWeekOfYear('2024-01-07T12:00')).toBe(2);
  });

  it('follows the week boundary it is given', () => {
    // 2024-01-01 is a Monday. With Sunday starts, week 1 is 31 Dec to 6 Jan;
    // with Monday starts, week 1 is 1 to 7 January.
    expect(getWeekOfYear('2024-01-07T12:00')).toBe(2);
    expect(getWeekOfYear('2024-01-07T12:00', { weekStartsOn: 1 })).toBe(1);
    expect(getWeekOfYear('2024-06-15T12:00', { weekStartsOn: 1 })).toBe(24);
  });

  it('is monotonic within a year', () => {
    let previous = 0;

    for (let index = 0; index < 366; index += 1) {
      const day = new Date(2024, 0, 1, 12);
      day.setDate(day.getDate() + index);

      const week = getWeekOfYear(day);

      expect(week).toBeGreaterThanOrEqual(previous);
      expect(week - previous).toBeLessThanOrEqual(1);
      previous = week;
    }
  });

  it('restarts at 1 in the next year', () => {
    expect(getWeekOfYear('2024-12-31T12:00')).toBe(53);
    expect(getWeekOfYear('2025-01-01T12:00')).toBe(1);
  });

  it('rejects an invalid week start', () => {
    expect(() => getWeekOfYear('2024-01-01T12:00', { weekStartsOn: 9 as 0 })).toThrowError(
      /weekStartsOn must be an integer/,
    );
  });
});

/** Local noon on a date, for years the `Date` constructor would misread. */
function localNoon(year: number, month: number, day: number): Date {
  const date = new Date(2000, 0, 1, 12);

  date.setFullYear(year, month - 1, day);

  return date;
}

describe('week numbers outside the ordinary year range', () => {
  it('handles years below 100 without mapping them into the 1900s', () => {
    // `new Date(50, 0, 4)` would have meant 1950, which put the anchor 1900
    // years away: getISOWeek reported -99136. 4 January is in ISO week 1 by
    // definition, and 1 January 0050 was a Saturday, so the calendar week
    // containing it is week 1 and 4 January falls in week 2.
    expect(getISOWeek(localNoon(50, 1, 4))).toBe(1);
    expect(getISOWeekYear(localNoon(50, 1, 4))).toBe(50);
    expect(getWeekOfYear(localNoon(50, 1, 4))).toBe(2);
  });

  it('numbers a mid-year date in a two-digit year', () => {
    expect(getISOWeek(localNoon(99, 6, 15))).toBe(25);
    expect(getWeekOfYear(localNoon(99, 6, 15))).toBe(25);
  });

  it('treats year 100 the same way', () => {
    expect(getISOWeek(localNoon(100, 1, 4))).toBe(1);
    expect(getISOWeek(localNoon(1000, 1, 4))).toBe(1);
  });

  it('numbers the last representable instant', () => {
    expect(getISOWeek(new Date(8.64e15))).toBe(37);
    expect(getWeekOfYear(new Date(8.64e15))).toBe(37);
  });

  it('refuses the first year of the range by naming the anchor it needs', () => {
    // The input is readable; 4 January -271821 is not, and it is what week
    // numbering counts from. Reporting the input as unreadable, which is what
    // the generic INVALID_DATE said, sent callers looking in the wrong place.
    for (const [label, run] of [
      ['getISOWeek', () => getISOWeek(new Date(-8.64e15))],
      ['getWeekOfYear', () => getWeekOfYear(new Date(-8.64e15))],
    ] as const) {
      try {
        run();
        expect.unreachable(`${label} should have thrown`);
      } catch (error) {
        expect((error as TimeSolverError).code).toBe('INVALID_ARGUMENT');
        expect((error as TimeSolverError).message).toMatch(
          /January -271821, which leaves the range a Date can represent/,
        );
      }
    }
  });
});
