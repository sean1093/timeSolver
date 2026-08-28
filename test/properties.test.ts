import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { after, before, between, equal } from '../src/compare.js';
import { getString } from '../src/format.js';
import { add, endOf, startOf, subtract } from '../src/manipulate.js';
import { isValid, parse } from '../src/parse.js';
import { clamp, isBetween, max, min } from '../src/range.js';
import { UNITS, type Unit } from '../src/units.js';
import type { WeekDay } from '../src/week.js';
import { getISOWeek, getISOWeekYear } from '../src/weeknumber.js';

/**
 * Property-based tests. The example-based suite pins behaviour the docs promise;
 * these check the invariants that hold for *every* input, which is where the
 * cases nobody thought to write down live.
 *
 * Dates are drawn from 1900 to 2100 at millisecond resolution. That range covers
 * every daylight-saving rule the pinned test zone has had, without straying into
 * the pre-1900 offsets where zone databases disagree with each other.
 */
const MS_PER_DAY = 86_400_000;
const RANGE_START = Date.UTC(1900, 0, 1);
const RANGE_END = Date.UTC(2100, 0, 1);

const anyDate = fc
  .integer({ min: RANGE_START, max: RANGE_END })
  .map((milliseconds) => new Date(milliseconds));

const anyUnit: fc.Arbitrary<Unit> = fc.constantFrom(...UNITS);
const calendarUnit: fc.Arbitrary<Unit> = fc.constantFrom('day', 'week', 'month', 'quarter', 'year');
const calendarMonthUnit: fc.Arbitrary<Unit> = fc.constantFrom('month', 'quarter', 'year');
const anyWeekStart: fc.Arbitrary<WeekDay> = fc.constantFrom(0, 1, 2, 3, 4, 5, 6);
const wholeAmount = fc.integer({ min: -500, max: 500 });

describe('arithmetic', () => {
  it('never mutates its input', () => {
    fc.assert(
      fc.property(anyDate, wholeAmount, anyUnit, (date, amount, unit) => {
        const before = date.getTime();

        add(date, amount, unit);
        subtract(date, amount, unit);
        startOf(date, unit);
        endOf(date, unit);

        return date.getTime() === before;
      }),
    );
  });

  it('adding then subtracting the same amount is the identity, where clamping cannot occur', () => {
    fc.assert(
      fc.property(anyDate, wholeAmount, anyUnit, (date, amount, unit) => {
        const clampable = unit === 'month' || unit === 'quarter' || unit === 'year';

        // Calendar month arithmetic is not invertible when the day of the month
        // does not exist in the target month: 31 December plus 18 months clamps
        // to 30 June, and subtracting 18 months from that gives 30 December.
        // Every calendar library behaves this way. Days 1 to 28 exist in every
        // month, so the identity holds there.
        if (clampable && date.getDate() > 28) {
          return true;
        }

        return subtract(add(date, amount, unit), amount, unit).getTime() === date.getTime();
      }),
    );
  });

  it('clamped month arithmetic still returns to the same month, never later in it', () => {
    fc.assert(
      fc.property(anyDate, wholeAmount, calendarMonthUnit, (date, amount, unit) => {
        const returned = subtract(add(date, amount, unit), amount, unit);

        return (
          getString(returned, 'YYYY-MM') === getString(date, 'YYYY-MM') &&
          returned.getDate() <= date.getDate()
        );
      }),
    );
  });

  it('adds in whole steps, in any order', () => {
    fc.assert(
      fc.property(anyDate, fc.integer({ min: -50, max: 50 }), anyUnit, (date, amount, unit) => {
        const once = add(date, amount * 2, unit);
        const twice = add(add(date, amount, unit), amount, unit);

        // Month arithmetic clamps, so two steps of one month can differ from one
        // step of two; every other unit composes exactly.
        if (unit === 'month' || unit === 'quarter' || unit === 'year') {
          return true;
        }

        return once.getTime() === twice.getTime();
      }),
    );
  });
});

