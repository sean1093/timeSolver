import { TimeSolverError } from './errors.js';

/** Canonical time units, coarsest last. */
export const UNITS = [
  'millisecond',
  'second',
  'minute',
  'hour',
  'day',
  'week',
  'month',
  'quarter',
  'year',
] as const;

/** A canonical unit name. */
export type Unit = (typeof UNITS)[number];

/**
 * Every accepted spelling of a unit. Aliases are case-insensitive, and the v1
 * abbreviations (`'MILL'`, `'S'`, `'MIN'`, `'H'`, `'D'`, `'M'` for month,
 * `'Y'`) are all kept so existing call sites keep working.
 */
const UNIT_ALIASES = {
  millisecond: 'millisecond',
  milliseconds: 'millisecond',
  mill: 'millisecond',
  msec: 'millisecond',
  ms: 'millisecond',
  second: 'second',
  seconds: 'second',
  sec: 'second',
  s: 'second',
  minute: 'minute',
  minutes: 'minute',
  min: 'minute',
  hour: 'hour',
  hours: 'hour',
  hr: 'hour',
  h: 'hour',
  day: 'day',
  days: 'day',
  d: 'day',
  week: 'week',
  weeks: 'week',
  w: 'week',
  month: 'month',
  months: 'month',
  mon: 'month',
  m: 'month',
  quarter: 'quarter',
  quarters: 'quarter',
  q: 'quarter',
  year: 'year',
  years: 'year',
  yr: 'year',
  y: 'year',
} as const satisfies Record<string, Unit>;

/** A lowercase unit alias. */
export type UnitAlias = keyof typeof UNIT_ALIASES;

/**
 * Accepted unit argument: any alias in any case. The `string` member keeps
 * plain JavaScript callers and dynamic values usable while preserving editor
 * completion for the known aliases; unknown strings throw at runtime.
 */
export type UnitInput = UnitAlias | Uppercase<UnitAlias> | (string & Record<never, never>);

// `Object.hasOwn` guards every read, so inherited keys such as `constructor`
// cannot resolve to a value.
const ALIAS_LOOKUP: Record<string, Unit> = UNIT_ALIASES;

/** Units whose length never varies, and the millisecond count of each. */
const MS_PER_EXACT_UNIT = {
  millisecond: 1,
  second: 1000,
  minute: 60_000,
  hour: 3_600_000,
} as const;

/** A unit with a fixed millisecond length. */
export type ExactUnit = keyof typeof MS_PER_EXACT_UNIT;

export { MS_PER_EXACT_UNIT };

/** Milliseconds in a nominal 24-hour day, used for calendar-day arithmetic. */
export const MS_PER_DAY = 86_400_000;

/** How many calendar months each coarse unit spans. */
export const MONTHS_PER_UNIT = {
  month: 1,
  quarter: 3,
  year: 12,
} as const;

/**
 * `true` for units measured in a constant number of milliseconds. Day and week
 * are excluded on purpose: they follow the local calendar, so a
 * daylight-saving day is 23 or 25 hours long.
 */
export function isExactUnit(unit: Unit): unit is ExactUnit {
  return Object.hasOwn(MS_PER_EXACT_UNIT, unit);
}

/**
 * Resolve a unit argument to its canonical name.
 *
 * @param unit - Any accepted alias. `undefined` resolves to `'millisecond'`,
 *   matching the v1 default.
 * @throws {TimeSolverError} `INVALID_UNIT` when the alias is unknown.
 */
export function normalizeUnit(unit?: UnitInput): Unit {
  if (unit === undefined) {
    return 'millisecond';
  }

  const key = typeof unit === 'string' ? unit.toLowerCase() : '';
  const resolved = Object.hasOwn(ALIAS_LOOKUP, key) ? ALIAS_LOOKUP[key] : undefined;

  if (resolved === undefined) {
    throw new TimeSolverError(
      'INVALID_UNIT',
      `Unknown time unit ${JSON.stringify(unit)}. Supported units: ${UNITS.join(', ')}.`,
    );
  }

  return resolved;
}
