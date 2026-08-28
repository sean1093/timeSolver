import { describe, expect, it } from 'vitest';
import {
  daysInMonth,
  getAbbrMonth,
  getAbbrWeek,
  getFirstMonthByQuarter,
  getFullMonth,
  getFullWeek,
  getQuarter,
  getQuarterByMonth,
  isLeapYear,
  monthAbbreviation,
  monthName,
  weekdayAbbreviation,
  weekdayName,
} from '../src/calendar.js';

describe('name tables', () => {
  it('maps month numbers to English names', () => {
    expect(monthName(1)).toBe('January');
    expect(monthName(12)).toBe('December');
    expect(monthAbbreviation(3)).toBe('Mar');
  });

  it('maps weekday indexes to English names', () => {
    expect(weekdayName(0)).toBe('Sunday');
    expect(weekdayName(6)).toBe('Saturday');
    expect(weekdayAbbreviation(1)).toBe('Mon');
  });

  it.each([0, 13, 1.5, Number.NaN])('rejects month %s', (month) => {
    expect(() => monthName(month)).toThrowError(/month must be an integer from 1 to 12/);
  });

  it.each([-1, 7, 0.5])('rejects weekday %s', (weekday) => {
    expect(() => weekdayName(weekday)).toThrowError(/weekday must be an integer from 0 to 6/);
  });
});

describe('date-driven helpers', () => {
  // 2024-03-17 is a Sunday; 2024-03-18 is a Monday.
  it('reads weekday names from a fixed table, not Date#toString', () => {
    expect(getFullWeek(new Date(2024, 2, 18))).toBe('Monday');
    expect(getAbbrWeek(new Date(2024, 2, 18))).toBe('Mon');
    expect(getFullWeek(new Date(2024, 2, 17))).toBe('Sunday');
    expect(getAbbrWeek(new Date(2024, 2, 17))).toBe('Sun');
  });

  it('reads month names from a fixed table', () => {
    expect(getFullMonth(new Date(2024, 2, 17))).toBe('March');
    expect(getAbbrMonth(new Date(2024, 2, 17))).toBe('Mar');
  });

  it('accepts any date input', () => {
    expect(getFullMonth('2024-06-15T12:00:00.000Z')).toBe('June');
    expect(getAbbrMonth(new Date(2024, 0, 1).getTime())).toBe('Jan');
  });

  it('throws for unreadable input rather than dereferencing null', () => {
    // v1 logged to the console, returned null, then crashed on `.getDay()`.
    expect(() => getFullWeek('nope')).toThrowError(/Cannot read a date/);
    expect(() => getAbbrWeek('nope')).toThrowError(/Cannot read a date/);
    expect(() => getFullMonth('nope')).toThrowError(/Cannot read a date/);
    expect(() => getAbbrMonth('nope')).toThrowError(/Cannot read a date/);
  });
});

describe('quarters', () => {
  it.each([
    [0, 1],
    [2, 1],
    [3, 2],
    [5, 2],
    [6, 3],
    [8, 3],
    [9, 4],
    [11, 4],
  ])('reports month index %i as quarter %i', (monthIndex, quarter) => {
    expect(getQuarter(new Date(2024, monthIndex, 15))).toBe(quarter);
  });

  it.each([
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 2],
    [6, 2],
    [7, 3],
    [9, 3],
    [10, 4],
    [12, 4],
  ])('maps month %i to quarter %i', (month, quarter) => {
    expect(getQuarterByMonth(month)).toBe(quarter);
  });

  it.each([0, 13, -1, 1.5, Number.NaN])('returns null for month %s', (month) => {
    expect(getQuarterByMonth(month)).toBeNull();
  });

  it.each([
    [1, 1],
    [2, 4],
    [3, 7],
    [4, 10],
  ])('maps quarter %i to first month %i', (quarter, month) => {
    expect(getFirstMonthByQuarter(quarter)).toBe(month);
  });

  it.each([0, 5, -1, 2.5])('returns null for quarter %s', (quarter) => {
    expect(getFirstMonthByQuarter(quarter)).toBeNull();
  });
});

describe('isLeapYear', () => {
  it.each([
    [2024, true],
    [2023, false],
    [2000, true],
    [1900, false],
    [2100, false],
    [1600, true],
  ])('reports %i as %s', (year, expected) => {
    expect(isLeapYear(year)).toBe(expected);
  });

  it('rejects non-integer years', () => {
    expect(() => isLeapYear(2024.5)).toThrowError(/year must be an integer/);
  });
});

describe('daysInMonth', () => {
  it.each([
    [2024, 1, 31],
    [2024, 2, 29],
    [2023, 2, 28],
    [2000, 2, 29],
    [1900, 2, 28],
    [2024, 4, 30],
    [2024, 12, 31],
  ])('reports %i-%i as %i days', (year, month, days) => {
    expect(daysInMonth(year, month)).toBe(days);
  });

  it('handles years below 100 without mapping them into the 1900s', () => {
    // `new Date(50, 1, 0)` would have meant 1950. 50 is not a leap year, 48 is.
    expect(daysInMonth(50, 2)).toBe(28);
    expect(daysInMonth(48, 2)).toBe(29);
  });

  it.each([0, 13, 1.5])('rejects month %s', (month) => {
    expect(() => daysInMonth(2024, month)).toThrowError(/month must be an integer from 1 to 12/);
  });

  it('rejects non-integer years', () => {
    expect(() => daysInMonth(2024.5, 1)).toThrowError(/year must be an integer/);
  });
});
