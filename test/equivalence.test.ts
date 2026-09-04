import { describe, expect, it } from 'vitest';
import { type Comparison, librariesAgree } from '../bench/fixtures.js';

/**
 * Every other test in this suite compares timeSolver against a value this
 * project chose. That cannot catch a shared misconception — a calendar rule got
 * wrong in the implementation and in the expectation at the same time. dayjs and
 * date-fns disagreeing with us is the cheapest signal for that class of error,
 * and the comparison was already written: `bench/fixtures.ts` refuses to time
 * three functions that compute different things.
 *
 * It ran only under `npm run bench`, which no workflow invokes, so it had never
 * run in CI. It does now, without the benchmark's timing budget.
 */
describe('agreement with dayjs and date-fns', () => {
  const comparisons = librariesAgree();

  it('covers every operation the three libraries share', () => {
    expect(comparisons.map((comparison) => comparison.operation)).toEqual([
      'format YYYY-MM-DD',
      'format YYYY-MM-DD HH:mm:ss.SSS',
      'parse DD/MM/YYYY',
      'isValid accepts a real date',
      'isValid rejects February 31',
      'add 1 day',
      'add 1 month',
      'startOf month',
      'difference in days, truncated',
      'difference in months, truncated',
    ]);
  });

  it.each(comparisons)('agrees on $operation', ({ values }: Comparison) => {
    // Three values, one distinct answer. The guard in fixtures.ts throws before
    // this on a mismatch; asserting it here is what makes the failure a test
    // failure with a name rather than a module that would not load.
    expect(values).toHaveLength(3);
    expect(new Set(values.map((value) => String(value))).size).toBe(1);
  });
});