describe('truncation', () => {
  it('startOf is idempotent and never moves forward', () => {
    fc.assert(
      fc.property(anyDate, anyUnit, anyWeekStart, (date, unit, weekStartsOn) => {
        const once = startOf(date, unit, { weekStartsOn });
        const twice = startOf(once, unit, { weekStartsOn });

        return once.getTime() === twice.getTime() && once.getTime() <= date.getTime();
      }),
    );
  });

  it('the unit brackets the date it contains', () => {
    fc.assert(
      fc.property(anyDate, anyUnit, anyWeekStart, (date, unit, weekStartsOn) => {
        const start = startOf(date, unit, { weekStartsOn }).getTime();
        const end = endOf(date, unit, { weekStartsOn }).getTime();

        return start <= date.getTime() && date.getTime() <= end && start <= end;
      }),
    );
  });

  it('endOf is one millisecond before the next unit begins', () => {
    fc.assert(
      fc.property(anyDate, calendarUnit, anyWeekStart, (date, unit, weekStartsOn) => {
        const end = endOf(date, unit, { weekStartsOn });
        const nextStart = startOf(add(end, 1, 'millisecond'), unit, { weekStartsOn });

        return nextStart.getTime() === end.getTime() + 1;
      }),
    );
  });

  it('a coarser unit contains a finer one', () => {
    fc.assert(
      fc.property(anyDate, (date) => {
        const day = startOf(date, 'day').getTime();
        const month = startOf(date, 'month').getTime();
        const quarter = startOf(date, 'quarter').getTime();
        const year = startOf(date, 'year').getTime();

        return year <= quarter && quarter <= month && month <= day;
      }),
    );
  });
});

describe('comparison', () => {
  it('between is antisymmetric', () => {
    fc.assert(
      fc.property(anyDate, anyDate, anyUnit, (first, second, unit) => {
        // `+ 0` normalises -0, which Object.is distinguishes from 0.
        return between(first, second, unit) + 0 === -between(second, first, unit) + 0;
      }),
    );
  });

  it('exactly one of after, before and equal holds', () => {
    fc.assert(
      fc.property(anyDate, anyDate, anyUnit, anyWeekStart, (first, second, unit, weekStartsOn) => {
        const options = { weekStartsOn };
        const results = [
          after(first, second, unit, options),
          before(first, second, unit, options),
          equal(first, second, unit, options),
        ];

        return results.filter(Boolean).length === 1;
      }),
    );
  });

  it('equality at a unit means the same truncated instant', () => {
    fc.assert(
      fc.property(anyDate, anyDate, anyUnit, (first, second, unit) => {
        const sameBucket = startOf(first, unit).getTime() === startOf(second, unit).getTime();

        return equal(first, second, unit) === sameBucket;
      }),
    );
  });

  it('a date is in the same bucket as itself, and never before or after it', () => {
    fc.assert(
      fc.property(anyDate, anyUnit, (date, unit) => {
        return (
          equal(date, date, unit) &&
          !after(date, date, unit) &&
          !before(date, date, unit) &&
          between(date, date, unit) === 0
        );
      }),
    );
  });

  it('ordering agrees with the sign of the difference', () => {
    fc.assert(
      fc.property(anyDate, anyDate, (first, second) => {
        const difference = between(first, second, 'millisecond');

        if (difference === 0) {
          return equal(first, second);
        }

        return difference > 0 ? before(first, second) : after(first, second);
      }),
    );
  });
});

describe('ranges', () => {
  it('isBetween agrees with the comparisons it is built from', () => {
    fc.assert(
      fc.property(anyDate, anyDate, anyDate, (date, start, end) => {
        const inclusive = isBetween(date, start, end);
        const byHand = !before(date, start) && !after(date, end);

        return inclusive === byHand;
      }),
    );
  });

  it('half-open ranges tile without overlap or gap', () => {
    fc.assert(
      fc.property(anyDate, calendarUnit, (date, unit) => {
        const start = startOf(date, unit);
        const next = add(start, 1, unit);

        return (
          isBetween(date, start, next, undefined, '[)') &&
          !isBetween(next, start, next, undefined, '[)')
        );
      }),
    );
  });

  it('min and max bound every input', () => {
    fc.assert(
      fc.property(fc.array(anyDate, { minLength: 1, maxLength: 20 }), (dates) => {
        const [first, ...rest] = dates as [Date, ...Date[]];
        const lowest = min(first, ...rest).getTime();
        const highest = max(first, ...rest).getTime();

        return dates.every((date) => lowest <= date.getTime() && date.getTime() <= highest);
      }),
    );
  });

  it('clamp lands inside the range and leaves inside dates alone', () => {
    fc.assert(
      fc.property(anyDate, anyDate, anyDate, (date, one, other) => {
        const lower = min(one, other);
        const upper = max(one, other);
        const clamped = clamp(date, lower, upper).getTime();
        const inside = clamped >= lower.getTime() && clamped <= upper.getTime();
        const untouched =
          date.getTime() < lower.getTime() || date.getTime() > upper.getTime()
            ? true
            : clamped === date.getTime();

        return inside && untouched;
      }),
    );
  });
});

