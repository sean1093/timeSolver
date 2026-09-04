import { describe, expect, it } from 'vitest';
import { between } from '../src/compare.js';
import { TimeSolverError } from '../src/errors.js';
import { getString } from '../src/format.js';
import { add } from '../src/manipulate.js';
import { isValid, parse } from '../src/parse.js';

/**
 * `docs/support.md` promises that error **codes** are part of the API while
 * message text is not. That promise is only worth anything if every throw site
 * is pinned to its code, so these assertions cover each one by hand rather than
 * relying on a message match.
 *
 * Mutation testing is what motivated this file: replacing a code literal with an
 * empty string survived, because the tests that reached those throw sites only
 * matched on the message.
 */
function codeOf(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    if (error instanceof TimeSolverError) {
      return error.code;
    }
    return `NOT_A_TIMESOLVER_ERROR: ${String(error)}`;
  }
  return 'NO_THROW';
}

describe('INVALID_DATE', () => {
  it.each([
    ['an unreadable string', () => getString('nonsense', 'YYYY')],
    ['null', () => getString(null as unknown as string, 'YYYY')],
    ['an Invalid Date', () => getString(new Date('nope'), 'YYYY')],
    ['a number out of range', () => getString(8.64e15 + 1, 'YYYY')],
    ['input that does not match the format', () => parse('nope', 'YYYY-MM-DD')],
    ['a date that cannot exist', () => parse('2021-02-29', 'YYYY-MM-DD')],
    ['a weekday that disagrees', () => parse('2024-03-17 Monday', 'YYYY-MM-DD dddd')],
    ['padding that does not match', () => parse('2024-03-07', 'YYYY-M-D')],
  ])('is the code for %s', (_label, run) => {
    expect(codeOf(run)).toBe('INVALID_DATE');
  });
});

describe('INVALID_UNIT', () => {
  it.each([
    ['an unknown alias', () => add(new Date(), 1, 'fortnight')],
    ['an inherited object key', () => add(new Date(), 1, 'constructor')],
    ['a non-string unit', () => between(new Date(), new Date(), 7 as unknown as string)],
  ])('is the code for %s', (_label, run) => {
    expect(codeOf(run)).toBe('INVALID_UNIT');
  });
});

describe('INVALID_FORMAT', () => {
  it.each([
    ['a non-string format', () => getString(new Date(), 42 as unknown as string)],
    ['an empty format', () => getString(new Date(), '')],
    ['a format with no tokens', () => getString(new Date(), '###')],
    ['an unmatched opening bracket', () => getString(new Date(), '[oops YYYY')],
    ['an unmatched closing bracket', () => getString(new Date(), 'YYYY]')],
    ['adjacent variable-width tokens', () => getString(new Date(), 'YYYYMD')],
    ['more tokens than a matcher holds', () => parse('2024', 'YYYY'.repeat(513))],
    ['a malformed format in isValid', () => isValid('anything', '###')],
  ])('is the code for %s', (_label, run) => {
    expect(codeOf(run)).toBe('INVALID_FORMAT');
  });
});

describe('INVALID_ARGUMENT', () => {
  it.each([
    ['a non-finite amount', () => add(new Date(), Number.NaN, 'day')],
    ['a fractional calendar amount', () => add(new Date(), 1.5, 'month')],
    ['a shift out of the representable range', () => add(new Date(), 1e9, 'day')],
    ['a non-string parse input', () => parse(42 as unknown as string, 'YYYY')],
  ])('is the code for %s', (_label, run) => {
    expect(codeOf(run)).toBe('INVALID_ARGUMENT');
  });
});

describe('every error is a TimeSolverError', () => {
  it('never leaks a bare Error or TypeError', () => {
    const runs: Array<() => unknown> = [
      () => getString('nonsense', 'YYYY'),
      () => getString(new Date(), '###'),
      () => parse('nope', 'YYYY-MM-DD'),
      () => add(new Date(), 1, 'fortnight'),
      () => add(new Date(), 1.5, 'year'),
    ];

    for (const run of runs) {
      expect(codeOf(run)).not.toMatch(/NOT_A_TIMESOLVER_ERROR|NO_THROW/);
    }
  });
});
