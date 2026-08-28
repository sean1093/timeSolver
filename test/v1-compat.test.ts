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

  it.each(V1_FORMATS)('accepts %s in lower case, as v1 did', (format, expected) => {
    expect(getString(SAMPLE, format.toLowerCase())).toBe(expected);
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
