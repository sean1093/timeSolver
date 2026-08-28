# Usage guide

A task-oriented tour of timeSolver 2.x. For exhaustive signatures see the
[API reference](api.md); for complete answers to specific jobs see the
[recipes](recipes.md); for upgrading from 1.x see the
[migration guide](migration-v1-v2.md). All documents are indexed in
[docs/](README.md).

Also available in [繁體中文](usage.zh.md) and [日本語](usage.ja.md).

## Install and import

```sh
npm install timesolver
```

```ts
// Import only what you use; the rest is tree-shaken away. Later snippets
// assume the matching import for whatever they call.
import {
  add,
  after,
  before,
  between,
  clamp,
  endOf,
  equal,
  getString,
  isBetween,
  isValid,
  max,
  min,
  parse,
  startOf,
  subtract,
} from 'timesolver';
```

```js
// CommonJS
const { add, getString } = require('timesolver');
```

```html
<!-- Browser, no bundler -->
<script src="https://unpkg.com/timesolver/dist/timesolver.global.js"></script>
<script>
  timeSolver.getString(new Date(), 'YYYY-MM-DD');
</script>
```

Every function accepts a `Date`, epoch milliseconds, or a string the language's
`Date` can parse, and works in the host time zone.

## Formatting a date

```ts
const stamp = new Date(2024, 2, 17, 14, 30, 45, 123); // Sun 17 Mar 2024

getString(stamp);                            // '20240317'  (default format)
getString(stamp, 'YYYY-MM-DD');              // '2024-03-17'
getString(stamp, 'YYYY-MM-DD HH:mm:ss.SSS'); // '2024-03-17 14:30:45.123'
getString(stamp, 'ddd, D MMM YYYY');         // 'Sun, 17 Mar 2024'
getString(stamp, 'h:mm a');                  // '2:30 pm'
getString(stamp, '[Quarter] Q [of] YYYY');   // 'Quarter 1 of 2024'
```

Uppercase tokens are the larger unit, lowercase the smaller: `MM` is the month,
`mm` the minute; `DD` the day, `dddd` the weekday name. Wrap literal words in
square brackets so their letters are not read as tokens.

