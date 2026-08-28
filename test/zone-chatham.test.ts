import { afterAll, describe, expect, it } from 'vitest';
import { getString } from '../src/format.js';
import { endOf, startOf } from '../src/manipulate.js';

/**
 * Pacific/Chatham, the awkward case. This file switches the process time zone
 * for itself, because the two shapes below cannot happen in America/New_York
 * where the rest of the suite runs.
 *
 * The switch is a runtime assignment rather than a Vitest project because not
 * every tool that drives this suite honours per-project `env`: Stryker's runner
 * reads `vitest.config.ts` and runs every file in one zone. Vitest isolates each
 * file in its own worker, and the zone is restored afterwards regardless.
 *
 * Chatham sits at +12:45 and +13:45 and shifts at 02:45 rather than on the hour:
 *
 * - Forward, 2024-09-29: 02:45 becomes 03:45, so local 03:00 to 03:44 never
 *   happens. The start of local hour 03 is therefore missing -- something a zone
 *   that shifts on the hour can never do, since it skips whole hours only.
 * - Back, 2024-04-07: 03:45 becomes 02:45, so 02:45 to 02:59 happens twice with
 *   03:00 to 03:44 in between. Local hour 02 is split into two separate runs of
 *   elapsed time rather than one long one.
 *
 * Both are checked across 366 days by `npm run test:zones`; these pin the exact
 * instants so a regression names itself.
 */
const ZONE = 'Pacific/Chatham';
const CHATHAM_STANDARD = -765; // +12:45
const CHATHAM_SUMMER = -825; // +13:45
const inherited = process.env.TZ;

// Set at import time, before the suites below are registered, so the check on
// the next line sees the result.
process.env.TZ = ZONE;

/**
 * Assigning `process.env.TZ` invalidates the date cache under Node's default
 * process model, which is what Vitest uses. It does *not* work inside a worker
 * thread, because the environment there is a copy: Stryker's Vitest runner
 * hard-codes `pool: 'threads'`, so under mutation testing this file skips rather
 * than asserting confidently about the wrong zone. The mutants it alone covers
 * are marked in `src/manipulate.ts` with that reason.
 */
const switched = new Date(Date.UTC(2024, 0, 15)).getTimezoneOffset() === CHATHAM_SUMMER;

afterAll(() => {
  process.env.TZ = inherited;
});

const STAMP = 'YYYY-MM-DD HH:mm:ss.SSS';
const UNITS = ['millisecond', 'second', 'minute', 'hour', 'day', 'week', 'month', 'year'] as const;

/** Asserted for every case below: this is what range queries actually need. */
function expectConsistent(date: Date) {
  for (const unit of UNITS) {
    const start = startOf(date, unit);
    const end = endOf(date, unit);

    expect(start.getTime()).toBeLessThanOrEqual(date.getTime());
    expect(date.getTime()).toBeLessThanOrEqual(end.getTime());
    expect(startOf(start, unit).getTime()).toBe(start.getTime());
    expect(endOf(end, unit).getTime()).toBe(end.getTime());
    expect(startOf(end, unit).getTime()).toBe(start.getTime());
    expect(startOf(new Date(end.getTime() + 1), unit).getTime()).toBe(end.getTime() + 1);
  }
}

describe.skipIf(!switched)('the zone this file exists for', () => {
  it('is Pacific/Chatham, at a quarter-hour offset', () => {
    expect(new Date(Date.UTC(2024, 0, 15)).getTimezoneOffset()).toBe(CHATHAM_SUMMER);
    expect(new Date(Date.UTC(2024, 5, 15)).getTimezoneOffset()).toBe(CHATHAM_STANDARD);
  });
});

