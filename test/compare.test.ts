import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { after, afterToday, before, beforeToday, between, equal } from '../src/compare.js';
import { add } from '../src/manipulate.js';
import { UNITS } from '../src/units.js';

describe('between exact units', () => {
  it.each([
    ['millisecond', 1000],
    ['second', 1],
  ])('measures a second as %s = %d', (unit, expected) => {
    expect(between(new Date(2024, 0, 1, 0, 0, 0), new Date(2024, 0, 1, 0, 0, 1), unit)).toBe(
      expected,
    );
  });

  it('defaults to milliseconds', () => {
    expect(between(new Date(0), new Date(1000))).toBe(1000);
  });

  it('keeps the v1 result for whole hours', () => {
    expect(between('2020-01-01', '2020-01-02', 'H')).toBe(24);
    expect(between(new Date(2020, 0, 1), new Date(2020, 0, 2), 'hour')).toBe(24);
  });

  it('is signed', () => {
    expect(between(new Date(2020, 0, 2), new Date(2020, 0, 1), 'hour')).toBe(-24);
  });

  it('returns fractions', () => {
    expect(between(new Date(2020, 0, 1, 0), new Date(2020, 0, 1, 0, 30), 'hour')).toBe(0.5);
    expect(between(new Date(2020, 0, 1, 0), new Date(2020, 0, 1, 0, 0, 30), 'minute')).toBe(0.5);
  });
});

describe('between calendar day and week', () => {
  it('counts whole days and the fraction of a day', () => {
    expect(between(new Date(2020, 0, 1), new Date(2020, 0, 2), 'day')).toBe(1);
    expect(between(new Date(2020, 0, 1), new Date(2020, 0, 1, 12), 'day')).toBe(0.5);
    expect(between(new Date(2020, 0, 1, 18), new Date(2020, 0, 2, 6), 'day')).toBe(0.5);
    expect(between(new Date(2020, 0, 1), new Date(2020, 0, 31), 'day')).toBe(30);
  });

  it('reports one day across a daylight-saving change, where elapsed time is 23 or 25 hours', () => {
    expect(between(new Date(2024, 2, 10), new Date(2024, 2, 11), 'day')).toBe(1);
    expect(between(new Date(2024, 2, 10), new Date(2024, 2, 11), 'hour')).toBe(23);
    expect(between(new Date(2024, 10, 3), new Date(2024, 10, 4), 'day')).toBe(1);
    expect(between(new Date(2024, 10, 3), new Date(2024, 10, 4), 'hour')).toBe(25);
  });

  it('reports one day between the same local time on adjacent dates, DST or not', () => {
    // Reading the remainder from elapsed milliseconds instead of the clock
    // fields reported 0.958 here, and 1.042 across the autumn transition.
    expect(between(new Date(2024, 2, 9, 12), new Date(2024, 2, 10, 12), 'day')).toBe(1);
    expect(between(new Date(2024, 10, 2, 12), new Date(2024, 10, 3, 12), 'day')).toBe(1);
    expect(between(new Date(2024, 2, 9, 12, 30), new Date(2024, 2, 11, 12, 30), 'day')).toBe(2);
    expect(between(new Date(2024, 2, 1), new Date(2024, 3, 1), 'day')).toBe(31);
  });

  it('keeps the fraction of a day offset-independent across a transition', () => {
    expect(between(new Date(2024, 2, 9, 18), new Date(2024, 2, 10, 6), 'day')).toBe(0.5);
    expect(between(new Date(2024, 10, 2, 18), new Date(2024, 10, 3, 6), 'day')).toBe(0.5);
  });

  it('divides calendar days by seven for weeks', () => {
    expect(between(new Date(2020, 0, 1), new Date(2020, 0, 8), 'week')).toBe(1);
    expect(between(new Date(2024, 2, 6), new Date(2024, 2, 13), 'week')).toBe(1);
  });
});

