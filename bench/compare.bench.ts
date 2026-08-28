/**
 * Measuring the distance between two dates.
 *
 * The three answers are not the same kind of number. `between` returns the
 * signed fractional difference, so 437.77 days; dayjs `diff` and date-fns
 * `differenceIn*` return whole units, so 437. Truncating `between` reproduces
 * the other two exactly — `fixtures.ts` asserts that on import — but the extra
 * precision is work the other two never do, and it is part of what is timed
 * here.
 *
 * The dayjs case builds both wrappers, because a caller holding two `Date`
 * values has to.
 */

import { differenceInDays, differenceInMonths } from 'date-fns';
import { bench, describe } from 'vitest';
import { between } from '../src/index.js';
import { BUDGET, DATE, dayjs, LATER, sink } from './fixtures.js';

describe('difference in days', () => {
  bench(
    'timesolver between',
    () => {
      sink.value = between(DATE, LATER, 'day');
    },
    BUDGET,
  );

  bench(
    'dayjs diff',
    () => {
      sink.value = dayjs(LATER).diff(dayjs(DATE), 'day');
    },
    BUDGET,
  );

  bench(
    'date-fns differenceInDays',
    () => {
      sink.value = differenceInDays(LATER, DATE);
    },
    BUDGET,
  );
});

describe('difference in months', () => {
  bench(
    'timesolver between',
    () => {
      sink.value = between(DATE, LATER, 'month');
    },
    BUDGET,
  );

  bench(
    'dayjs diff',
    () => {
      sink.value = dayjs(LATER).diff(dayjs(DATE), 'month');
    },
    BUDGET,
  );

  bench(
    'date-fns differenceInMonths',
    () => {
      sink.value = differenceInMonths(LATER, DATE);
    },
    BUDGET,
  );
});
