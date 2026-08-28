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

export type { DateInput } from './coerce.js';
export type { TimeSolverErrorCode } from './errors.js';
export { TimeSolverError } from './errors.js';
export type { ExactUnit, Unit, UnitAlias, UnitInput } from './units.js';
export { UNITS } from './units.js';
export {
  add,
  after,
  afterToday,
  before,
  beforeToday,
  between,
  DEFAULT_FORMAT,
  daysInMonth,
  endOf,
  equal,
  getAbbrMonth,
  getAbbrWeek,
  getFirstMonthByQuarter,
  getFullMonth,
  getFullWeek,
  getQuarter,
  getQuarterByMonth,
  getString,
  isLeapYear,
  isValid,
  monthAbbreviation,
  monthName,
  parse,
  startOf,
  subtract,
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
  daysInMonth,
  endOf,
  equal,
  getAbbrMonth,
  getAbbrWeek,
  getFirstMonthByQuarter,
  getFullMonth,
  getFullWeek,
  getQuarter,
  getQuarterByMonth,
  getString,
  isLeapYear,
  isValid,
  monthAbbreviation,
  monthName,
  parse,
  startOf,
  subtract,
  weekdayAbbreviation,
  weekdayName,
} as const;

export default timeSolver;
