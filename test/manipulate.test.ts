import { describe, expect, it } from 'vitest';
import type { TimeSolverError } from '../src/errors.js';
import { getString } from '../src/format.js';
import { add, endOf, startOf, subtract } from '../src/manipulate.js';

const STAMP = 'YYYY-MM-DD HH:mm:ss.SSS';

describe('add immutability', () => {
  it.each(['millisecond', 'hour', 'day', 'week', 'month', 'year'])(
    'leaves the input Date untouched when adding a %s',
    (unit) => {
      const input = new Date(2024, 0, 31, 12, 0, 0, 0);
      const before = input.getTime();

      add(input, 1, unit);

      expect(input.getTime()).toBe(before);
    },
  );

  it('returns a different instance', () => {
    const input = new Date(2024, 2, 17);

    expect(add(input, 0, 'day')).not.toBe(input);
  });
});

describe('add exact units', () => {
  it.each([
    ['millisecond', 1500, 1500],
    ['second', 90, 90_000],
    ['minute', 30, 1_800_000],
    ['hour', 2, 7_200_000],
  ])('adds %s amounts by exact elapsed time', (unit, amount, expectedMs) => {
    const base = new Date(2024, 5, 15, 12, 0, 0, 0);

    expect(add(base, amount, unit).getTime() - base.getTime()).toBe(expectedMs);
  });

  it('allows fractional amounts of exact units', () => {
    const base = new Date(2024, 5, 15, 12, 0, 0, 0);

    expect(add(base, 1.5, 'hour').getTime() - base.getTime()).toBe(5_400_000);
  });

  it('defaults the amount to zero and the unit to milliseconds', () => {
    const base = new Date(2024, 5, 15, 12, 0, 0, 0);

    expect(add(base).getTime()).toBe(base.getTime());
    expect(add(base, 1000).getTime() - base.getTime()).toBe(1000);
  });
});

describe('add calendar units', () => {
  it('clamps to the last day of a shorter month', () => {
    // v1 returned 2024-03-02 here, because setMonth overflows.
    expect(getString(add(new Date(2024, 0, 31), 1, 'month'), 'YYYY-MM-DD')).toBe('2024-02-29');
    expect(getString(add(new Date(2023, 0, 31), 1, 'month'), 'YYYY-MM-DD')).toBe('2023-02-28');
    expect(getString(add(new Date(2024, 0, 31), 1, 'M'), 'YYYY-MM-DD')).toBe('2024-02-29');
  });

  it('clamps when subtracting too', () => {
    expect(getString(subtract(new Date(2024, 2, 31), 1, 'month'), 'YYYY-MM-DD')).toBe('2024-02-29');
  });

  it('keeps the time of day while shifting the calendar', () => {
    expect(getString(add(new Date(2024, 0, 15, 9, 8, 7, 6), 1, 'month'), STAMP)).toBe(
      '2024-02-15 09:08:07.006',
    );
  });

  it('crosses year boundaries in both directions', () => {
    expect(getString(add(new Date(2024, 11, 15), 1, 'month'), 'YYYY-MM-DD')).toBe('2025-01-15');
    expect(getString(add(new Date(2024, 0, 15), -1, 'month'), 'YYYY-MM-DD')).toBe('2023-12-15');
    expect(getString(add(new Date(2024, 0, 15), -13, 'month'), 'YYYY-MM-DD')).toBe('2022-12-15');
  });

  it('treats a quarter as three months and a year as twelve', () => {
    expect(getString(add(new Date(2024, 0, 15), 1, 'quarter'), 'YYYY-MM-DD')).toBe('2024-04-15');
    expect(getString(add(new Date(2024, 0, 15), 1, 'year'), 'YYYY-MM-DD')).toBe('2025-01-15');
    expect(getString(add(new Date(2024, 1, 29), 1, 'year'), 'YYYY-MM-DD')).toBe('2025-02-28');
  });

  it('adds days and weeks by the calendar', () => {
    expect(getString(add(new Date(2024, 1, 28), 1, 'day'), 'YYYY-MM-DD')).toBe('2024-02-29');
    expect(getString(add(new Date(2024, 1, 28), 1, 'week'), 'YYYY-MM-DD')).toBe('2024-03-06');
    expect(getString(add(new Date(2024, 1, 28), -1, 'week'), 'YYYY-MM-DD')).toBe('2024-02-21');
  });

  it('keeps the wall-clock time across a daylight-saving change', () => {
    // 2024-03-10 loses an hour in the pinned test zone; 2024-11-03 gains one.
    expect(getString(add(new Date(2024, 2, 9, 12), 1, 'day'), STAMP)).toBe(
      '2024-03-10 12:00:00.000',
    );
    expect(getString(add(new Date(2024, 10, 2, 12), 1, 'day'), STAMP)).toBe(
      '2024-11-03 12:00:00.000',
    );
    expect(getString(add(new Date(2024, 2, 3, 12), 1, 'week'), STAMP)).toBe(
      '2024-03-10 12:00:00.000',
    );
  });
});

