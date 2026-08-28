import { describe, expect, it } from 'vitest';
import manifest from '../package.json';
import timeSolver, * as namespace from '../src/index.js';

const EXPECTED_FUNCTIONS = [
  'add',
  'after',
  'afterToday',
  'before',
  'beforeToday',
  'between',
  'createProfiler',
  'daysInMonth',
  'endOf',
  'equal',
  'getAbbrMonth',
  'getAbbrWeek',
  'getFirstMonthByQuarter',
  'getFullMonth',
  'getFullWeek',
  'getQuarter',
  'getQuarterByMonth',
  'getString',
  'isLeapYear',
  'isValid',
  'monthAbbreviation',
  'monthName',
  'parse',
  'startOf',
  'subtract',
  'weekdayAbbreviation',
  'weekdayName',
] as const;

// v1 compatibility names. Exported by name as well as on the default object,
// so the browser global carries them for 1.x script-tag callers.
const LEGACY_NAMES = ['timeLook', 'timeLookReport', 'timeLookStart'] as const;

describe('package surface', () => {
  it.each(EXPECTED_FUNCTIONS)('exports %s as a named function', (name) => {
    expect(typeof namespace[name]).toBe('function');
  });

  it.each(EXPECTED_FUNCTIONS)('exposes %s on the default export', (name) => {
    expect(typeof timeSolver[name]).toBe('function');
  });

  it('points the default export at the same function objects as the named exports', () => {
    for (const name of EXPECTED_FUNCTIONS) {
      expect(timeSolver[name]).toBe(namespace[name]);
    }
  });

  it.each(LEGACY_NAMES)('exposes the v1 name %s as a named export', (name) => {
    expect(typeof namespace[name]).toBe('function');
    expect(timeSolver[name]).toBe(namespace[name]);
  });

  it('exports nothing on the default object beyond the documented functions', () => {
    expect(Object.keys(timeSolver).sort()).toEqual([...EXPECTED_FUNCTIONS, ...LEGACY_NAMES].sort());
  });

  it('exports the error class and the unit list', () => {
    expect(typeof namespace.TimeSolverError).toBe('function');
    expect(namespace.UNITS).toContain('quarter');
    expect(namespace.DEFAULT_FORMAT).toBe('YYYYMMDD');
  });

  it('carries no runtime dependencies', () => {
    expect(manifest.name).toBe('timesolver');
    expect(manifest.license).toBe('MIT');
    expect(Object.hasOwn(manifest, 'dependencies')).toBe(false);
  });
});
