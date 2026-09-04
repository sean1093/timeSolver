/**
 * Formatting a native `Date` to a string — the operation callers hit most, and
 * the only one in this suite that is plausibly on a hot path (table rendering,
 * log lines, CSV export).
 *
 * timeSolver tokenizes a format once and keeps it, so what is measured here is
 * rendering, not parsing the format string; dayjs and date-fns re-read theirs on
 * every call, which is part of their number. The extra dayjs case reuses a
 * wrapper built once, which isolates the cost of `dayjs(date)` from the cost of
 * `.format()`.
 */

import { format } from 'date-fns';
import { bench, describe } from 'vitest';
import { getString } from '../src/index.js';
import {
  BUDGET,
  DATE,
  DAYJS_DATE,
  DAYJS_DATE_FORMAT,
  DAYJS_STAMP_FORMAT,
  dayjs,
  FNS_DATE_FORMAT,
  FNS_STAMP_FORMAT,
  sink,
  TS_DATE_FORMAT,
  TS_STAMP_FORMAT,
} from './fixtures.js';

describe("format to 'YYYY-MM-DD'", () => {
  bench(
    'timesolver getString',
    () => {
      sink.value = getString(DATE, TS_DATE_FORMAT);
    },
    BUDGET,
  );

  bench(
    'dayjs format',
    () => {
      sink.value = dayjs(DATE).format(DAYJS_DATE_FORMAT);
    },
    BUDGET,
  );

  bench(
    'dayjs format, wrapper reused',
    () => {
      sink.value = DAYJS_DATE.format(DAYJS_DATE_FORMAT);
    },
    BUDGET,
  );

  bench(
    'date-fns format',
    () => {
      sink.value = format(DATE, FNS_DATE_FORMAT);
    },
    BUDGET,
  );
});

describe("format to 'YYYY-MM-DD HH:mm:ss.SSS'", () => {
  bench(
    'timesolver getString',
    () => {
      sink.value = getString(DATE, TS_STAMP_FORMAT);
    },
    BUDGET,
  );

  bench(
    'dayjs format',
    () => {
      sink.value = dayjs(DATE).format(DAYJS_STAMP_FORMAT);
    },
    BUDGET,
  );

  bench(
    'dayjs format, wrapper reused',
    () => {
      sink.value = DAYJS_DATE.format(DAYJS_STAMP_FORMAT);
    },
    BUDGET,
  );

  bench(
    'date-fns format',
    () => {
      sink.value = format(DATE, FNS_STAMP_FORMAT);
    },
    BUDGET,
  );
});
