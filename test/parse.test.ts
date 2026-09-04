import { describe, expect, it } from 'vitest';
import { TimeSolverError } from '../src/errors.js';
import { getString } from '../src/format.js';
import { isValid, parse } from '../src/parse.js';

describe('parse', () => {
  it('reads a date in the host time zone', () => {
    const parsed = parse('17/03/2024', 'DD/MM/YYYY');

    expect(parsed.getFullYear()).toBe(2024);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(17);
    expect(parsed.getHours()).toBe(0);
    expect(parsed.getMilliseconds()).toBe(0);
  });

  it('reads a full timestamp', () => {
    const parsed = parse('2024-03-17 14:30:45.123', 'YYYY-MM-DD HH:mm:ss.SSS');

    expect(getString(parsed, 'YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-03-17 14:30:45.123');
  });

  it('defaults missing components to 1970-01-01T00:00:00.000', () => {
    const parsed = parse('12:30:00', 'HH:mm:ss');

    expect(parsed.getFullYear()).toBe(1970);
    expect(parsed.getMonth()).toBe(0);
    expect(parsed.getDate()).toBe(1);
    expect(parsed.getHours()).toBe(12);
  });

  it('reads month names and abbreviations', () => {
    expect(getString(parse('17 March 2024', 'DD MMMM YYYY'), 'YYYY-MM-DD')).toBe('2024-03-17');
    expect(getString(parse('17 Mar 2024', 'DD MMM YYYY'), 'YYYY-MM-DD')).toBe('2024-03-17');
  });

  it('combines 12-hour tokens with a meridiem', () => {
    expect(getString(parse('03/17/2024 02:30 PM', 'MM/DD/YYYY hh:mm A'), 'HH:mm')).toBe('14:30');
    expect(getString(parse('03/17/2024 12:30 am', 'MM/DD/YYYY hh:mm a'), 'HH:mm')).toBe('00:30');
    expect(getString(parse('03/17/2024 02:30 AM', 'MM/DD/YYYY hh:mm A'), 'HH:mm')).toBe('02:30');
  });

  it('pivots two-digit years at 69, as POSIX does', () => {
    expect(parse('68-01-01', 'YY-MM-DD').getFullYear()).toBe(2068);
    expect(parse('69-01-01', 'YY-MM-DD').getFullYear()).toBe(1969);
  });

  it('reads unpadded hour, minute and second tokens', () => {
    expect(getString(parse('2024-3-7 9:8:7', 'YYYY-M-D H:m:s'), 'YYYY-MM-DD HH:mm:ss')).toBe(
      '2024-03-07 09:08:07',
    );
    expect(getString(parse('2024-3-7 9:8 pm', 'YYYY-M-D h:m a'), 'HH:mm')).toBe('21:08');
  });

  it('accepts a real leap day', () => {
    expect(getString(parse('2020-02-29', 'YYYY-MM-DD'), 'YYYY-MM-DD')).toBe('2020-02-29');
  });

  it.each([
    ['31/02/2024', 'DD/MM/YYYY', 'a day that month does not have'],
    ['2021-02-29', 'YYYY-MM-DD', 'a leap day in a common year'],
    ['2024-13-01', 'YYYY-MM-DD', 'month 13'],
    ['2024-00-10', 'YYYY-MM-DD', 'month 0'],
    ['2024-03-32', 'YYYY-MM-DD', 'day 32'],
    ['2024-03-17 25:00:00', 'YYYY-MM-DD HH:mm:ss', 'hour 25'],
    ['2024-03-17 14:60:00', 'YYYY-MM-DD HH:mm:ss', 'minute 60'],
  ])('rejects %s against %s (%s)', (input, format) => {
    expect(() => parse(input, format)).toThrowError(TimeSolverError);
  });

  it('rejects a weekday name that disagrees with the date', () => {
    // 2024-03-17 is a Sunday.
    expect(getString(parse('2024-03-17 Sunday', 'YYYY-MM-DD dddd'), 'YYYY-MM-DD')).toBe(
      '2024-03-17',
    );
    expect(() => parse('2024-03-17 Monday', 'YYYY-MM-DD dddd')).toThrowError(/not a real date/);
  });

  it('rejects a quarter that disagrees with the date', () => {
    expect(() => parse('2024-03-17 Q3', 'YYYY-MM-DD [Q]Q')).toThrowError(/not a real date/);
    expect(getString(parse('2024-03-17 Q1', 'YYYY-MM-DD [Q]Q'), 'MM')).toBe('03');
  });

  it('rejects padding that does not match the token width', () => {
    expect(getString(parse('2024-3-7', 'YYYY-M-D'), 'YYYY-MM-DD')).toBe('2024-03-07');
    expect(() => parse('2024-03-07', 'YYYY-M-D')).toThrowError(/not a real date/);
    expect(() => parse('2024-3-7', 'YYYY-MM-DD')).toThrowError(/does not match format/);
  });

  it('rejects the wrong separator', () => {
    expect(() => parse('17-03-2024', 'DD/MM/YYYY')).toThrowError(/does not match format/);
  });

  it('rejects trailing and leading text', () => {
    expect(() => parse('2024-03-17 ', 'YYYY-MM-DD')).toThrowError(/does not match format/);
    expect(() => parse(' 2024-03-17', 'YYYY-MM-DD')).toThrowError(/does not match format/);
    expect(() => parse('2024-03-17T00:00', 'YYYY-MM-DD')).toThrowError(/does not match format/);
  });

  it('rejects a non-string input', () => {
    try {
      parse(42 as unknown as string, 'YYYY');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as TimeSolverError).code).toBe('INVALID_ARGUMENT');
    }
  });

  it('rejects offset tokens, which describe a zone this library does not model', () => {
    try {
      parse('2024-03-17 -04:00', 'YYYY-MM-DD Z');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as TimeSolverError).code).toBe('INVALID_FORMAT');
      expect((error as TimeSolverError).message).toMatch(/formatted but not parsed/);
    }
  });

  it('compiles a format at the 512-token limit', () => {
    // A matcher is one capture group per token, and V8 gives up on a pattern
    // with thousands of them -- as a raw SyntaxError, which carries no code.
    const format = 'YYYY'.repeat(512);
    const input = '2024'.repeat(512);

    expect(getString(parse(input, format), 'YYYY')).toBe('2024');
    expect(isValid(input, format)).toBe(true);
  });

  it('refuses one token past the limit, as INVALID_FORMAT', () => {
    const format = 'YYYY'.repeat(513);
    const input = '2024'.repeat(513);

    expect(() => parse(input, format)).toThrowError(/limited to 512 tokens/);
    expect(() => isValid(input, format)).toThrowError(/limited to 512 tokens/);
  });

  it('keeps the code on a refused oversized format', () => {
    try {
      parse('x', 'YYYY'.repeat(5000));
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TimeSolverError);
      expect((error as TimeSolverError).code).toBe('INVALID_FORMAT');
    }
  });

  it('still renders a format too long to parse', () => {
    // getString builds no matcher, so the cap does not apply to it.
    expect(getString(new Date(2024, 0, 1), 'YYYY'.repeat(300))).toHaveLength(1200);
  });

  it('round-trips every date it accepts', () => {
    const format = 'YYYY-MM-DD HH:mm:ss.SSS';

    for (const iso of ['2024-01-01', '2024-02-29', '2024-06-15', '2024-11-03', '2024-12-31']) {
      const rendered = getString(`${iso}T08:09:10.011`, format);
      expect(getString(parse(rendered, format), format)).toBe(rendered);
    }
  });

  it('round-trips a literal bracket', () => {
    const format = '[[]YYYY-MM-DD[]]]';

    expect(getString(new Date(2024, 2, 17), format)).toBe('[2024-03-17]');
    expect(getString(parse('[2024-03-17]', format), 'YYYY-MM-DD')).toBe('2024-03-17');
    expect(isValid('[2024-03-17]', format)).toBe(true);
    expect(isValid('2024-03-17', format)).toBe(false);
  });
});

