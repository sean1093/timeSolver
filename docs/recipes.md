# Recipes

Complete answers to jobs that come up repeatedly. Each one runs as written;
every result shown was produced by executing it. For signatures and edge cases
see the [API reference](api.md).

- [Query a date range without off-by-one errors](#query-a-date-range-without-off-by-one-errors)
- [Build a month-to-date or week-to-date report](#build-a-month-to-date-or-week-to-date-report)
- [Validate a date a user typed](#validate-a-date-a-user-typed)
- [Group rows by week, month or quarter](#group-rows-by-week-month-or-quarter)
- [Label an ISO week correctly](#label-an-iso-week-correctly)
- [Work with ISO weeks in a Monday-first locale](#work-with-iso-weeks-in-a-monday-first-locale)
- [Produce a log timestamp with the offset](#produce-a-log-timestamp-with-the-offset)
- [Convert between a form value and storage](#convert-between-a-form-value-and-storage)
- [Compare dates at a granularity](#compare-dates-at-a-granularity)
- [Clamp a date into an allowed window](#clamp-a-date-into-an-allowed-window)
- [Profile a slow request](#profile-a-slow-request)
- [Things that bite](#things-that-bite)

## Query a date range without off-by-one errors

Use a **half-open** range: inclusive start, exclusive end. Consecutive periods
then neither overlap nor leave a gap, and you never have to reason about
`23:59:59.999`.

```ts
import { add, isBetween, startOf } from 'timesolver';

const start = startOf(new Date(), 'month');
const end = add(start, 1, 'month');

const thisMonth = rows.filter((row) => isBetween(row.createdAt, start, end, { bounds: '[)' }));
```

The alternative, `startOf`/`endOf` with inclusive bounds, is also correct:

```ts
import { endOf, isBetween, startOf } from 'timesolver';

const rows = all.filter((row) =>
  isBetween(row.createdAt, startOf(new Date(), 'month'), endOf(new Date(), 'month')),
);
```

Prefer the half-open form when the ranges are consecutive — monthly buckets, a
paginated timeline — and the `endOf` form when you are showing the boundary to a
human.

## Build a month-to-date or week-to-date report

```ts
import { between, startOf } from 'timesolver';

const now = new Date();

const monthToDate = {
  from: startOf(now, 'month'),
  to: now,
  daysElapsed: between(startOf(now, 'month'), now, 'day'), // 16.6041666… on the 17th at 14:30
};

// Week-to-date, with weeks starting Monday
const weekToDate = {
  from: startOf(now, 'week', { weekStartsOn: 1 }),
  to: now,
};
```

`between(..., 'day')` returns a fraction. `Math.floor` it for "days elapsed",
or ask for `'hour'` if you want elapsed time rather than calendar days.

## Validate a date a user typed

`isValid` never throws for bad data, which makes it the right guard before
anything that does.

```ts
import { isValid, parse } from 'timesolver';

function readDueDate(input: unknown): Date | undefined {
  if (typeof input !== 'string' || !isValid(input, 'YYYY-MM-DD')) {
    return undefined;
  }

  return parse(input, 'YYYY-MM-DD');
}

readDueDate('2024-02-29'); // a Date: 2024 is a leap year
readDueDate('2023-02-29'); // undefined
readDueDate('2024-2-9');   // undefined: padding must match the format
readDueDate(42);           // undefined
```

Validation is strict in both directions — the input must match the format with
nothing left over, and the resulting date must render back to the same string —
so `'31-02-2020'` is rejected and `'2020-02-29'` is not.

## Group rows by week, month or quarter

`startOf` gives a stable key per bucket.

```ts
import { getString, startOf } from 'timesolver';

function bucketKey(date: Date, unit: 'week' | 'month' | 'quarter'): string {
  return getString(startOf(date, unit, { weekStartsOn: 1 }), 'YYYY-MM-DD');
}

const byMonth = new Map<string, Row[]>();

for (const row of rows) {
  const key = bucketKey(row.createdAt, 'month');
  const bucket = byMonth.get(key) ?? [];

  bucket.push(row);
  byMonth.set(key, bucket);
}
```

Keying on the *rendered* start of the bucket rather than on a `Date` matters:
two `Date` objects for the same instant are different map keys.

## Label an ISO week correctly

Always pair `getISOWeek` with `getISOWeekYear`. The ISO week-numbering year is
not always the calendar year.

```ts
import { getISOWeek, getISOWeekYear, getString } from 'timesolver';

function isoWeekLabel(date: Date): string {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`;
}

isoWeekLabel(new Date(2024, 11, 30)); // '2025-W01'
isoWeekLabel(new Date(2023, 0, 1));   // '2022-W52'
```

Using `getString(date, 'YYYY')` instead of `getISOWeekYear` renders
`'2024-W01'` for 30 December 2024 — a week that ends in January, labelled with
the wrong year. That is why there are no `W` format tokens: a token pair that
looks right and is wrong for a few days a year is worse than composing it
explicitly.

## Work with ISO weeks in a Monday-first locale

Everything week-shaped takes `weekStartsOn`, so set it once in a helper rather
than at every call site.

```ts
import { endOf, equal, getISOWeek, startOf } from 'timesolver';

const ISO = { weekStartsOn: 1 } as const;

const weekStart = (date: Date) => startOf(date, 'week', ISO);
const weekEnd = (date: Date) => endOf(date, 'week', ISO);
const sameWeek = (a: Date, b: Date) => equal(a, b, 'week', ISO);

sameWeek(new Date(2024, 2, 11), new Date(2024, 2, 17)); // true: Mon to Sun
sameWeek(new Date(2024, 2, 10), new Date(2024, 2, 11)); // false: different ISO weeks
getISOWeek(new Date(2024, 2, 11));                      // 11
```

`between(a, b, 'week')` needs no option: it measures a span, which does not
depend on where weeks begin.

## Produce a log timestamp with the offset

```ts
import { getString } from 'timesolver';

getString(new Date(), 'YYYY-MM-DD HH:mm:ss.SSS Z'); // '2026-08-28 14:30:45.123 -04:00'
getString(new Date(), 'YYYY-MM-DDTHH:mm:ssZZ');     // '2026-08-28T14:30:45-0400'
```

Both parse back, and the offset in the string is what decides the instant:

```ts
import { getString, parse } from 'timesolver';

const stamp = 'YYYY-MM-DD HH:mm:ss.SSS Z';

parse(getString(date, stamp), stamp).getTime() === date.getTime(); // true, in any zone
parse('2024-03-17T12:00:00+08:00', 'YYYY-MM-DDTHH:mm:ssZ');        // 2024-03-17T04:00:00Z
```

Each token matches the shape it renders — `±HH:MM` for `Z`, `±HHMM` for `ZZ` —
so ISO-8601's bare `Z` designator is refused. For a string already in ISO form,
`Date` parses it, so hand it to any function as it is: `getString(iso, stamp)`.

## Convert between a form value and storage

An `<input type="date">` gives `'YYYY-MM-DD'` in local terms; a database column
usually wants an instant.

```ts
import { getString, isValid, parse, startOf } from 'timesolver';

// form -> storage
const toStorage = (value: string) =>
  isValid(value, 'YYYY-MM-DD') ? parse(value, 'YYYY-MM-DD').toISOString() : undefined;

// storage -> form
const toFormValue = (iso: string) => getString(iso, 'YYYY-MM-DD');

// a day-granularity comparison, so a time of day cannot skew it
const isSameDay = (iso: string, value: string) =>
  startOf(iso, 'day').getTime() === startOf(parse(value, 'YYYY-MM-DD'), 'day').getTime();
```

`parse` builds a local date, so `'2024-03-17'` becomes local midnight, not UTC
midnight. That is almost always what a date picker means.

## Compare dates at a granularity

Every comparison takes an optional unit, which is usually what you want instead
of comparing raw instants.

```ts
import { after, afterToday, before, equal } from 'timesolver';

equal(a, b, 'day');       // the same calendar day
equal(a, b, 'month');     // the same month
after(a, b, 'day');       // a strictly later calendar day
before(a, b, 'hour');     // an earlier clock hour
afterToday(deadline);     // due after today
```

Without a unit these compare exact instants, so two times on the same afternoon
are not equal. That is a common source of "why is my filter empty".

## Clamp a date into an allowed window

```ts
import { add, clamp, max, min } from 'timesolver';

const now = new Date();
const earliest = add(now, -30, 'day');
const latest = add(now, 30, 'day');

const requested = clamp(userSuppliedDate, earliest, latest);

// overlapping windows
const overlapStart = max(rangeA.start, rangeB.start);
const overlapEnd = min(rangeA.end, rangeB.end);
const overlaps = overlapStart.getTime() <= overlapEnd.getTime();
```

`clamp` throws if `lower` is later than `upper`, rather than swapping them: an
inverted window is a bug, and swapping it hides the bug and returns a plausible
answer.

## Profile a slow request

```ts
import { createProfiler } from 'timesolver/profiler';

async function handler(request: Request) {
  const profiler = createProfiler();

  profiler.start();
  const user = await loadUser(request);
  profiler.mark('load user');
  const rows = await loadRows(user);
  profiler.mark('load rows');
  const body = render(rows);
  profiler.mark('render');

  const report = profiler.report();

  if (report.total > 500) {
    logger.warn('slow request', {
      total: report.total,
      slowest: report.slowest?.label,
      marks: report.marks,
    });
  }

  return body;
}
```

`report()` returns structured data, so a threshold check and a metric are one
line each. `print()` is for a terminal or a browser console, not for a log
pipeline. Each profiler owns its timeline, so concurrent requests do not
interfere.

## Things that bite

**A date-only string is UTC.** `new Date('2024-03-17')` is UTC midnight;
`new Date('2024-03-17T00:00')` is local. This library hands strings to `Date`,
so the same rule applies. Pass a `Date`, include a time, or use `parse` with an
explicit format when it matters.

**Single letters are format tokens.** `getString(date, 'oops')` renders
`'oop45'`, because `s` is the seconds token. Escape literal text:
`getString(date, '[oops]')`.

**Month arithmetic does not invert.** 31 December plus 18 months clamps to
30 June, and subtracting 18 months from that gives 30 December. Days 1 to 28
exist in every month, so the round trip is exact there. Every calendar library
behaves this way.

**A repeated hour is ambiguous.** When the clocks go back, one wall-clock
reading names two instants, and `parse` resolves to the earlier one. Store
instants, not wall-clock strings, when the difference matters.

**A skipped hour does not exist.** When the clocks go forward, an hour never
happens, and `parse` rejects it: `parse('2024-03-10 02:30', 'YYYY-MM-DD HH:mm')`
throws `INVALID_DATE` in `America/New_York` and succeeds in `UTC`. So `isValid`
for a wall-clock string depends on the host zone — the same input can be valid
on your laptop and invalid on the server. An offset in the format removes the
question: `'YYYY-MM-DD HH:mmZ'` names an instant outright.

**`between` returns fractions.** `between(a, b, 'day')` is `1.5` for 36 hours.
Truncate if you want whole units, or ask for a finer unit.
