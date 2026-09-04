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

  it('carries the sign on years before 1 CE', () => {
    // Padding the raw string rendered -1 as '00-1'.
    const bce = new Date(2024, 0, 5);
    bce.setFullYear(-1);

    expect(getString(bce, 'YYYY-MM-DD')).toBe('-0001-01-05');
    expect(getString(bce, 'YY')).toBe('-01');
  });

  it('renders years beyond four digits without truncating', () => {
    const far = new Date(2024, 0, 5);
    far.setFullYear(12345);

    expect(getString(far, 'YYYY-MM-DD')).toBe('12345-01-05');
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

  it.each([
    ['YYYY[[]', '2024['],
    ['[[]YYYY', '[2024'],
    ['YYYY[]]]', '2024]'],
    ['[a]]b]', 'a]b'],
    ['[[]]]', '[]'],
    ['[[]YYYY[]]]', '[2024]'],
  ])('renders the escaped brackets in %s as %s', (format, expected) => {
    // Inside an escape `]]` is a literal `]`, and `[` needs no doubling because
    // it cannot close one. Before that rule there was no way to render either
    // delimiter at all.
    expect(getString(SAMPLE, format)).toBe(expected);
  });

  it('still refuses a bracket that opens or closes nothing', () => {
    for (const format of ['YYYY]', 'YYYY[MM', '[unclosed YYYY', 'YYYY]]']) {
      expect(() => getString(SAMPLE, format)).toThrowError(/unmatched square bracket/);
    }
  });

  it('accepts any date input', () => {
    expect(getString('2024-03-17T18:30:45.123Z', 'YYYY-MM-DD HH:mm')).toBe('2024-03-17 14:30');
    expect(getString(SAMPLE.getTime(), 'YYYY')).toBe('2024');
  });

  it.each([
    ['YYYYMD', 'M', 'D'],
    ['MD', 'M', 'D'],
    ['YYYY-M-DHH', 'D', 'HH'],
    ['sQ', 's', 'Q'],
    ['H:m:sSSS', 's', 'SSS'],
  ])('rejects the ambiguous format %s, where %s runs into %s', (format, first, second) => {
    // Rendering 12 January 2024 with 'YYYYMD' emits '2024112', which reads
    // equally well as month 11 day 2, so the format is refused outright rather
    // than producing output the same grammar cannot read back. The message has
    // to name both sides: "is ambiguous" alone would not tell a caller which
    // pair to separate.
    expect(() => getString(SAMPLE, format)).toThrowError(
      new RegExp(`"${first}" matches one or two digits and runs straight into "${second}"`),
    );
  });

  it.each([
    ['M0M', 'M', '0'],
    ['D01', 'D', '0'],
    ['H:m:s9', 's', '9'],
    ['M[0]D', 'M', '0'],
  ])('rejects %s, where %s runs into the digit literal %s', (format, token, digit) => {
    // `'M0M'` compiles to `^(\d{1,2})0(\d{1,2})$`: every group has two viable
    // widths at every position, so a run of digits that does not match costs
    // exponential time. A digit is a digit whether it arrives as a token or as
    // literal text, and the message names the one that collided -- the first
    // character of the literal, not the whole of it.
    expect(() => getString(SAMPLE, format)).toThrowError(
      new RegExp(
        `"${token}" matches one or two digits and runs straight into the digit "${digit}"`,
      ),
    );
  });

  it.each([
    'YYYY-M-D',
    'YYYY M D H:m:s',
    'YYYYMMDD',
    'MMDDYYYY',
    'MM/DD/YYYY hh:mm:ss.SSS A',
    'D MMM YYYY',
    'M[/]D',
    'DA',
    'hZ',
  ])('accepts %s, where every variable-width token is separated', (format) => {
    expect(() => getString(SAMPLE, format)).not.toThrow();
  });

  it.each(['M-0', 'YYYY0MM', 'MM0DD', '[0]M', 'M[ ]0'])(
    'accepts %s, where no variable-width token touches a digit',
    (format) => {
      expect(() => getString(SAMPLE, format)).not.toThrow();
    },
  );
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
