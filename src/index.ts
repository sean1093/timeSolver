/**
 * timeSolver — tiny immutable date utilities for JavaScript and TypeScript.
 *
 * Import only what you need for a tree-shakable bundle:
 *
 * ```ts
 * import { add, getString } from 'timesolver';
 * ```
 *
 * or take the whole namespace, as v1 callers do:
 *
 * ```ts
 * import timeSolver from 'timesolver';
 * ```
 *
 * @packageDocumentation
 */

import {
  daysInMonth,
  getAbbrMonth,
  getAbbrWeek,
  getFirstMonthByQuarter,
  getFullMonth,
  getFullWeek,
  getQuarter,
  getQuarterByMonth,
  isLeapYear,
  monthAbbreviation,
  monthName,
  weekdayAbbreviation,
  weekdayName,
} from './calendar.js';
import { after, afterToday, before, beforeToday, between, equal } from './compare.js';
import { DEFAULT_FORMAT, getString } from './format.js';
import { add, endOf, startOf, subtract } from './manipulate.js';
import { isValid, parse } from './parse.js';
import { createProfiler, timeLook, timeLookReport, timeLookStart } from './profiler.js';
import { clamp, isBetween, max, min } from './range.js';
import { getISOWeek, getISOWeekYear, getWeekOfYear } from './weeknumber.js';

export type { DateInput } from './coerce.js';
export type { TimeSolverErrorCode } from './errors.js';
export { TimeSolverError } from './errors.js';
export type { ProfileMark, ProfileReport, Profiler } from './profiler.js';
export type { BetweenOptions, Bounds } from './range.js';
export type { ExactUnit, Unit, UnitAlias, UnitInput } from './units.js';
export { UNITS } from './units.js';
export type { WeekDay, WeekOptions } from './week.js';
export {
  add,
  after,
  afterToday,
  before,
  beforeToday,
  between,
  clamp,
  createProfiler,
  DEFAULT_FORMAT,
  daysInMonth,
  endOf,
  equal,
  getAbbrMonth,
  getAbbrWeek,
  getFirstMonthByQuarter,
  getFullMonth,
  getFullWeek,
  getISOWeek,
  getISOWeekYear,
  getQuarter,
  getQuarterByMonth,
  getString,
  getWeekOfYear,
  isBetween,
  isLeapYear,
  isValid,
  max,
  min,
  monthAbbreviation,
  monthName,
  parse,
  startOf,
  subtract,
  // v1 compatibility. Named as well as on the default export, so the browser
  // global built from this entry point carries them too: a 1.x script tag
  // calls `timeSolver.timeLook('step')` directly. Tree-shaking still drops
  // them for anyone importing other names.
  timeLook,
  timeLookReport,
  timeLookStart,
  weekdayAbbreviation,
  weekdayName,
};

/**
 * Every function in one object, for `import timeSolver from 'timesolver'` and
 * for the browser global built by `dist/timesolver.global.js`.
 */
const timeSolver = {
  add,
  after,
  afterToday,
  before,
  beforeToday,
  between,
  clamp,
  createProfiler,
  daysInMonth,
  endOf,
  equal,
  getAbbrMonth,
  getAbbrWeek,
  getFirstMonthByQuarter,
  getFullMonth,
  getFullWeek,
  getISOWeek,
  getISOWeekYear,
  getQuarter,
  getQuarterByMonth,
  getString,
  getWeekOfYear,
  isBetween,
  isLeapYear,
  isValid,
  max,
  min,
  monthAbbreviation,
  monthName,
  parse,
  startOf,
  subtract,
  // v1 compatibility: these three drive a shared profiler instance. The
  // instance API above is what new code should reach for.
  timeLook,
  timeLookReport,
  timeLookStart,
  weekdayAbbreviation,
  weekdayName,
} as const;

export default timeSolver;