describe('formatting and parsing', () => {
  const FORMATS = [
    'YYYY-MM-DD',
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DD HH:mm:ss.SSS',
    'DD/MM/YYYY',
    'MM.DD.YYYY HH:mm',
    'YYYY-M-D H:m:s',
    'D MMM YYYY',
    'dddd, D MMMM YYYY',
    'hh:mm A',
  ] as const;

  it('every rendered string parses back to the same fields', () => {
    fc.assert(
      fc.property(anyDate, fc.constantFrom(...FORMATS), (date, format) => {
        const rendered = getString(date, format);

        // The round trip is on the rendered text, not the instant: a format
        // without a time component cannot carry one back.
        return getString(parse(rendered, format), format) === rendered;
      }),
    );
  });

  it('a full timestamp round-trips to the exact instant', () => {
    fc.assert(
      fc.property(anyDate, (date) => {
        const format = 'YYYY-MM-DD HH:mm:ss.SSS';

        return parse(getString(date, format), format).getTime() === date.getTime();
      }),
    );
  });

  it('anything the formatter produces is valid', () => {
    fc.assert(
      fc.property(anyDate, fc.constantFrom(...FORMATS), (date, format) => {
        return isValid(getString(date, format), format);
      }),
    );
  });

  it('isValid never throws on arbitrary strings', () => {
    fc.assert(
      fc.property(fc.string(), fc.constantFrom(...FORMATS), (input, format) => {
        const result = isValid(input, format);

        return typeof result === 'boolean';
      }),
    );
  });

  it('parse either returns a valid date or throws, never both', () => {
    fc.assert(
      fc.property(fc.string(), fc.constantFrom(...FORMATS), (input, format) => {
        try {
          return !Number.isNaN(parse(input, format).getTime());
        } catch {
          return true;
        }
      }),
    );
  });
});

describe('week numbering', () => {
  it('ISO weeks are whole numbers from 1 to 53', () => {
    fc.assert(
      fc.property(anyDate, (date) => {
        const week = getISOWeek(date);

        return Number.isInteger(week) && week >= 1 && week <= 53;
      }),
    );
  });

  it('every day of an ISO week shares its number and year', () => {
    fc.assert(
      fc.property(anyDate, (date) => {
        const monday = startOf(date, 'week', { weekStartsOn: 1 });
        const week = getISOWeek(monday);
        const weekYear = getISOWeekYear(monday);

        for (let offset = 1; offset < 7; offset += 1) {
          const day = new Date(monday.getTime() + offset * MS_PER_DAY);

          if (getISOWeek(day) !== week || getISOWeekYear(day) !== weekYear) {
            return false;
          }
        }

        return true;
      }),
    );
  });

  it('the ISO week-year is within a year of the calendar year', () => {
    fc.assert(
      fc.property(anyDate, (date) => {
        return Math.abs(getISOWeekYear(date) - date.getFullYear()) <= 1;
      }),
    );
  });
});

describe('week boundaries', () => {
  it('startOf week lands on the requested weekday', () => {
    fc.assert(
      fc.property(anyDate, anyWeekStart, (date, weekStartsOn) => {
        return startOf(date, 'week', { weekStartsOn }).getDay() === weekStartsOn;
      }),
    );
  });

  it('the week is seven calendar days long', () => {
    fc.assert(
      fc.property(anyDate, anyWeekStart, (date, weekStartsOn) => {
        const start = startOf(date, 'week', { weekStartsOn });
        const end = endOf(date, 'week', { weekStartsOn });

        return getString(add(start, 6, 'day'), 'YYYY-MM-DD') === getString(end, 'YYYY-MM-DD');
      }),
    );
  });
});

describe('shrinking reports a legible counterexample', () => {
  it('fails with the smallest input when a property is broken', () => {
    // A deliberately false property, to prove the harness reports rather than
    // silently passing. fast-check shrinks to the first date in the range.
    expect(() =>
      fc.assert(
        fc.property(anyDate, (date) => date.getTime() < RANGE_START),
        { seed: 1 },
      ),
    ).toThrowError(/Property failed/);
  });
});