describe('between calendar month, quarter and year', () => {
  it('reports whole calendar months exactly', () => {
    // v1 divided by an average month and reported 1.0184804928131417.
    expect(between(new Date(2020, 0, 1), new Date(2020, 1, 1), 'month')).toBe(1);
    expect(between(new Date(2020, 0, 31), new Date(2020, 1, 29), 'month')).toBe(1);
    expect(between(new Date(2020, 0, 1), new Date(2020, 11, 1), 'month')).toBe(11);
  });

  it('reports whole calendar years exactly', () => {
    // v1 reported 1.002053388090349.
    expect(between(new Date(2020, 0, 1), new Date(2021, 0, 1), 'year')).toBe(1);
    expect(between(new Date(2020, 0, 1), new Date(2024, 0, 1), 'year')).toBe(4);
  });

  it('reports whole quarters exactly', () => {
    expect(between(new Date(2020, 0, 1), new Date(2020, 3, 1), 'quarter')).toBe(1);
    expect(between(new Date(2020, 0, 1), new Date(2021, 0, 1), 'quarter')).toBe(4);
  });

  it('scales the remainder by the length of the month it falls in', () => {
    // Half of a 31-day January.
    expect(between(new Date(2020, 0, 1), new Date(2020, 0, 16), 'month')).toBeCloseTo(15 / 31, 10);
    // Half of a 29-day February.
    expect(between(new Date(2020, 1, 1), new Date(2020, 1, 15), 'month')).toBeCloseTo(14 / 29, 10);
  });

  it('is signed for calendar units', () => {
    expect(between(new Date(2020, 1, 1), new Date(2020, 0, 1), 'month')).toBe(-1);
    expect(between(new Date(2021, 0, 1), new Date(2020, 0, 1), 'year')).toBe(-1);
    expect(between(new Date(2020, 0, 16), new Date(2020, 0, 1), 'month')).toBeCloseTo(-15 / 31, 10);
  });

  it('returns zero for identical instants', () => {
    const stamp = new Date(2020, 5, 15, 12, 30);

    expect(between(stamp, stamp, 'month')).toBe(0);
    expect(between(stamp, stamp, 'day')).toBe(0);
  });
});

describe('between antisymmetry', () => {
  // Month arithmetic clamps, so a naive reverse measurement disagreed with the
  // forward one: Jan 31 to Feb 29 was 1, and the reverse was -0.935.
  const PAIRS: ReadonlyArray<readonly [Date, Date, string]> = [
    [new Date(2024, 0, 31), new Date(2024, 1, 29), 'clamped month end'],
    [new Date(2020, 1, 29), new Date(2020, 2, 31), 'leap day to month end'],
    [new Date(2024, 0, 31), new Date(2024, 3, 30), 'across a quarter'],
    [new Date(2024, 2, 9, 12), new Date(2024, 2, 10, 12), 'across a spring transition'],
    [new Date(2024, 10, 2, 12), new Date(2024, 10, 3, 12), 'across an autumn transition'],
    [new Date(2023, 5, 15, 8, 30, 15, 250), new Date(2026, 0, 2, 21, 45), 'a long odd span'],
  ];

  it.each(
    UNITS.flatMap((unit) => PAIRS.map(([from, to, label]) => [unit, label, from, to] as const)),
  )('between(a, b, %s) is the negation of between(b, a) for %s', (unit, _label, from, to) => {
    // `+ 0` normalises -0, which Object.is distinguishes from 0.
    expect(between(from, to, unit) + 0).toBe(-between(to, from, unit) + 0);
  });
});

describe('between failures', () => {
  it('throws for an unknown unit instead of logging and returning zero', () => {
    expect(() => between(new Date(), new Date(), 'fortnight')).toThrowError(/Unknown time unit/);
  });

  it('throws for unreadable input', () => {
    expect(() => between('nope', new Date(), 'day')).toThrowError(/Cannot read a date/);
  });
});