describe('add range limits', () => {
  // A Date spans roughly 100 million days either side of the epoch. Beyond
  // that, v2.0.0 handed back an Invalid Date, deferring the failure to
  // whatever touched it next.
  it.each([
    [1e9, 'day'],
    [1e9, 'week'],
    [1e7, 'month'],
    [1e6, 'year'],
    [1e18, 'millisecond'],
    [1e15, 'hour'],
  ])('throws rather than returning an Invalid Date for %s %s', (amount, unit) => {
    try {
      add(new Date(2024, 0, 1), amount, unit);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as TimeSolverError).code).toBe('INVALID_ARGUMENT');
      expect((error as TimeSolverError).message).toMatch(/leaves the range a Date can represent/);
    }
  });

  it('throws in the negative direction too', () => {
    expect(() => subtract(new Date(2024, 0, 1), 1e9, 'day')).toThrowError(
      /leaves the range a Date can represent/,
    );
  });

  it('still accepts the extremes of the representable range', () => {
    expect(add(new Date(0), 8.64e15 - 1, 'millisecond').getTime()).toBe(8.64e15 - 1);
    // Not asserted as an exact instant: day arithmetic follows the calendar, so
    // the result shifts by an hour in a zone that observes daylight saving.
    expect(Number.isNaN(add(new Date(0), 99_999_999, 'day').getTime())).toBe(false);
    expect(Number.isNaN(add(new Date(0), -99_999_999, 'day').getTime())).toBe(false);
  });
});

describe('add failures', () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects the amount %s',
    (amount) => {
      expect(() => add(new Date(), amount, 'day')).toThrowError(/amount must be a finite number/);
    },
  );

  it.each(['day', 'week', 'month', 'quarter', 'year'])(
    'rejects a fractional amount of %s, which has no fixed length',
    (unit) => {
      try {
        add(new Date(), 1.5, unit);
        expect.unreachable('should have thrown');
      } catch (error) {
        expect((error as TimeSolverError).code).toBe('INVALID_ARGUMENT');
      }
    },
  );

  it('rejects an unknown unit instead of silently returning null', () => {
    expect(() => add(new Date(), 1, 'fortnight')).toThrowError(/Unknown time unit/);
  });

  it('rejects unreadable dates', () => {
    expect(() => add('nope', 1, 'day')).toThrowError(/Cannot read a date/);
    expect(() => subtract(undefined as never, 1, 'day')).toThrowError(/Cannot read a date/);
  });
});

describe('subtract', () => {
  it('mirrors add', () => {
    const base = new Date(2024, 5, 15, 12, 30);

    expect(subtract(base, 2, 'hour').getTime()).toBe(add(base, -2, 'hour').getTime());
    expect(getString(subtract(base, 1, 'day'), 'YYYY-MM-DD')).toBe('2024-06-14');
  });

  it('defaults to a zero-millisecond shift', () => {
    const base = new Date(2024, 5, 15);

    expect(subtract(base).getTime()).toBe(base.getTime());
  });
});