describe.skipIf(!switched)('a unit whose start never happened', () => {
  // 2024-09-28T14:00:00Z is 02:45 local; the next millisecond reads 03:45.
  const shift = new Date('2024-09-28T14:00:00.000Z');

  it('skips local 03:00 through 03:44', () => {
    expect(getString(new Date(shift.getTime() - 1), STAMP)).toBe('2024-09-29 02:44:59.999');
    expect(getString(shift, STAMP)).toBe('2024-09-29 03:45:00.000');
  });

  it('starts the hour at the shift instead of moving forward out of it', () => {
    const inside = new Date('2024-09-28T14:14:59.999Z'); // 03:59:59.999 local

    // Before this was fixed, truncating to 03:00 landed on 04:00 -- past the date
    // it was given, and in the following hour.
    expect(getString(startOf(inside, 'hour'), STAMP)).toBe('2024-09-29 03:45:00.000');
    expect(getString(endOf(inside, 'hour'), STAMP)).toBe('2024-09-29 03:59:59.999');
    expectConsistent(inside);
  });

  it('holds for every unit at the first instant of the shift', () => {
    expectConsistent(shift);
    expect(getString(startOf(shift, 'hour'), STAMP)).toBe('2024-09-29 03:45:00.000');
  });
});

describe.skipIf(!switched)('a unit reached twice with other units in between', () => {
  // 2024-04-06T14:00:00Z is when 03:45 becomes 02:45.
  const shift = new Date('2024-04-06T14:00:00.000Z');
  const firstRun = new Date('2024-04-06T13:00:30.000Z'); // 02:45:30 at +13:45
  const secondRun = new Date('2024-04-06T14:00:30.000Z'); // 02:45:30 at +12:45

  it('reads the same wall clock in both runs', () => {
    expect(getString(firstRun, STAMP)).toBe('2024-04-07 02:45:30.000');
    expect(getString(secondRun, STAMP)).toBe('2024-04-07 02:45:30.000');
    expect(getString(new Date(shift.getTime() - 1), STAMP)).toBe('2024-04-07 03:44:59.999');
  });

  it('gives the first run its own bounds', () => {
    expect(startOf(firstRun, 'hour').toISOString()).toBe('2024-04-06T12:15:00.000Z');
    expect(endOf(firstRun, 'hour').toISOString()).toBe('2024-04-06T13:14:59.999Z');
    expectConsistent(firstRun);
  });

  it('gives the second run the bounds it is actually in', () => {
    // The wall clock alone would name the first run, an hour and three quarters
    // earlier, which is how endOf came to precede its own startOf.
    expect(startOf(secondRun, 'hour').toISOString()).toBe('2024-04-06T14:00:00.000Z');
    expect(endOf(secondRun, 'hour').toISOString()).toBe('2024-04-06T14:14:59.999Z');
    expectConsistent(secondRun);
  });

  it('keeps hour 03 split around it', () => {
    const beforeShift = new Date('2024-04-06T13:30:00.000Z'); // 03:15 at +13:45
    const afterShift = new Date('2024-04-06T14:30:00.000Z'); // 03:15 at +12:45

    expect(getString(beforeShift, STAMP)).toBe('2024-04-07 03:15:00.000');
    expect(getString(afterShift, STAMP)).toBe('2024-04-07 03:15:00.000');
    expect(startOf(beforeShift, 'hour').toISOString()).toBe('2024-04-06T13:15:00.000Z');
    expect(startOf(afterShift, 'hour').toISOString()).toBe('2024-04-06T14:15:00.000Z');
    expectConsistent(beforeShift);
    expectConsistent(afterShift);
  });

  it('still reports one 25-hour day, not a split one', () => {
    expect(startOf(secondRun, 'day').toISOString()).toBe('2024-04-06T10:15:00.000Z');
    expect(getString(startOf(secondRun, 'day'), STAMP)).toBe('2024-04-07 00:00:00.000');
    expect(getString(endOf(secondRun, 'day'), STAMP)).toBe('2024-04-07 23:59:59.999');
    expect(endOf(secondRun, 'day').getTime() - startOf(secondRun, 'day').getTime() + 1).toBe(
      25 * 3_600_000,
    );
  });
});