describe('isValid without a format', () => {
  it.each(['2020-01-01', '2020/01/01', '2024-03-17T14:30:45.123Z'])('accepts %s', (input) => {
    expect(isValid(input)).toBe(true);
  });

  it.each(['nope', ''])('rejects %s', (input) => {
    expect(isValid(input)).toBe(false);
  });

  it('rejects an Invalid Date object', () => {
    expect(isValid(new Date('nope'))).toBe(false);
  });

  it('accepts epoch milliseconds and Date instances', () => {
    expect(isValid(0)).toBe(true);
    expect(isValid(new Date())).toBe(true);
  });
});

describe('isValid with a format', () => {
  it.each([
    ['2020-02-29', 'YYYY-MM-DD', true],
    ['2021-02-29', 'YYYY-MM-DD', false],
    ['31-02-2020', 'DD-MM-YYYY', false],
    ['29-02-2020', 'DD-MM-YYYY', true],
    ['12:30:00', 'HH:MM:SS', true],
    ['25:30:00', 'HH:MM:SS', false],
    ['17/03/2024', 'DD/MM/YYYY', true],
    ['32/01/2024', 'DD/MM/YYYY', false],
    ['15/13/2024', 'DD/MM/YYYY', false],
    ['17-03-2024', 'DD/MM/YYYY', false],
    ['17/03/2024 14:30:45', 'DD/MM/YYYY HH:MM:SS', true],
    ['17/03/2024 25:00:00', 'DD/MM/YYYY HH:MM:SS', false],
  ])('reports %s against %s as %s', (input, format, expected) => {
    expect(isValid(input, format)).toBe(expected);
  });

  it('never throws for bad data', () => {
    expect(isValid('garbage', 'YYYY-MM-DD')).toBe(false);
    expect(isValid(42 as unknown as string, 'YYYY')).toBe(false);
    expect(isValid(new Date(), 'YYYY')).toBe(false);
  });

  it('does throw for a malformed format, which is a caller bug rather than bad data', () => {
    try {
      isValid('anything', '!!!');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as TimeSolverError).code).toBe('INVALID_FORMAT');
    }
  });
});
