/**
 * Shifting a date and truncating a date.
 *
 * These start from a native `Date`, so the dayjs cases pay for `dayjs(date)`.
 * They do not pay for `.toDate()`: the result is left as a wrapper, because a
 * dayjs caller usually keeps working in wrapper space. That choice favours
 * dayjs, and `docs/benchmarks.md` says so rather than pretending the numbers
 * measure identical work.
 */

import { addDays, addMonths, startOfMonth } from 'date-fns';
import { bench, describe } from 'vitest';
import { add, startOf } from '../src/index.js';
import { BUDGET, DATE, dayjs, sink } from './fixtures.js';

describe('add 1 day', () => {
  bench(
    'timesolver add',
    () => {
      sink.value = add(DATE, 1, 'day');
    },
    BUDGET,
  );

  bench(
    'dayjs add',
    () => {
      sink.value = dayjs(DATE).add(1, 'day');
    },
    BUDGET,
  );

  bench(
    'date-fns addDays',
    () => {
      sink.value = addDays(DATE, 1);
    },
    BUDGET,
  );
});

describe('add 1 month', () => {
  bench(
    'timesolver add',
    () => {
      sink.value = add(DATE, 1, 'month');
    },
    BUDGET,
  );

  bench(
    'dayjs add',
    () => {
      sink.value = dayjs(DATE).add(1, 'month');
    },
    BUDGET,
  );

  bench(
    'date-fns addMonths',
    () => {
      sink.value = addMonths(DATE, 1);
    },
    BUDGET,
  );
});

describe("startOf 'month'", () => {
  bench(
    'timesolver startOf',
    () => {
      sink.value = startOf(DATE, 'month');
    },
    BUDGET,
  );

  bench(
    'dayjs startOf',
    () => {
      sink.value = dayjs(DATE).startOf('month');
    },
    BUDGET,
  );

  bench(
    'date-fns startOfMonth',
    () => {
      sink.value = startOfMonth(DATE);
    },
    BUDGET,
  );
});
