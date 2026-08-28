import { describe, expect, it } from 'vitest';
import * as namespace from '../src/index.js';
import {
  add,
  after,
  between,
  equal,
  getAbbrMonth,
  getAbbrWeek,
  getFullWeek,
  getString,
  isValid,
} from '../src/index.js';

/**
 * One test per defect reproduced against v1 in
 * docs/specs/2026-08-28-v2-renovation-design.md, section 1.3. Each name states
 * what v1 did, so a regression is obvious from the failure output alone.
 */
describe('v1 defects', () => {
  it('1. add no longer mutates the caller Date', () => {
    const input = new Date('2020-01-01T00:00:00.000Z');

    const result = add(input, 1, 'D');

    expect(input.toISOString()).toBe('2020-01-01T00:00:00.000Z');
    expect(result.toISOString()).toBe('2020-01-02T00:00:00.000Z');
    expect(result).not.toBe(input);
  });

  it('2. equal no longer ignores milliseconds', () => {
    expect(equal('2020-01-01T00:00:00.001Z', '2020-01-01T00:00:00.999Z')).toBe(false);
  });

  it('3. between reports whole months instead of average-length months', () => {
    expect(between('2020-01-01T00:00:00Z', '2020-02-01T00:00:00Z', 'M')).toBe(1);
  });

  it('4. between reports whole years instead of average-length years', () => {
    expect(between('2020-01-01T00:00:00Z', '2021-01-01T00:00:00Z', 'Y')).toBe(1);
  });

  it('5. isValid accepts a real leap day', () => {
    expect(isValid('2020-02-29', 'YYYY-MM-DD')).toBe(true);
    expect(isValid('2024-02-29', 'YYYY/MM/DD'.replace(/\//g, '-'))).toBe(true);
  });

  it('6. isValid rejects a day the month does not have', () => {
    expect(isValid('31-02-2020', 'DD-MM-YYYY')).toBe(false);
    expect(isValid('31/02/2020', 'DD/MM/YYYY')).toBe(false);
    expect(isValid('31.02.2020', 'DD.MM.YYYY')).toBe(false);
  });

  it('7. isValid handles a time-only string', () => {
    expect(isValid('12:30:00', 'HH:MM:SS')).toBe(true);
    expect(isValid('12:30:00.123', 'HH:MM:SS.SSS')).toBe(true);
  });

  it('8. after honours the unit argument', () => {
    expect(after('2020-01-01T23:00:00Z', '2020-01-01T01:00:00Z', 'H')).toBe(true);
    expect(after(new Date(2020, 0, 1, 23, 0, 0), new Date(2020, 0, 1, 1, 0, 0), 'D')).toBe(false);
  });

  it('9. invalid input throws a typed error instead of logging and returning null', () => {
    expect(() => getFullWeek('nope')).toThrowError(/\[timeSolver\] Cannot read a date/);
    expect(() => equal('nope', 'nope')).toThrowError(/\[timeSolver\] Cannot read a date/);
  });

  it('10. getString throws instead of returning an error string', () => {
    expect(() => getString(new Date(), '!!!')).toThrowError(/\[timeSolver\]/);
    // v1 could not render this format at all and returned an error string.
    expect(getString(new Date(2024, 2, 17), 'DD MMM YYYY')).toBe('17 Mar 2024');
  });

  it('11. weekday and month abbreviations come from a fixed table', () => {
    // v1 sliced Date#toString(), whose text is engine and locale dependent.
    expect(getAbbrWeek(new Date(2024, 2, 18))).toBe('Mon');
    expect(getAbbrMonth(new Date(2024, 0, 1))).toBe('Jan');
  });
});

describe('v1 packaging defects', () => {
  it('the entry point exports a populated namespace', () => {
    // v1's src/index.js assigned to module.exports/window under type: module,
    // so both were undefined and the namespace came out empty.

    expect(Object.keys(namespace).length).toBeGreaterThan(20);
    expect(typeof namespace.default).toBe('object');
    expect(typeof namespace.add).toBe('function');
  });
});
