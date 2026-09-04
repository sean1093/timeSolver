import { describe, expect, it } from 'vitest';
import type { TimeSolverError } from '../src/errors.js';
import { getString } from '../src/format.js';
import { type Bounds, clamp, isBetween, max, min } from '../src/range.js';

const MARCH = '2024-03-01T00:00';
const APRIL = '2024-04-01T00:00';

describe('isBetween', () => {
  it('includes both endpoints by default', () => {
    expect(isBetween(MARCH, MARCH, APRIL)).toBe(true);
    expect(isBetween(APRIL, MARCH, APRIL)).toBe(true);
    expect(isBetween('2024-03-15T12:00', MARCH, APRIL)).toBe(true);
  });

  it('excludes dates outside the range', () => {
    expect(isBetween('2024-02-29T23:59:59.999', MARCH, APRIL)).toBe(false);
    expect(isBetween('2024-04-01T00:00:00.001', MARCH, APRIL)).toBe(false);
  });

  it.each([
    ['[]', true, true],
    ['[)', true, false],
    ['(]', false, true],
    ['()', false, false],
  ] as const)('reads %s as start=%s end=%s', (bounds, startInside, endInside) => {
    expect(isBetween(MARCH, MARCH, APRIL, undefined, bounds)).toBe(startInside);
    expect(isBetween(APRIL, MARCH, APRIL, undefined, bounds)).toBe(endInside);
    expect(isBetween('2024-03-15T12:00', MARCH, APRIL, undefined, bounds)).toBe(true);
  });

  it('makes back-to-back half-open ranges neither overlap nor gap', () => {
    const may = '2024-05-01T00:00';

    expect(isBetween(APRIL, MARCH, APRIL, undefined, '[)')).toBe(false);
    expect(isBetween(APRIL, APRIL, may, undefined, '[)')).toBe(true);
  });

  it('compares at the given unit', () => {
    // 2024-03-31 is inside March, so a month-granularity test includes it even
    // though the instant is past the end date.
    expect(isBetween('2024-03-31T23:00', MARCH, '2024-03-15T00:00')).toBe(false);
    expect(isBetween('2024-03-31T23:00', MARCH, '2024-03-15T00:00', 'month')).toBe(true);
    expect(isBetween('2024-04-02T00:00', MARCH, '2024-03-15T00:00', 'month')).toBe(false);
  });

  it('honours the week boundary', () => {
    // 2024-03-10 is a Sunday, 2024-03-16 the Saturday after.
    expect(isBetween('2024-03-16T12:00', '2024-03-10T12:00', '2024-03-10T12:00', 'week')).toBe(
      true,
    );
    expect(
      isBetween('2024-03-16T12:00', '2024-03-10T12:00', '2024-03-10T12:00', 'week', '[]', {
        weekStartsOn: 1,
      }),
    ).toBe(false);
  });

  it('takes the same settings as one object', () => {
    // Reaching `bounds` positionally means writing `undefined` first, which is
    // what the docs' own examples had to do.
    expect(isBetween(APRIL, MARCH, APRIL, { bounds: '[)' })).toBe(
      isBetween(APRIL, MARCH, APRIL, undefined, '[)'),
    );
    expect(isBetween('2024-03-31T23:00', MARCH, '2024-03-15T00:00', { unit: 'month' })).toBe(true);
    expect(
      isBetween('2024-03-16T12:00', '2024-03-10T12:00', '2024-03-10T12:00', {
        unit: 'week',
        weekStartsOn: 1,
      }),
    ).toBe(false);
    expect(isBetween('2024-03-15T12:00', MARCH, APRIL, {})).toBe(true);
  });

  it('combines bounds, unit and week start in the grouped form', () => {
    // 2024-03-11 is a Monday, so with Monday starts its week runs to the 17th.
    const settings = { unit: 'week', bounds: '()', weekStartsOn: 1 } as const;

    expect(isBetween('2024-03-11T12:00', '2024-03-04T00:00', '2024-03-18T00:00', settings)).toBe(
      true,
    );
    expect(isBetween('2024-03-18T12:00', '2024-03-04T00:00', '2024-03-18T00:00', settings)).toBe(
      false,
    );
  });

  it('rejects unrecognised bounds in the grouped form too', () => {
    expect(() => isBetween(MARCH, MARCH, APRIL, { bounds: '><' as Bounds })).toThrowError(
      /bounds must be one of/,
    );
  });

  it('reads the range as given rather than reordering it', () => {
    expect(isBetween('2024-03-15T12:00', APRIL, MARCH)).toBe(false);
  });

  it.each(['[', ']', '><', '', '[]]'])('rejects the bounds %s', (bounds) => {
    try {
      isBetween(MARCH, MARCH, APRIL, undefined, bounds as Bounds);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as TimeSolverError).code).toBe('INVALID_ARGUMENT');
      expect((error as TimeSolverError).message).toMatch(/bounds must be one of/);
    }
  });

  it('does not resolve inherited object keys as bounds', () => {
    expect(() => isBetween(MARCH, MARCH, APRIL, undefined, 'constructor' as Bounds)).toThrowError(
      /bounds must be one of/,
    );
  });

  it('throws for unreadable input', () => {
    expect(() => isBetween('nope', MARCH, APRIL)).toThrowError(/Cannot read a date/);
    expect(() => isBetween(MARCH, 'nope', APRIL)).toThrowError(/Cannot read a date/);
  });
});

