/**
 * Shared inputs, timing budget and correctness guard for the benchmark suite.
 *
 * Two rules keep the numbers meaningful:
 *
 * 1. **Every benchmark starts from the same value a real caller holds.** For
 *    formatting and arithmetic that is a native `Date`; for parsing and
 *    validation it is a `string`. That boundary is the only one all three
 *    libraries share, so it is the only one on which they can be compared.
 * 2. **Nothing is timed until it has been proved equivalent.** The guard at the
 *    bottom of this file runs on import and throws if the three libraries
 *    disagree on any operation the suite treats as comparable. A benchmark of
 *    three functions that do different things is not a benchmark.
 */

import {
  addDays,
  addMonths,
  differenceInDays,
  differenceInMonths,
  isValid as fnsIsValid,
  parse as fnsParse,
  format,
  startOfMonth,
} from 'date-fns';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { add, between, getString, isValid, parse, startOf } from '../src/index.js';

// dayjs cannot parse or validate against an explicit format without this
// plugin, so the parse and isValid benchmarks would not exist for it
// otherwise. Registered here rather than in each benchmark file, and dayjs is
// re-exported below, so importing dayjs from this module always gets the
// configured instance.
dayjs.extend(customParseFormat);

export { dayjs };

/**
 * Where every benchmark body stores its result.
 *
 * An optimiser is free to delete a call whose value nothing reads, which would
 * silently turn a benchmark into a measurement of an empty loop. One property
 * store is the cheapest escape that prevents it, and it is identical in all
 * three libraries' cases, so it does not tilt the comparison.
 */
export const sink: { value: unknown } = { value: undefined };

/**
 * The date under test: mid-month, mid-afternoon, non-zero milliseconds, in a
 * leap year. No component is a zero that a shortcut could exploit.
 */
export const DATE = new Date(2024, 2, 17, 13, 45, 30, 42);

/** Second operand for the difference benchmarks: 437 days and 14 months later. */
export const LATER = new Date(2025, 4, 29, 8, 15, 5, 900);

/** A dayjs wrapper built once, for the "caller already works in dayjs" case. */
export const DAYJS_DATE = dayjs(DATE);

/** Input for the parse and isValid benchmarks. */
export const DATE_TEXT = '17/03/2024';

/** February 31 does not exist. Used only by the guard, never timed. */
export const IMPOSSIBLE_TEXT = '31/02/2024';

/**
 * date-fns `parse` has no default epoch: unspecified components come from a
 * reference date the caller must supply. Set to timeSolver's own default of
 * 1970-01-01T00:00:00.000 local. dayjs matches neither — its
 * `customParseFormat` falls back to parts of today — but this format specifies
 * every date component, so all three agree on the parsed instant and the
 * guard below proves it.
 */
export const FNS_REFERENCE = new Date(1970, 0, 1);

// Format strings. timeSolver's grammar is token-for-token the same as dayjs's
// here, which is why those two constants are identical; date-fns uses Unicode
// LDML field symbols instead.
export const TS_DATE_FORMAT = 'YYYY-MM-DD';
export const TS_STAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';
export const TS_PARSE_FORMAT = 'DD/MM/YYYY';
export const DAYJS_DATE_FORMAT = 'YYYY-MM-DD';
export const DAYJS_STAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';
export const DAYJS_PARSE_FORMAT = 'DD/MM/YYYY';
export const FNS_DATE_FORMAT = 'yyyy-MM-dd';
export const FNS_STAMP_FORMAT = 'yyyy-MM-dd HH:mm:ss.SSS';
export const FNS_PARSE_FORMAT = 'dd/MM/yyyy';

/**
 * One timing budget for every case in the suite, stated here rather than left
 * to the default so the recorded numbers can be reproduced exactly.
 */
export const BUDGET = { time: 1000, warmupTime: 250 };

function agree(operation: string, values: readonly unknown[]): void {
  const [expected] = values;

  for (const value of values) {
    if (value !== expected) {
      throw new Error(
        `benchmark operands disagree on ${operation}: ${values.map(String).join(' | ')}`,
      );
    }
  }
}

/**
 * Proves the three libraries compute the same answer for every comparable
 * operation before any of them is timed.
 *
 * The two difference benchmarks are compared truncated, because dayjs `diff`
 * and date-fns `differenceIn*` return whole units while timeSolver's `between`
 * returns the signed fractional difference. That is a genuine behavioural
 * difference, not a rounding detail, and `docs/benchmarks.md` says so.
 */
function assertLibrariesAgree(): void {
  agree('format YYYY-MM-DD', [
    getString(DATE, TS_DATE_FORMAT),
    dayjs(DATE).format(DAYJS_DATE_FORMAT),
    format(DATE, FNS_DATE_FORMAT),
  ]);

  agree('format YYYY-MM-DD HH:mm:ss.SSS', [
    getString(DATE, TS_STAMP_FORMAT),
    dayjs(DATE).format(DAYJS_STAMP_FORMAT),
    format(DATE, FNS_STAMP_FORMAT),
  ]);

  agree('parse DD/MM/YYYY', [
    parse(DATE_TEXT, TS_PARSE_FORMAT).getTime(),
    dayjs(DATE_TEXT, DAYJS_PARSE_FORMAT, true).toDate().getTime(),
    fnsParse(DATE_TEXT, FNS_PARSE_FORMAT, FNS_REFERENCE).getTime(),
  ]);

  agree('isValid accepts a real date', [
    isValid(DATE_TEXT, TS_PARSE_FORMAT),
    dayjs(DATE_TEXT, DAYJS_PARSE_FORMAT, true).isValid(),
    fnsIsValid(fnsParse(DATE_TEXT, FNS_PARSE_FORMAT, FNS_REFERENCE)),
  ]);

  agree('isValid rejects February 31', [
    isValid(IMPOSSIBLE_TEXT, TS_PARSE_FORMAT),
    dayjs(IMPOSSIBLE_TEXT, DAYJS_PARSE_FORMAT, true).isValid(),
    fnsIsValid(fnsParse(IMPOSSIBLE_TEXT, FNS_PARSE_FORMAT, FNS_REFERENCE)),
  ]);

  agree('add 1 day', [
    add(DATE, 1, 'day').getTime(),
    dayjs(DATE).add(1, 'day').toDate().getTime(),
    addDays(DATE, 1).getTime(),
  ]);

  agree('add 1 month', [
    add(DATE, 1, 'month').getTime(),
    dayjs(DATE).add(1, 'month').toDate().getTime(),
    addMonths(DATE, 1).getTime(),
  ]);

  agree('startOf month', [
    startOf(DATE, 'month').getTime(),
    dayjs(DATE).startOf('month').toDate().getTime(),
    startOfMonth(DATE).getTime(),
  ]);

  agree('difference in days, truncated', [
    Math.trunc(between(DATE, LATER, 'day')),
    dayjs(LATER).diff(dayjs(DATE), 'day'),
    differenceInDays(LATER, DATE),
  ]);

  agree('difference in months, truncated', [
    Math.trunc(between(DATE, LATER, 'month')),
    dayjs(LATER).diff(dayjs(DATE), 'month'),
    differenceInMonths(LATER, DATE),
  ]);
}

assertLibrariesAgree();
