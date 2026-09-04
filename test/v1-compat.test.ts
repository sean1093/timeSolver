import { describe, expect, it } from 'vitest';
import timeSolver, { add, getString, isValid, subtract } from '../src/index.js';

// Sunday, 17 March 2024, 14:30:45.123 local time.
const SAMPLE = new Date(2024, 2, 17, 14, 30, 45, 123);

/**
 * Every format name v1 accepted, with the string v1 produced for SAMPLE. v1
 * used `MM` for both month and minute; v2 keeps these names working by
 * translating them to canonical tokens.
 */
const V1_FORMATS: ReadonlyArray<readonly [string, string]> = [
  ['YYYY', '2024'],
  ['YYYYMM', '202403'],
  ['YYYYMMDD', '20240317'],
  ['YYYY/MM/DD', '2024/03/17'],
  ['YYYY-MM-DD', '2024-03-17'],
  ['YYYY.MM.DD', '2024.03.17'],
  ['MMDDYYYY', '03172024'],
  ['DDMMYYYY', '17032024'],
  ['MM/DD/YYYY', '03/17/2024'],
  ['MM-DD-YYYY', '03-17-2024'],
  ['MM.DD.YYYY', '03.17.2024'],
  ['YYYY/MM/DD HH:MM:SS', '2024/03/17 14:30:45'],
  ['YYYY/MM/DD HH:MM:SS.SSS', '2024/03/17 14:30:45.123'],
  ['YYYY-MM-DD HH:MM:SS', '2024-03-17 14:30:45'],
  ['YYYY-MM-DD HH:MM:SS.SSS', '2024-03-17 14:30:45.123'],
  ['YYYY.MM.DD HH:MM:SS', '2024.03.17 14:30:45'],
  ['YYYY.MM.DD HH:MM:SS.SSS', '2024.03.17 14:30:45.123'],
  ['YYYYMMDD HH:MM:SS', '20240317 14:30:45'],
  ['YYYYMMDD HH:MM:SS.SSS', '20240317 14:30:45.123'],
  ['MM/DD/YYYY HH:MM:SS', '03/17/2024 14:30:45'],
  ['MM/DD/YYYY HH:MM:SS.SSS', '03/17/2024 14:30:45.123'],
  ['MM-DD-YYYY HH:MM:SS', '03-17-2024 14:30:45'],
  ['MM-DD-YYYY HH:MM:SS.SSS', '03-17-2024 14:30:45.123'],
  ['MM.DD.YYYY HH:MM:SS', '03.17.2024 14:30:45'],
  ['MM.DD.YYYY HH:MM:SS.SSS', '03.17.2024 14:30:45.123'],
  ['HH:MM:SS', '14:30:45'],
  ['HH:MM:SS.SSS', '14:30:45.123'],
  ['DD/MM/YYYY', '17/03/2024'],
  ['DD-MM-YYYY', '17-03-2024'],
  ['DD.MM.YYYY', '17.03.2024'],
  ['DD/MM/YYYY HH:MM:SS', '17/03/2024 14:30:45'],
  ['DD/MM/YYYY HH:MM:SS.SSS', '17/03/2024 14:30:45.123'],
  ['DD-MM-YYYY HH:MM:SS', '17-03-2024 14:30:45'],
  ['DD-MM-YYYY HH:MM:SS.SSS', '17-03-2024 14:30:45.123'],
  ['DD.MM.YYYY HH:MM:SS', '17.03.2024 14:30:45'],
  ['DD.MM.YYYY HH:MM:SS.SSS', '17.03.2024 14:30:45.123'],
];

