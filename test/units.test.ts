import { describe, expect, it } from 'vitest';
import { TimeSolverError } from '../src/errors.js';
import { isExactUnit, normalizeUnit, UNITS } from '../src/units.js';

describe('normalizeUnit', () => {
  it('defaults to millisecond when no unit is given, as v1 did', () => {
    expect(normalizeUnit()).toBe('millisecond');
  });

  it.each([
    ['MILLISECOND', 'millisecond'],
    ['MILL', 'millisecond'],
    ['ms', 'millisecond'],
    ['SECOND', 'second'],
    ['S', 'second'],
    ['MINUTE', 'minute'],
    ['MIN', 'minute'],
    ['HOUR', 'hour'],
    ['H', 'hour'],
    ['DAY', 'day'],
    ['D', 'day'],
    ['WEEK', 'week'],
    ['W', 'week'],
    ['MONTH', 'month'],
    ['M', 'month'],
    ['QUARTER', 'quarter'],
    ['Q', 'quarter'],
    ['YEAR', 'year'],
    ['Y', 'year'],
  ])('resolves %s to %s', (alias, expected) => {
    expect(normalizeUnit(alias)).toBe(expected);
  });

  it.each([
    ['mills', 'millisecond'],
    ['MSECS', 'millisecond'],
    ['secs', 'second'],
    ['MINS', 'minute'],
    ['hrs', 'hour'],
    ['mons', 'month'],
    ['YRS', 'year'],
  ])('resolves the plural abbreviation %s to %s', (alias, expected) => {
    // The table accepted a plural for every full name and for none of the
    // abbreviations, while the README invited readers to combine the two rules.
    expect(normalizeUnit(alias)).toBe(expected);
  });

  it('still refuses a plural nobody writes', () => {
    expect(() => normalizeUnit('ds')).toThrowError(TimeSolverError);
    expect(() => normalizeUnit('ws')).toThrowError(TimeSolverError);
  });

  it('is case-insensitive', () => {
    expect(normalizeUnit('Day')).toBe('day');
    expect(normalizeUnit('dAyS')).toBe('day');
  });

  it('throws INVALID_UNIT for an unknown alias instead of returning it', () => {
    expect(() => normalizeUnit('fortnight')).toThrowError(TimeSolverError);
    try {
      normalizeUnit('fortnight');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TimeSolverError);
      expect((error as TimeSolverError).code).toBe('INVALID_UNIT');
    }
  });

  it('does not resolve inherited object keys', () => {
    // A plain object lookup would have returned Object.prototype.constructor.
    expect(() => normalizeUnit('constructor')).toThrowError(/Unknown time unit/);
    expect(() => normalizeUnit('toString')).toThrowError(/Unknown time unit/);
  });

  it('rejects non-string units', () => {
    expect(() => normalizeUnit(7 as unknown as string)).toThrowError(/Unknown time unit/);
  });
});

describe('isExactUnit', () => {
  it('treats only sub-day units as fixed length', () => {
    expect(isExactUnit('millisecond')).toBe(true);
    expect(isExactUnit('hour')).toBe(true);
  });

  it('excludes day and week, which follow the local calendar', () => {
    expect(isExactUnit('day')).toBe(false);
    expect(isExactUnit('week')).toBe(false);
    expect(isExactUnit('month')).toBe(false);
    expect(isExactUnit('year')).toBe(false);
  });
});

describe('UNITS', () => {
  it('lists the nine canonical units from finest to coarsest', () => {
    expect(UNITS).toEqual([
      'millisecond',
      'second',
      'minute',
      'hour',
      'day',
      'week',
      'month',
      'quarter',
      'year',
    ]);
  });
});