describe('equal', () => {
  it('compares instants, milliseconds included', () => {
    // v1 compared Date#toString(), which has no millisecond field.
    expect(equal('2020-01-01T00:00:00.001Z', '2020-01-01T00:00:00.999Z')).toBe(false);
    expect(equal('2020-01-01T00:00:00.001Z', '2020-01-01T00:00:00.001Z')).toBe(true);
  });

  it('compares at a coarser unit when asked', () => {
    expect(equal('2020-01-01T00:00:00.001Z', '2020-01-01T00:00:00.999Z', 'second')).toBe(true);
    expect(equal(new Date(2020, 0, 1, 1), new Date(2020, 0, 1, 23), 'day')).toBe(true);
    expect(equal(new Date(2020, 0, 1), new Date(2020, 0, 2), 'day')).toBe(false);
    expect(equal(new Date(2020, 0, 31), new Date(2020, 0, 1), 'month')).toBe(true);
    expect(equal(new Date(2020, 2, 31), new Date(2020, 0, 1), 'quarter')).toBe(true);
  });

  it('throws for unreadable input rather than crashing on null', () => {
    expect(() => equal('nope', 'nope')).toThrowError(/Cannot read a date/);
  });
});

describe('after and before', () => {
  it('compares instants when no unit is given', () => {
    expect(after(new Date(2020, 0, 2), new Date(2020, 0, 1))).toBe(true);
    expect(after(new Date(2020, 0, 1), new Date(2020, 0, 2))).toBe(false);
    expect(before(new Date(2020, 0, 1), new Date(2020, 0, 2))).toBe(true);
    expect(before(new Date(2020, 0, 2), new Date(2020, 0, 1))).toBe(false);
  });

  it('honours the unit argument, which v1 accepted and ignored', () => {
    const evening = new Date(2020, 0, 1, 23);
    const morning = new Date(2020, 0, 1, 1);

    expect(after(evening, morning)).toBe(true);
    expect(after(evening, morning, 'day')).toBe(false);
    expect(before(morning, evening, 'day')).toBe(false);
    expect(after(new Date(2020, 0, 2), morning, 'day')).toBe(true);
    expect(before(new Date(2019, 11, 31), morning, 'day')).toBe(true);
  });

  it('is strict, so an equal instant is neither after nor before', () => {
    const stamp = new Date(2020, 0, 1, 12);

    expect(after(stamp, stamp)).toBe(false);
    expect(before(stamp, stamp)).toBe(false);
    expect(after(stamp, stamp, 'day')).toBe(false);
  });
});

describe('afterToday and beforeToday', () => {
  // Both functions read the clock themselves, so a test that also reads it is
  // comparing two different instants and would flip if a tick crossed midnight
  // between them. Pinning "now" makes the day boundary assertable instead.
  const NOW = new Date(2024, 2, 17, 14, 30, 45, 123);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('compares calendar days against now', () => {
    expect(afterToday(add(NOW, 1, 'day'))).toBe(true);
    expect(afterToday(add(NOW, -1, 'day'))).toBe(false);
    expect(beforeToday(add(NOW, -1, 'day'))).toBe(true);
    expect(beforeToday(add(NOW, 1, 'day'))).toBe(false);
  });

  it('treats any time today as neither before nor after today', () => {
    for (const time of [NOW, new Date(2024, 2, 17), new Date(2024, 2, 17, 23, 59, 59, 999)]) {
      expect(afterToday(time)).toBe(false);
      expect(beforeToday(time)).toBe(false);
    }
  });

  it('turns over at midnight, not at the current time of day', () => {
    expect(beforeToday(new Date(2024, 2, 16, 23, 59, 59, 999))).toBe(true);
    expect(afterToday(new Date(2024, 2, 18, 0, 0, 0, 0))).toBe(true);
  });
});

describe('between across the whole representable range', () => {
  const MAX_TIME = 8.64e15;
  const first = new Date(-MAX_TIME);
  const last = new Date(MAX_TIME);

  it.each(['month', 'quarter', 'year'])('measures the full span in %ss', (unit) => {
    // The anchor carries the start's day of month, so it overshot the range
    // even though both endpoints are inside it, and the whole call threw
    // INVALID_ARGUMENT about a shift the caller never asked for.
    const forward = between(first, last, unit);

    expect(Number.isFinite(forward)).toBe(true);
    expect(forward).toBeGreaterThan(0);
    expect(between(last, first, unit)).toBe(-forward);
  });

  it('keeps the whole-month count of the full span', () => {
    // 547,581 years and five months, give or take the fraction.
    expect(between(first, last, 'month')).toBeGreaterThan(6_570_976);
    expect(between(first, last, 'month')).toBeLessThan(6_570_978);
  });
});