describe('startOf', () => {
  const sample = new Date(2024, 4, 15, 14, 30, 45, 123);

  it.each([
    ['millisecond', '2024-05-15 14:30:45.123'],
    ['second', '2024-05-15 14:30:45.000'],
    ['minute', '2024-05-15 14:30:00.000'],
    ['hour', '2024-05-15 14:00:00.000'],
    ['day', '2024-05-15 00:00:00.000'],
    ['week', '2024-05-12 00:00:00.000'],
    ['month', '2024-05-01 00:00:00.000'],
    ['quarter', '2024-04-01 00:00:00.000'],
    ['year', '2024-01-01 00:00:00.000'],
  ])('truncates to the start of the %s', (unit, expected) => {
    expect(getString(startOf(sample, unit), STAMP)).toBe(expected);
  });

  it('starts weeks on Sunday', () => {
    // 2024-05-12 is a Sunday, 2024-05-18 a Saturday.
    expect(getString(startOf(new Date(2024, 4, 12), 'week'), 'YYYY-MM-DD')).toBe('2024-05-12');
    expect(getString(startOf(new Date(2024, 4, 18), 'week'), 'YYYY-MM-DD')).toBe('2024-05-12');
  });

  it('crosses a month boundary when the week does', () => {
    expect(getString(startOf(new Date(2024, 4, 1), 'week'), 'YYYY-MM-DD')).toBe('2024-04-28');
  });

  it.each([
    [0, '2024-01-01'],
    [3, '2024-04-01'],
    [7, '2024-07-01'],
    [11, '2024-10-01'],
  ])('anchors quarters containing month index %i at %s', (monthIndex, expected) => {
    expect(getString(startOf(new Date(2024, monthIndex, 20), 'quarter'), 'YYYY-MM-DD')).toBe(
      expected,
    );
  });

  it('does not modify the input', () => {
    const input = new Date(2024, 4, 15, 14, 30);
    const before = input.getTime();

    startOf(input, 'day');

    expect(input.getTime()).toBe(before);
  });
});

describe('endOf', () => {
  it.each([
    ['millisecond', '2024-05-15 14:30:45.123'],
    ['second', '2024-05-15 14:30:45.999'],
    ['minute', '2024-05-15 14:30:59.999'],
    ['hour', '2024-05-15 14:59:59.999'],
    ['day', '2024-05-15 23:59:59.999'],
    ['week', '2024-05-18 23:59:59.999'],
    ['month', '2024-05-31 23:59:59.999'],
    ['quarter', '2024-06-30 23:59:59.999'],
    ['year', '2024-12-31 23:59:59.999'],
  ])('returns the last millisecond of the %s', (unit, expected) => {
    expect(getString(endOf(new Date(2024, 4, 15, 14, 30, 45, 123), unit), STAMP)).toBe(expected);
  });

  it('ends a leap February on the 29th', () => {
    expect(getString(endOf(new Date(2024, 1, 10), 'month'), STAMP)).toBe('2024-02-29 23:59:59.999');
    expect(getString(endOf(new Date(2023, 1, 10), 'month'), STAMP)).toBe('2023-02-28 23:59:59.999');
  });

  it('stays inside the day and week that lose or gain an hour', () => {
    expect(getString(endOf(new Date(2024, 2, 10, 6), 'day'), STAMP)).toBe(
      '2024-03-10 23:59:59.999',
    );
    expect(getString(endOf(new Date(2024, 10, 3, 6), 'day'), STAMP)).toBe(
      '2024-11-03 23:59:59.999',
    );
    expect(getString(endOf(new Date(2024, 2, 10, 6), 'week'), STAMP)).toBe(
      '2024-03-16 23:59:59.999',
    );
  });
});