describe('v1 format names', () => {
  it('covers all 36 legacy names the tokenizer accepts', () => {
    expect(V1_FORMATS).toHaveLength(36);
  });

  it.each(V1_FORMATS)('renders %s as %s', (format, expected) => {
    expect(getString(SAMPLE, format)).toBe(expected);
  });

  /**
   * The two time-only names are the only ones whose lower-case spelling is a v2
   * format in its own right: `'hh:mm:ss'` is 12-hour, minute, second. The
   * tokens win there, so those two are asserted separately below.
   */
  const LOWER_CASE_IS_A_V2_FORMAT = ['HH:MM:SS', 'HH:MM:SS.SSS'];

  it.each(V1_FORMATS.filter(([format]) => !LOWER_CASE_IS_A_V2_FORMAT.includes(format)))(
    'accepts %s in lower case, as v1 did',
    (format, expected) => {
      expect(getString(SAMPLE, format.toLowerCase())).toBe(expected);
    },
  );

  it('reads a lower-case time-only name as the v2 tokens it is', () => {
    // 14:30:45 is 02:30:45 on a 12-hour clock. Translating these two to the v1
    // name instead made `getString(date, 'hh:mm:ss')` render 24-hour output,
    // contradicting the token table, and made `isValid('13:45:07', 'hh:mm:ss')`
    // true. The upper-case names still mean what v1 meant.
    expect(getString(SAMPLE, 'hh:mm:ss')).toBe('02:30:45');
    expect(getString(SAMPLE, 'HH:MM:SS')).toBe('14:30:45');
    expect(getString(SAMPLE, 'YYYY-MM-DD hh:mm:ss')).toBe('2024-03-17 02:30:45');
    expect(isValid('13:45:07', 'hh:mm:ss')).toBe(false);
    expect(isValid('01:45:07', 'hh:mm:ss')).toBe(true);
    expect(isValid('13:45:07', 'HH:MM:SS')).toBe(true);
  });

  it('reads a mixed-case month token as written', () => {
    // 'YYYY-mm-DD' uppercases to the v1 name 'YYYY-MM-DD', but `mm` is the
    // minute token, and that is what a v2 caller asking for it meant.
    expect(getString(SAMPLE, 'YYYY-mm-DD')).toBe('2024-30-17');
    expect(getString(SAMPLE, 'YYYY-MM-DD')).toBe('2024-03-17');
  });

  it('leaves canonical token strings alone', () => {
    expect(getString(SAMPLE, 'YYYY-MM-DD HH:mm:ss')).toBe('2024-03-17 14:30:45');
    expect(getString(SAMPLE, 'MMM')).toBe('Mar');
  });

  it('validates against v1 format names too', () => {
    expect(isValid('2024-03-17 14:30:45', 'YYYY-MM-DD HH:MM:SS')).toBe(true);
    expect(isValid('2024-03-17 14:30:99', 'YYYY-MM-DD HH:MM:SS')).toBe(false);
  });
});

describe('v1 unit aliases', () => {
  const base = new Date(2024, 0, 15, 12, 0, 0, 0);

  it.each([
    ['MILL', 1, 1],
    ['S', 1, 1000],
    ['MIN', 1, 60_000],
    ['H', 1, 3_600_000],
    ['D', 1, 86_400_000],
  ])('adds one %s as %d ms', (unit, amount, expectedMs) => {
    expect(add(base, amount, unit).getTime() - base.getTime()).toBe(expectedMs);
  });

  it('keeps M for month and Y for year', () => {
    expect(getString(add(base, 1, 'M'), 'YYYY-MM-DD')).toBe('2024-02-15');
    expect(getString(add(base, 1, 'Y'), 'YYYY-MM-DD')).toBe('2025-01-15');
    expect(getString(subtract(base, 1, 'M'), 'YYYY-MM-DD')).toBe('2023-12-15');
  });
});

describe('v1 call shapes', () => {
  it('still works through the default export', () => {
    expect(timeSolver.getString(SAMPLE, 'YYYYMMDD')).toBe('20240317');
    expect(timeSolver.between('2020-01-01', '2020-01-02', 'H')).toBe(24);
    expect(timeSolver.getQuarterByMonth(5)).toBe(2);
    expect(timeSolver.getFirstMonthByQuarter(3)).toBe(7);
    expect(timeSolver.getFullWeek(new Date(2024, 2, 18))).toBe('Monday');
    expect(timeSolver.getAbbrMonth(SAMPLE)).toBe('Mar');
  });

  it('accepts the v1 argument order everywhere', () => {
    expect(timeSolver.add('2020-01-01T00:00:00Z', 1, 'D').toISOString()).toBe(
      '2020-01-02T00:00:00.000Z',
    );
    expect(timeSolver.subtract('2020-01-02T00:00:00Z', 1, 'D').toISOString()).toBe(
      '2020-01-01T00:00:00.000Z',
    );
    expect(timeSolver.isValid('2020-01-01')).toBe(true);
  });
});