describe('min and max', () => {
  const dates = ['2024-03-17T00:00', '2024-01-01T00:00', '2024-12-31T00:00'] as const;

  it('finds the extremes', () => {
    expect(getString(min(...dates), 'YYYY-MM-DD')).toBe('2024-01-01');
    expect(getString(max(...dates), 'YYYY-MM-DD')).toBe('2024-12-31');
  });

  it('works with a single date', () => {
    expect(min('2024-03-17T00:00').getTime()).toBe(max('2024-03-17T00:00').getTime());
  });

  it('accepts mixed input types', () => {
    const epoch = new Date(0);

    expect(min(epoch, '2024-01-01T00:00', 1_700_000_000_000).getTime()).toBe(0);
    expect(getString(max(epoch, '2024-01-01T00:00', 1_700_000_000_000), 'YYYY')).toBe('2024');
  });

  it('returns a copy, leaving the inputs untouched', () => {
    const early = new Date(2024, 0, 1);
    const late = new Date(2024, 11, 31);
    const result = min(early, late);

    expect(result).not.toBe(early);
    expect(result.getTime()).toBe(early.getTime());
  });

  it('keeps the first of equal dates', () => {
    const first = new Date(2024, 0, 1);
    const second = new Date(2024, 0, 1);

    expect(min(first, second).getTime()).toBe(first.getTime());
    expect(max(first, second).getTime()).toBe(first.getTime());
  });

  it('throws when any input is unreadable', () => {
    expect(() => min('2024-01-01T00:00', 'nope')).toThrowError(/Cannot read a date/);
    expect(() => max('nope')).toThrowError(/Cannot read a date/);
  });
});

describe('clamp', () => {
  const lower = '2024-01-01T00:00';
  const upper = '2024-03-01T00:00';

  it('returns the date when it is inside the range', () => {
    expect(getString(clamp('2024-02-01T00:00', lower, upper), 'YYYY-MM-DD')).toBe('2024-02-01');
  });

  it('returns the nearest endpoint when it is outside', () => {
    expect(getString(clamp('2023-06-01T00:00', lower, upper), 'YYYY-MM-DD')).toBe('2024-01-01');
    expect(getString(clamp('2024-06-01T00:00', lower, upper), 'YYYY-MM-DD')).toBe('2024-03-01');
  });

  it('accepts a Date, epoch milliseconds and a string in one call', () => {
    const inside = clamp(new Date(2024, 1, 1).getTime(), new Date(2024, 0, 1), '2024-03-01T00:00');
    const below = clamp('2023-06-01T00:00', new Date(2024, 0, 1).getTime(), upper);

    expect(getString(inside, 'YYYY-MM-DD')).toBe('2024-02-01');
    expect(getString(below, 'YYYY-MM-DD')).toBe('2024-01-01');
  });

  it('is idempotent', () => {
    const once = clamp('2024-06-01T00:00', lower, upper);
    const twice = clamp(once, lower, upper);

    expect(twice.getTime()).toBe(once.getTime());
  });

  it('accepts a range of one instant', () => {
    expect(clamp('2024-06-01T00:00', lower, lower).getTime()).toBe(
      new Date('2024-01-01T00:00').getTime(),
    );
  });

  it('rejects a reversed range rather than swapping it', () => {
    try {
      clamp('2024-02-01T00:00', upper, lower);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as TimeSolverError).code).toBe('INVALID_ARGUMENT');
      expect((error as TimeSolverError).message).toMatch(/clamp needs lower <= upper/);
    }
  });

  it('throws for unreadable input', () => {
    expect(() => clamp('nope', lower, upper)).toThrowError(/Cannot read a date/);
  });
});
