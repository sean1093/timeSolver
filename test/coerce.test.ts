import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { toDate } from '../src/coerce.js';
import { TimeSolverError } from '../src/errors.js';

function codeOf(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    return error instanceof TimeSolverError ? error.code : 'NOT_A_TIMESOLVER_ERROR';
  }
  return 'NO_THROW';
}

describe('toDate', () => {
  it('returns a copy, never the caller instance', () => {
    const original = new Date(2024, 2, 17);
    const copy = toDate(original);

    expect(copy).not.toBe(original);
    expect(copy.getTime()).toBe(original.getTime());
  });

  it('accepts a Date from another realm, where instanceof fails', () => {
    // The browser equivalent is a Date handed over from an iframe or a worker.
    const foreign: unknown = vm.runInNewContext('new Date(1700000000000)');

    expect(foreign instanceof Date).toBe(false);
    expect(toDate(foreign as Date).getTime()).toBe(1_700_000_000_000);
  });

  it('rejects an Invalid Date from another realm', () => {
    const foreign: unknown = vm.runInNewContext('new Date("nope")');

    expect(codeOf(() => toDate(foreign as Date))).toBe('INVALID_DATE');
    expect(() => toDate(foreign as Date)).toThrowError('Cannot read a date from an Invalid Date');
  });

  it('accepts epoch milliseconds', () => {
    expect(toDate(0).getTime()).toBe(0);
    expect(toDate(1_700_000_000_000).getTime()).toBe(1_700_000_000_000);
  });

  it('accepts strings Date can parse', () => {
    expect(toDate('2024-03-17T00:00:00.000Z').toISOString()).toBe('2024-03-17T00:00:00.000Z');
  });

  it.each([
    ['an unparseable string', 'not-a-date'],
    ['an Invalid Date', new Date('nope')],
    ['a millisecond count beyond the Date range', 8.64e15 + 1],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('throws INVALID_DATE for %s', (_label, input) => {
    expect(codeOf(() => toDate(input as never))).toBe('INVALID_DATE');
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a plain object', {}],
    ['a boolean', true],
  ])('throws INVALID_DATE for %s rather than silently using the epoch', (_label, input) => {
    // v1 turned `null` into 1970-01-01 through `new Date(null)`.
    expect(codeOf(() => toDate(input as never))).toBe('INVALID_DATE');
  });

  it('names the offending value in the message', () => {
    expect(() => toDate('nope')).toThrowError('Cannot read a date from "nope"');
    expect(() => toDate(null as never)).toThrowError('Cannot read a date from null');
    expect(() => toDate(new Date('nope'))).toThrowError('Cannot read a date from an Invalid Date');
    expect(() => toDate({} as never)).toThrowError('Cannot read a date from object');
    expect(() => toDate(Number.NaN)).toThrowError('Cannot read a date from NaN');
  });
});