The full token table is in the [API reference](api.md#tokens). Two formats are
refused, both as `INVALID_FORMAT`:

```ts
getString(stamp, 'YYYYMD'); // throws: 'M' runs into 'D', so '2024112' is ambiguous
getString(stamp, 'nope');   // throws: no tokens at all; use '[nope]'
```

Note that single letters are tokens too: `'oops'` renders `'oop45'`, because `s`
is the seconds token. Escape any literal text you did not mean as a token.

Every format name 1.x accepted still works, in any case, so
`getString(stamp, 'YYYY-MM-DD HH:MM:SS')` keeps rendering
`'2024-03-17 14:30:45'`.

## Reading a date from a string

`parse` is strict: the input must match the format exactly, and the resulting
date must render back to the same string.

```ts
parse('17/03/2024', 'DD/MM/YYYY');                  // 2024-03-17 00:00 local
parse('2024-03-17 14:30', 'YYYY-MM-DD HH:mm');      // with a time
parse('03/17/2024 02:30 PM', 'MM/DD/YYYY hh:mm A'); // 12-hour clock

parse('31/02/2024', 'DD/MM/YYYY'); // throws: February has no 31st
parse('2024-3-7', 'YYYY-MM-DD');   // throws: padding does not match
```

Components the format omits default to 1970-01-01, so `parse('12:30:00',
'HH:mm:ss')` is a time on the epoch date — useful for comparing times of day.

## Validating input

```ts
isValid('2020-01-01');               // true  — anything Date can read
isValid('nope');                     // false
isValid('2020-02-29', 'YYYY-MM-DD'); // true  — 2020 is a leap year
isValid('2021-02-29', 'YYYY-MM-DD'); // false
isValid('31-02-2020', 'DD-MM-YYYY'); // false — impossible date
isValid('12:30:00', 'HH:mm:ss');     // true
```

`isValid` never throws for bad data, which makes it the right guard before
calling anything that does:

```ts
function shiftDeadline(input: unknown, days: number): Date | undefined {
  if (typeof input !== 'string' || !isValid(input, 'YYYY-MM-DD')) {
    return undefined;
  }
  return add(parse(input, 'YYYY-MM-DD'), days, 'day');
}
```

## Adding and subtracting

Inputs are never modified; every call returns a new `Date`.

```ts
add(stamp, 90, 'minute');    // exact elapsed time
add(stamp, 1, 'day');        // same wall-clock time tomorrow, DST or not
add(stamp, 1, 'week');
add(stamp, 1, 'month');      // clamped: Jan 31 + 1 month = Feb 29
add(stamp, -1, 'year');
subtract(stamp, 2, 'hour');
```

Unit names are case-insensitive and accept the 1.x abbreviations: `'D'`, `'H'`,
`'MIN'`, `'M'` for month, `'Y'` for year.

Fractions are allowed for milliseconds through hours, and refused for day and
coarser units, where a fraction has no fixed length:

```ts
add(stamp, 1.5, 'hour');  // fine
add(stamp, 1.5, 'month'); // throws INVALID_ARGUMENT
```

## Calendar ranges

```ts
startOf(stamp, 'day');     // 2024-03-17 00:00:00.000
endOf(stamp, 'day');       // 2024-03-17 23:59:59.999
startOf(stamp, 'week');    // 2024-03-17 00:00 (weeks start on Sunday)
startOf(stamp, 'week', { weekStartsOn: 1 }); // 2024-03-11 00:00 (ISO-8601)
startOf(stamp, 'month');   // 2024-03-01 00:00
endOf(stamp, 'month');     // 2024-03-31 23:59:59.999
startOf(stamp, 'quarter'); // 2024-01-01 00:00
```

A month-to-date query, for example:

```ts
const monthStart = startOf(new Date(), 'month');
const monthEnd = endOf(new Date(), 'month');
const rows = all.filter((row) => isBetween(row.createdAt, monthStart, monthEnd));
```

For back-to-back ranges, ask for a half-open interval so neither overlaps nor
leaves a gap:

```ts
isBetween(date, monthStart, add(monthStart, 1, 'month'), undefined, '[)');
```

## Comparing and measuring

```ts
between('2020-01-01T00:00', '2020-01-02T00:00', 'hour');  // 24
between('2020-01-01T00:00', '2020-02-01T00:00', 'month'); // 1
between('2020-01-01T00:00', '2020-01-16T00:00', 'month'); // 0.4838…
```

The basis is chosen per unit so that each answer is the one the unit implies:

- milliseconds through hours measure **exact elapsed time**, so the 23-hour day of a spring transition is `23` hours;
- days and weeks measure the **local calendar**, so that same day is `1`, and noon-to-noon across it is `1` too;
- months, quarters and years measure the **calendar**, with the remainder scaled by the month it falls in.

`between(a, b, unit)` is always the negation of `between(b, a, unit)`.

Comparisons take an optional unit, which sets the granularity:

```ts
equal('2024-03-17T01:00', '2024-03-17T23:00', 'day'); // true, same day
after('2024-03-17T23:00', '2024-03-17T01:00');        // true, later instant
after('2024-03-17T23:00', '2024-03-17T01:00', 'day'); // false, same day
afterToday(add(new Date(), 1, 'day'));                // true
beforeToday(new Date());                              // false
```

## Ranges

```ts
isBetween('2024-03-15T12:00', '2024-03-01T00:00', '2024-04-01T00:00');       // true
isBetween('2024-04-01T00:00', '2024-03-01T00:00', '2024-04-01T00:00', undefined, '[)'); // false
min('2024-03-17T00:00', '2024-01-01T00:00');                                 // 2024-01-01
max('2024-03-17T00:00', '2024-01-01T00:00');                                 // 2024-03-17
clamp('2024-06-01T00:00', '2024-01-01T00:00', '2024-03-01T00:00');           // 2024-03-01
```

`isBetween` takes its bounds in interval notation — `'[]'`, `'[)'`, `'(]'` or
`'()'`. Reach for `'[)'` when ranges are consecutive, so neither overlaps nor
leaves a gap. It also accepts a unit and `weekStartsOn`, like the comparisons
above. `clamp` throws if the lower bound is later than the upper one.

## Calendar helpers

```ts
getFullWeek(stamp);              // 'Sunday'
getAbbrWeek(stamp);              // 'Sun'
getFullMonth(stamp);             // 'March'
getAbbrMonth(stamp);             // 'Mar'
getQuarter(stamp);               // 1
getQuarterByMonth(5);            // 2
getFirstMonthByQuarter(3);       // 7
isLeapYear(2024);                // true
daysInMonth(2024, 2);            // 29
```

Week numbers come in two flavours, because the two conventions disagree at the
turn of the year:

```ts
getISOWeek('2024-12-30T12:00');     // 1  -- ISO-8601: Monday starts week 1
getISOWeekYear('2024-12-30T12:00'); // 2025, not 2024

getWeekOfYear('2024-12-30T12:00');  // 53 -- calendar year, week 1 contains 1 January
```

Render the ISO pair together, never `YYYY` with an ISO week:

```ts
`${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`; // '2025-W01'
```

Names are English and come from a fixed table, so they do not vary by engine or
locale. For localised output, format the parts you need with
`Intl.DateTimeFormat`.

## Handling failures

Bad input throws `TimeSolverError`, which carries a `code` you can branch on:

```ts
import { TimeSolverError, getString } from 'timesolver';

try {
  getString(userInput, userFormat);
} catch (error) {
  if (error instanceof TimeSolverError) {
    switch (error.code) {
      case 'INVALID_DATE':
        return 'That is not a date I can read.';
      case 'INVALID_FORMAT':
        return 'That format string is not valid.';
      default:
        throw error;
    }
  }
  throw error;
}
```

Nothing is written to the console, and no function returns `null` as a sentinel.

## Profiling a slow path

```ts
import { createProfiler } from 'timesolver/profiler';

const profiler = createProfiler();

profiler.start();
const rows = await loadRows();
profiler.mark('load');
const view = render(rows);
profiler.mark('render');

profiler.print();
// [timeSolver] 2 mark(s) in 128.412 ms
//   1. load    96.210 ms  74.9%  <- slowest
//   2. render  32.202 ms  25.1%
```

Each profiler owns its timeline, so nested measurements do not interfere, and
`report()` hands back `{ total, slowest, marks }` for assertions or metrics
instead of console output. The 1.x names `timeLookStart`, `timeLook` and
`timeLookReport` are still exported, so 1.x code and 1.x script tags keep
working.

## Things to know

**String parsing follows the language.** `new Date('2024-03-10')` is UTC
midnight; `new Date('2024-03-10T00:00')` is local. This library hands strings to
`Date`, so the same rule applies. Pass a `Date`, include a time, or use `parse`
with an explicit format when it matters.

**There are no time zones.** Everything is host-local. `Z` and `ZZ` render the
current offset but cannot be parsed. For zone-aware work use `Temporal` or
`Intl.DateTimeFormat`.

**A repeated hour is ambiguous.** When the clocks go back, one wall-clock
reading names two instants, and `parse` resolves to the earlier one. Store
instants rather than wall-clock strings when the difference matters.

**Weeks start on Sunday by default**, matching `Date#getDay`. Pass
`{ weekStartsOn: 1 }` for ISO-8601 weeks, or any day from `0` to `6`, to
`startOf`, `endOf`, `equal`, `after` and `before`:

```ts
startOf(stamp, 'week', { weekStartsOn: 1 }); // Monday
endOf(stamp, 'week', { weekStartsOn: 6 });   // Friday, for a Saturday-start week
```

`between(a, b, 'week')` needs no such option: it measures a span, which does not
depend on where weeks begin.
