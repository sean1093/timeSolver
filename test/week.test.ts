import { describe, expect, it } from 'vitest';
import { after, before, equal } from '../src/compare.js';
import type { TimeSolverError } from '../src/errors.js';
import { getString } from '../src/format.js';
import { add, endOf, startOf } from '../src/manipulate.js';
import type { WeekDay } from '../src/week.js';

// 2024-03-13 is a Wednesday. The week containing it starts on a different date
// for each possible week start.
const WEDNESDAY = new Date(2024, 2, 13, 15, 30);

const EXPECTED_STARTS: ReadonlyArray<readonly [WeekDay, string, string]> = [
  [0, '2024-03-10', 'Sun'],
  [1, '2024-03-11', 'Mon'],
  [2, '2024-03-12', 'Tue'],
  [3, '2024-03-13', 'Wed'],
  [4, '2024-03-07', 'Thu'],
  [5, '2024-03-08', 'Fri'],
  [6, '2024-03-09', 'Sat'],
];

describe('startOf week', () => {
  it('defaults to Sunday, as before the option existed', () => {
    expect(getString(startOf(WEDNESDAY, 'week'), 'YYYY-MM-DD ddd')).toBe('2024-03-10 Sun');
  });

  it.each(EXPECTED_STARTS)('starts on %i at %s (%s)', (weekStartsOn, date, weekday) => {
    expect(getString(startOf(WEDNESDAY, 'week', { weekStartsOn }), 'YYYY-MM-DD ddd')).toBe(
      `${date} ${weekday}`,
    );
  });

  it('always lands at midnight', () => {
    for (const [weekStartsOn] of EXPECTED_STARTS) {
      expect(getString(startOf(WEDNESDAY, 'week', { weekStartsOn }), 'HH:mm:ss.SSS')).toBe(
        '00:00:00.000',
      );
    }
  });

  it('never moves forward past the date', () => {
    for (const [weekStartsOn] of EXPECTED_STARTS) {
      const start = startOf(WEDNESDAY, 'week', { weekStartsOn });

      expect(start.getTime()).toBeLessThanOrEqual(WEDNESDAY.getTime());
      expect(WEDNESDAY.getTime() - start.getTime()).toBeLessThan(7 * 86_400_000);
    }
  });

  it('is idempotent', () => {
    for (const [weekStartsOn] of EXPECTED_STARTS) {
      const once = startOf(WEDNESDAY, 'week', { weekStartsOn });
      const twice = startOf(once, 'week', { weekStartsOn });

      expect(twice.getTime()).toBe(once.getTime());
    }
  });

  it('crosses month and year boundaries', () => {
    expect(
      getString(startOf(new Date(2024, 0, 2), 'week', { weekStartsOn: 1 }), 'YYYY-MM-DD'),
    ).toBe('2024-01-01');
    expect(
      getString(startOf(new Date(2024, 0, 1), 'week', { weekStartsOn: 1 }), 'YYYY-MM-DD'),
    ).toBe('2024-01-01');
    expect(
      getString(startOf(new Date(2024, 0, 1), 'week', { weekStartsOn: 0 }), 'YYYY-MM-DD'),
    ).toBe('2023-12-31');
  });

  it('ignores the option for every other unit', () => {
    const monthStart = startOf(WEDNESDAY, 'month', { weekStartsOn: 3 });

    expect(getString(monthStart, 'YYYY-MM-DD')).toBe('2024-03-01');
    expect(getString(startOf(WEDNESDAY, 'day', { weekStartsOn: 5 }), 'YYYY-MM-DD')).toBe(
      '2024-03-13',
    );
  });
});

describe('endOf week', () => {
  it.each(EXPECTED_STARTS)('ends on the seventh calendar day of a %i start', (weekStartsOn) => {
    const start = startOf(WEDNESDAY, 'week', { weekStartsOn });
    const end = endOf(WEDNESDAY, 'week', { weekStartsOn });

    // Not asserted in milliseconds: the week containing 2024-03-10 is 167 hours
    // long in the pinned test zone, because the clocks go forward that Sunday.
    expect(getString(end, 'YYYY-MM-DD')).toBe(getString(add(start, 6, 'day'), 'YYYY-MM-DD'));
    expect(getString(end, 'HH:mm:ss.SSS')).toBe('23:59:59.999');
    expect(getString(add(end, 1, 'millisecond'), 'YYYY-MM-DD')).toBe(
      getString(add(start, 7, 'day'), 'YYYY-MM-DD'),
    );
  });
  it('brackets the date it was given', () => {
    for (const [weekStartsOn] of EXPECTED_STARTS) {
      expect(startOf(WEDNESDAY, 'week', { weekStartsOn }).getTime()).toBeLessThanOrEqual(
        WEDNESDAY.getTime(),
      );
      expect(endOf(WEDNESDAY, 'week', { weekStartsOn }).getTime()).toBeGreaterThanOrEqual(
        WEDNESDAY.getTime(),
      );
    }
  });

  it('ends on Sunday for an ISO week', () => {
    expect(getString(endOf(WEDNESDAY, 'week', { weekStartsOn: 1 }), 'YYYY-MM-DD ddd')).toBe(
      '2024-03-17 Sun',
    );
  });
});

describe('comparisons honour the week boundary', () => {
  // 2024-03-10 is a Sunday, 2024-03-16 a Saturday: the same Sunday-start week,
  // but different Monday-start weeks.
  const sunday = new Date(2024, 2, 10, 12);
  const saturday = new Date(2024, 2, 16, 12);

  it('changes what equal reports', () => {
    expect(equal(sunday, saturday, 'week')).toBe(true);
    expect(equal(sunday, saturday, 'week', { weekStartsOn: 1 })).toBe(false);
  });

  it('changes what after and before report', () => {
    expect(after(saturday, sunday, 'week')).toBe(false);
    expect(after(saturday, sunday, 'week', { weekStartsOn: 1 })).toBe(true);
    expect(before(sunday, saturday, 'week')).toBe(false);
    expect(before(sunday, saturday, 'week', { weekStartsOn: 1 })).toBe(true);
  });
});

describe('weekStartsOn validation', () => {
  it.each([-1, 7, 1.5, Number.NaN])('rejects %s', (weekStartsOn) => {
    try {
      startOf(WEDNESDAY, 'week', { weekStartsOn: weekStartsOn as WeekDay });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as TimeSolverError).code).toBe('INVALID_ARGUMENT');
      expect((error as TimeSolverError).message).toMatch(
        /weekStartsOn must be an integer from 0 \(Sunday\) to 6 \(Saturday\)/,
      );
    }
  });

  it('rejects a non-number', () => {
    expect(() =>
      endOf(WEDNESDAY, 'week', { weekStartsOn: '1' as unknown as WeekDay }),
    ).toThrowError(/weekStartsOn must be an integer/);
  });
});
