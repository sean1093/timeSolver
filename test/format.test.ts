import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_FORMAT, getString } from '../src/format.js';

// Sunday, 17 March 2024, 14:30:45.123 local time. The pinned test zone is
// America/New_York, which is on EDT (UTC-4) by that date.
const SAMPLE = new Date(2024, 2, 17, 14, 30, 45, 123);

describe('getString tokens', () => {
  it.each([
    ['YYYY', '2024'],
    ['YY', '24'],
    ['MMMM', 'March'],
    ['MMM', 'Mar'],
    ['MM', '03'],
    ['M', '3'],
    ['DD', '17'],
    ['D', '17'],
    ['dddd', 'Sunday'],
    ['ddd', 'Sun'],
    ['HH', '14'],
    ['H', '14'],
    ['hh', '02'],
    ['h', '2'],
    ['mm', '30'],
    ['m', '30'],
    ['ss', '45'],
    ['s', '45'],
    ['SSS', '123'],
    ['A', 'PM'],
    ['a', 'pm'],
    ['Q', '1'],
    ['Z', '-04:00'],
    ['ZZ', '-0400'],
  ])('renders %s as %s', (format, expected) => {
    expect(getString(SAMPLE, format)).toBe(expected);
  });

  it('renders single-digit fields unpadded for lowercase-width tokens', () => {
    const early = new Date(2024, 0, 5, 9, 8, 7, 6);

    expect(getString(early, 'M/D H:m:s.SSS')).toBe('1/5 9:8:7.006');
    expect(getString(early, 'MM/DD HH:mm:ss')).toBe('01/05 09:08:07');
  });

  it('renders midnight and noon in 12-hour form', () => {
    expect(getString(new Date(2024, 2, 17, 0, 5), 'hh:mm A')).toBe('12:05 AM');
    expect(getString(new Date(2024, 2, 17, 12, 5), 'hh:mm A')).toBe('12:05 PM');
    expect(getString(new Date(2024, 2, 17, 23, 5), 'h:mm a')).toBe('11:05 pm');
  });

  it('pads years to four digits', () => {
    const early = new Date(2024, 0, 1);
    early.setFullYear(999);

    expect(getString(early, 'YYYY')).toBe('0999');
  });

  it('reports the zone offset on both sides of a daylight-saving change', () => {
    expect(getString(new Date(2024, 0, 15, 12), 'Z')).toBe('-05:00');
    expect(getString(new Date(2024, 6, 15, 12), 'Z')).toBe('-04:00');
  });

  it('renders offsets east of UTC with a plus sign', () => {
    // The suite is pinned to a zone west of UTC, so the sign is stubbed here
    // rather than by switching TZ mid-run.
    const offset = vi.spyOn(Date.prototype, 'getTimezoneOffset');

    offset.mockReturnValue(-480);
    expect(getString(SAMPLE, 'Z')).toBe('+08:00');
    expect(getString(SAMPLE, 'ZZ')).toBe('+0800');

    offset.mockReturnValue(0);
    expect(getString(SAMPLE, 'Z')).toBe('+00:00');

    offset.mockReturnValue(330);
    expect(getString(SAMPLE, 'Z')).toBe('-05:30');

    offset.mockRestore();
  });
});

describe('getString composition', () => {
  it('defaults to the v1 format', () => {
    expect(DEFAULT_FORMAT).toBe('YYYYMMDD');
    expect(getString(SAMPLE)).toBe('20240317');
  });

  it('keeps literal separators', () => {
    expect(getString(SAMPLE, 'YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-03-17 14:30:45.123');
    expect(getString(SAMPLE, 'ddd, D MMM YYYY')).toBe('Sun, 17 Mar 2024');
  });

  it('escapes literal text in square brackets', () => {
    expect(getString(SAMPLE, '[Day] D [of] MMMM')).toBe('Day 17 of March');
  });

  it('drops empty escapes', () => {
    expect(getString(SAMPLE, 'YYYY[]MM')).toBe('202403');
  });

  it('accepts any date input', () => {
    expect(getString('2024-03-17T18:30:45.123Z', 'YYYY-MM-DD HH:mm')).toBe('2024-03-17 14:30');
    expect(getString(SAMPLE.getTime(), 'YYYY')).toBe('2024');
  });
});

describe('getString failures', () => {
  it('throws INVALID_FORMAT for a format with no tokens instead of returning an error string', () => {
    // v1 returned the string '[timeSolver] Input Type Error'.
    expect(() => getString(SAMPLE, '!!!')).toThrowError(/contains no format tokens/);
  });

  it('throws INVALID_FORMAT for an empty format', () => {
    expect(() => getString(SAMPLE, '')).toThrowError(/Format string is empty/);
  });

  it.each(['[unclosed YYYY', 'YYYY]', 'YYYY[MM'])(
    'throws INVALID_FORMAT for the unbalanced bracket in %s',
    (format) => {
      expect(() => getString(SAMPLE, format)).toThrowError(/unmatched square bracket/);
    },
  );

  it('throws INVALID_FORMAT for a non-string format', () => {
    expect(() => getString(SAMPLE, 42 as unknown as string)).toThrowError(
      /Format must be a string/,
    );
  });

  it('throws INVALID_DATE for unreadable input', () => {
    expect(() => getString('nope', 'YYYY')).toThrowError(/Cannot read a date/);
  });
});
