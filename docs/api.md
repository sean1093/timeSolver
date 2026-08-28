# API reference

Every function is pure: it reads its arguments and returns a new value. Nothing
is written to the console, and nothing mutates the `Date` you pass in.

Task-oriented answers live in the [recipes](recipes.md); what this project
promises about versions and runtimes is in the [support policy](support.md).

- [Conventions](#conventions)
- [Arithmetic](#arithmetic)
- [Comparison](#comparison)
- [Ranges](#ranges)
- [Formatting, parsing and validation](#formatting-parsing-and-validation)
- [Calendar helpers](#calendar-helpers)
- [Profiling](#profiling)
- [Errors](#errors)
- [Types](#types)

## Conventions

**Date inputs.** Anywhere a date is expected you may pass a `Date`, an epoch
millisecond number, or a string the language's `Date` constructor understands.
A `Date` from another realm — an iframe, a worker, a `node:vm` context — is
accepted too.

```ts
getString(new Date(2024, 2, 17), 'YYYY-MM-DD'); // from a Date
getString(1710648000000, 'YYYY-MM-DD');         // from epoch milliseconds
getString('2024-03-17T12:00:00', 'YYYY-MM-DD'); // from a string
```

Anything else — `null`, `undefined`, an object, an Invalid Date, a number
outside the `Date` range — throws `TimeSolverError` with code `INVALID_DATE`.

**Time zone.** All functions work in the host time zone. There is no zone
parameter; see [Scope](../README.md#scope).

**Units.** Every `unit` parameter accepts any alias, in any case:

| Canonical | Aliases |
|---|---|
| `millisecond` | `milliseconds` `mill` `ms` `msec` |
| `second` | `seconds` `sec` `s` |
| `minute` | `minutes` `min` |
| `hour` | `hours` `hr` `h` |
| `day` | `days` `d` |
| `week` | `weeks` `w` |
| `month` | `months` `mon` `m` |
| `quarter` | `quarters` `q` |
| `year` | `years` `yr` `y` |

An unknown alias throws `INVALID_UNIT`. Where `unit` is optional it defaults to
`millisecond`, matching 1.x.

## Arithmetic

### `add(date, amount?, unit?): Date`

Returns a new `Date` shifted by `amount` units. `amount` defaults to `0`,
`unit` to `millisecond`. Negative amounts subtract.

```ts
add(new Date(2024, 0, 15), 90, 'minute'); // 2024-01-15 01:30 local
add('2024-01-31T12:00', 1, 'month');      // 2024-02-29 12:00
add('2024-01-31T12:00', 1, 'M');          // same, 1.x alias
add('2024-03-09T12:00', 1, 'day');        // 2024-03-10 12:00, DST or not
```

Behaviour per unit:

| Units | Basis |
|---|---|
| `millisecond` … `hour` | exact multiples of the unit length; fractional amounts allowed |
| `day`, `week` | local calendar, so the wall-clock time survives a daylight-saving change; whole amounts only |
| `month`, `quarter`, `year` | local calendar, clamped to the last valid day of the target month; whole amounts only |

Clamping is what makes `add(Jan 31, 1, 'month')` land on February 29 rather
than overflowing into March, which is what the native `setMonth` does and what
1.x returned.

Throws `INVALID_ARGUMENT` for a non-finite `amount`, or a fractional amount of
a calendar unit — a third of a month has no defined length, so it is refused
rather than rounded.

Clamping also means month arithmetic is **not invertible**: 31 December plus 18
months clamps to 30 June, and subtracting 18 months from that gives 30 December,
not 31. Days 1 to 28 exist in every month, so the round trip is exact there.
This is true of every calendar library; it is a property of calendars, not a
defect, but it is worth knowing before you rely on `subtract(add(d, n, 'month'),
n, 'month')` returning `d`.

Day and week arithmetic has a smaller version of the same wrinkle. It keeps the
wall-clock time, so a step can land on a local time that does not exist —
`2023-03-12 02:00` in `America/New_York` is skipped — and the runtime normalises
it forward to `03:00`. The calendar date is always what you asked for; the clock
can move by one transition.

### `subtract(date, amount?, unit?): Date`

`add` with the amount negated. Same rules, same errors.

```ts
subtract('2024-03-31T00:00', 1, 'month'); // 2024-02-29
```

### `startOf(date, unit, options?): Date`

Beginning of the local calendar unit containing `date`.

```ts
startOf('2024-05-15T14:30:45.123', 'day');     // 2024-05-15 00:00:00.000
startOf('2024-05-15T14:30:45.123', 'week');    // 2024-05-12 00:00:00.000
startOf('2024-05-15T14:30:45.123', 'quarter'); // 2024-04-01 00:00:00.000
```

`unit` is required here. `startOf(date, 'millisecond')` is a plain copy.

`options.weekStartsOn` moves the week boundary. It is `0` (Sunday) by default,
matching `Date#getDay`, and every unit other than `'week'` ignores it:

```ts
startOf('2024-03-13', 'week');                      // Sunday 2024-03-10
startOf('2024-03-13', 'week', { weekStartsOn: 1 }); // Monday 2024-03-11 (ISO-8601)
startOf('2024-03-13', 'week', { weekStartsOn: 6 }); // Saturday 2024-03-09
```

A value outside 0–6, or a non-integer, throws `INVALID_ARGUMENT`.

### `endOf(date, unit, options?): Date`

Last representable millisecond of the unit. Takes the same `options` as
`startOf`.

```ts
endOf('2024-02-10T00:00', 'month');                 // 2024-02-29 23:59:59.999
endOf('2024-05-15T00:00', 'week');                  // Saturday 2024-05-18 23:59:59.999
endOf('2024-05-15T00:00', 'week', { weekStartsOn: 1 }); // Sunday 2024-05-19 23:59:59.999
```

A week is not always 604 800 000 ms long: one containing a daylight-saving
change is an hour shorter or longer. `endOf` is defined by the calendar, not by
that arithmetic, so it always lands on the last millisecond of the seventh day.

## Comparison

### `between(from, to, unit?): number`

Signed difference `to − from` expressed in `unit`.

```ts
between('2020-01-01T00:00', '2020-01-02T00:00', 'hour');  // 24
between('2020-01-01T00:00', '2020-02-01T00:00', 'month'); // 1
between('2020-01-01T00:00', '2021-01-01T00:00', 'year');  // 1
between('2020-01-01T00:00', '2020-01-16T00:00', 'month'); // 0.4838709677419355
```

Basis per unit:

| Units | Basis | Example |
|---|---|---|
| `millisecond` … `hour` | exact elapsed time | the 23-hour day of a spring transition is `23` hours |
| `day`, `week` | whole local calendar days plus the wall-clock time-of-day remainder | that same day is `1`; noon to noon across it is also `1` |
| `month`, `quarter`, `year` | whole calendar months plus a remainder scaled by the length of the month it falls in | January 1 to February 1 is exactly `1` |

Two guarantees worth relying on:

- `between(a, b, unit) === -between(b, a, unit)` for every unit.
- Whole calendar spans return integers, with no floating-point drift from average month lengths.

### `equal(first, second, unit?, options?): boolean`

Whether two dates are the same instant. With `unit`, compares `startOf(unit)`
instead.

```ts
equal('2020-01-01T00:00:00.001', '2020-01-01T00:00:00.999');           // false
equal('2020-01-01T00:00:00.001', '2020-01-01T00:00:00.999', 'second'); // true
equal('2020-01-05T01:00', '2020-01-05T23:00', 'day');                  // true
```

All three comparisons accept the same `options` as `startOf`, which matters when
the unit is `'week'`:

```ts
// 2024-03-10 is a Sunday, 2024-03-16 the Saturday after it. A time is included
// because a date-only string is parsed as UTC, which can shift the local date.
equal('2024-03-10T12:00', '2024-03-16T12:00', 'week');                      // true
equal('2024-03-10T12:00', '2024-03-16T12:00', 'week', { weekStartsOn: 1 }); // false
```

### `after(first, second, unit?, options?): boolean`

Whether `first` is strictly after `second`, compared at `unit` granularity.

```ts
after('2020-01-01T23:00', '2020-01-01T01:00');        // true
after('2020-01-01T23:00', '2020-01-01T01:00', 'day'); // false, same day
```

### `before(first, second, unit?, options?): boolean`

The mirror of `after`. Equal instants are neither after nor before.

### `afterToday(date): boolean` / `beforeToday(date): boolean`

Whether `date` falls on a later, or earlier, calendar day than today. Any time
today is neither.

## Ranges

### `isBetween(date, start, end, unit?, bounds?, options?): boolean`

Whether `date` falls between `start` and `end`.

`bounds` is interval notation: `[` and `]` include an endpoint, `(` and `)`
exclude it. It defaults to `'[]'`, both inclusive.

```ts
isBetween('2024-03-15T12:00', '2024-03-01T00:00', '2024-04-01T00:00');       // true
isBetween('2024-03-01T00:00', '2024-03-01T00:00', '2024-04-01T00:00');       // true, inclusive
isBetween('2024-04-01T00:00', '2024-03-01T00:00', '2024-04-01T00:00', undefined, '[)'); // false
```

`'[)'` is usually what a date range wants: a month runs from 1 January up to but
not including 1 February, so consecutive ranges neither overlap nor leave a gap.

`unit` compares at a granularity, as `equal` does, and `options` carries
`weekStartsOn`:

```ts
// 2024-03-31 is inside March, so a month-granularity test includes it
isBetween('2024-03-31T23:00', '2024-03-01T00:00', '2024-03-15T00:00');          // false
isBetween('2024-03-31T23:00', '2024-03-01T00:00', '2024-03-15T00:00', 'month'); // true
```

A reversed range returns `false` rather than being silently reordered, because a
range given backwards is usually a bug and hiding it does the caller no favours.
Unrecognised `bounds` throw `INVALID_ARGUMENT`.

### `min(first, ...rest): Date` / `max(first, ...rest): Date`

Earliest and latest of the dates given. At least one argument is required, which
the types enforce, so there is no empty case to define. Both return a new `Date`,
and of equal dates the first wins.

```ts
min('2024-03-17T00:00', '2024-01-01T00:00', '2024-12-31T00:00'); // 2024-01-01
max(new Date(0), '2024-01-01T00:00', 1_700_000_000_000);         // 2024-01-01
```

### `clamp(date, lower, upper): Date`

Constrains `date` to a range, returning the nearest endpoint when it falls
outside.

```ts
clamp('2024-02-01T00:00', '2024-01-01T00:00', '2024-03-01T00:00'); // 2024-02-01
clamp('2024-06-01T00:00', '2024-01-01T00:00', '2024-03-01T00:00'); // 2024-03-01
```

Throws `INVALID_ARGUMENT` when `lower` is later than `upper`. There is no
sensible answer for an inverted range, and swapping the arguments would hide the
caller's mistake.

## Formatting, parsing and validation

These three share one token table, so a format that renders also parses and
validates.

### Tokens

| Token | Meaning | Example |
|---|---|---|
| `YYYY` | year, 4 digits | `2026` |
| `YY` | year, 2 digits | `26` |
| `MMMM` | month name | `January` |
| `MMM` | month name, short | `Jan` |
| `MM` | month, 2 digits | `01` |
| `M` | month | `1` |
| `DD` | day of month, 2 digits | `05` |
| `D` | day of month | `5` |
| `dddd` | weekday name | `Monday` |
| `ddd` | weekday name, short | `Mon` |
| `HH` | hour, 24-hour, 2 digits | `13` |
| `H` | hour, 24-hour | `13` |
| `hh` | hour, 12-hour, 2 digits | `01` |
| `h` | hour, 12-hour | `1` |
| `mm` | minute, 2 digits | `07` |
| `m` | minute | `7` |
| `ss` | second, 2 digits | `09` |
| `s` | second | `9` |
| `SSS` | millisecond, 3 digits | `042` |
| `A` | meridiem, upper case | `PM` |
| `a` | meridiem, lower case | `pm` |
| `Q` | quarter | `1` |
| `Z` | UTC offset with a colon | `+08:00` |
| `ZZ` | UTC offset | `+0800` |
| `[…]` | literal text | `[at]` renders `at` |

Two rules the tokenizer enforces, both as `INVALID_FORMAT`:

- **A variable-width token may not run straight into another numeric token.**
  `'YYYYMD'` would render 12 January 2024 as `'2024112'`, which reads equally
  well as month 11, day 2. Use `'YYYYMMDD'`, or separate the tokens:
  `'YYYY-M-D'`.
- **A format must contain at least one token**, or explicitly escaped text.
  `'!!!'` is refused; `'[!!!]'` is fine.

`Z` and `ZZ` render but cannot be parsed: reading an offset would mean
representing an instant in a zone this library does not model.

### `getString(date, format?): string`

Renders `date`. `format` defaults to `'YYYYMMDD'`, as in 1.x.

```ts
getString(new Date(2024, 2, 17, 14, 30, 45, 123));                          // '20240317'
getString(new Date(2024, 2, 17, 14, 30, 45, 123), 'YYYY-MM-DD HH:mm:ss.SSS'); // '2024-03-17 14:30:45.123'
getString(new Date(2024, 2, 17), 'ddd, D MMM YYYY');                        // 'Sun, 17 Mar 2024'
getString(new Date(2024, 2, 17), '[Week of] MMMM D');                       // 'Week of March 17'
```

Throws `INVALID_FORMAT` for a malformed format. 1.x returned the string
`'[timeSolver] Input Type Error'`, which flowed into output unnoticed.

### `parse(input, format): Date`

Strict in both directions: `input` must match `format` exactly, with nothing
left over, and the resulting date must render back to the same string. That
round trip is what rejects impossible dates.

```ts
parse('17/03/2024', 'DD/MM/YYYY');            // 2024-03-17 00:00 local
parse('2020-02-29', 'YYYY-MM-DD');            // fine, 2020 is a leap year
parse('2021-02-29', 'YYYY-MM-DD');            // throws INVALID_DATE
parse('03/17/2024 02:30 PM', 'MM/DD/YYYY hh:mm A'); // 14:30
parse('2024-03-17 Monday', 'YYYY-MM-DD dddd'); // throws: it is a Sunday
```

Components the format omits default to 1970-01-01T00:00:00.000 local time, so
`parse('12:30:00', 'HH:mm:ss')` is a time on the epoch date.

Details worth knowing:

- Padding is checked. `'2024-03-07'` does not match `'YYYY-M-D'`, and `'2024-3-7'` does not match `'YYYY-MM-DD'`.
- `YY` maps 00–68 to the 2000s and 69–99 to the 1900s, as POSIX does.
- Month and weekday names are matched case-sensitively against the English table.
- `hh`/`h` without `A`/`a` are read as morning hours, so `parse('12:30', 'hh:mm')` is 00:30, not noon.
- Throws `INVALID_ARGUMENT` if `input` is not a string.
- A wall-clock string can be **ambiguous**. When the clocks go back, an hour repeats, so one local reading names two instants — `America/New_York` read `01:59` twice on 1946-09-29. `parse` resolves to the earlier of the two. The text always round-trips; the instant does not, in that hour.

### `isValid(input, format?): boolean`

Without `format`, whether `input` can be read as a date at all. With `format`,
whether it matches that format exactly.

```ts
isValid('2020-01-01');                 // true
isValid('nope');                       // false
isValid(new Date('nope'));             // false
isValid('2020-02-29', 'YYYY-MM-DD');   // true
isValid('31-02-2020', 'DD-MM-YYYY');   // false
isValid('12:30:00', 'HH:MM:SS');       // true, a 1.x format name
```

`isValid` never throws for bad *data* — that is the question it answers. It does
throw `INVALID_FORMAT` when the *format* is malformed, because that is a bug in
the calling code rather than a property of the data.

## Calendar helpers

| Function | Returns |
|---|---|
| `getFullWeek(date)` | `'Monday'` |
| `getAbbrWeek(date)` | `'Mon'` |
| `getFullMonth(date)` | `'March'` |
| `getAbbrMonth(date)` | `'Mar'` |
| `getQuarter(date)` | `1`–`4` |
| `weekdayName(index)` | `'Sunday'` for `0`; throws `INVALID_ARGUMENT` outside 0–6 |
| `weekdayAbbreviation(index)` | `'Sun'` for `0` |
| `monthName(month)` | `'January'` for `1`; throws `INVALID_ARGUMENT` outside 1–12 |
| `monthAbbreviation(month)` | `'Jan'` for `1` |
| `getQuarterByMonth(month)` | quarter for a month number, or `null` when out of range |
| `getFirstMonthByQuarter(quarter)` | first month of a quarter, or `null` when out of range |
| `isLeapYear(year)` | proleptic Gregorian leap year test; throws `INVALID_ARGUMENT` for a non-integer |
| `daysInMonth(year, month)` | 28–31; throws `INVALID_ARGUMENT` for a non-integer year or an out-of-range month |

Names come from a fixed English table. 1.x sliced `Date#toString()`, whose text
depends on the engine and its locale.

`getQuarterByMonth` and `getFirstMonthByQuarter` return `null` rather than
throwing, preserving 1.x behaviour.

### Week numbers

Two conventions exist and they disagree at the turn of the year, so both are
available under names that say which is which.

`getISOWeek(date)` and `getISOWeekYear(date)` implement ISO-8601: weeks start on
Monday and week 1 is the week containing 4 January. The week number runs 1–53,
and the **week-numbering year is not always the calendar year**:

```ts
getISOWeek('2024-01-01T12:00');     // 1
getISOWeekYear('2024-01-01T12:00'); // 2024

getISOWeek('2024-12-30T12:00');     // 1   -- a Monday, so week 1 has started
getISOWeekYear('2024-12-30T12:00'); // 2025

getISOWeek('2023-01-01T12:00');     // 52  -- a Sunday, so it belongs to 2022
getISOWeekYear('2023-01-01T12:00'); // 2022
```

Always render the pair together. Combining `getISOWeek` with `YYYY` produces a
wrong label for a few days either side of January:

```ts
// Right
`${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`; // '2025-W01'

// Wrong for 2024-12-30: says 2024-W01, a week that ended in January
`${getString(date, 'YYYY')}-W${String(getISOWeek(date)).padStart(2, '0')}`;
```

`getWeekOfYear(date, options?)` is the plainer reading: week 1 is the week
containing 1 January, counted in the calendar year, with the same
`weekStartsOn` option as `startOf`. The first and last weeks may be partial, so
the result runs 1 to as high as 54.

```ts
getWeekOfYear('2024-01-01T12:00');                      // 1
getWeekOfYear('2024-01-07T12:00');                      // 2
getWeekOfYear('2024-01-07T12:00', { weekStartsOn: 1 }); // 1
getWeekOfYear('2024-12-31T12:00');                      // 53
```

There are deliberately no `W` format tokens. A week number cannot be parsed back
into a date on its own, and a token pair that renders `YYYY` next to a week
number would be wrong at the year boundary — the composition above is explicit
about which year it means.

## Profiling

Available from the root export and from `timesolver/profiler`.

### `createProfiler(): Profiler`

An isolated timeline on `performance.now()`.

```ts
import { createProfiler } from 'timesolver/profiler';

const profiler = createProfiler();

profiler.start();          // begin, discarding earlier marks
work();
profiler.mark('work');     // close and label a segment
const report = profiler.report();
profiler.print();          // print the report, and return it
```

`report()` returns:

```ts
{
  total: number,                 // ms from start() to the last mark
  slowest: ProfileMark | undefined,
  marks: Array<{ label: string, ms: number, share: number }>,
}
```

`share` is the fraction of the run a segment took, 0 to 1. `print()` writes
CSS-styled lines when a `window` exists and plain text otherwise.

`mark` and `report` throw `INVALID_ARGUMENT` if called before `start()`, and
`mark` requires a non-empty string label.

Each profiler owns its state, so nested and concurrent measurements do not
interfere. The 1.x names `timeLookStart()`, `timeLook(label)` and
`timeLookReport()` drive one shared instance. They are exported by name as well
as on the default object, so the browser global carries them for 1.x script
tags.

## Errors

```ts
import { TimeSolverError } from 'timesolver';

try {
  getString('not a date', 'YYYY');
} catch (error) {
  if (error instanceof TimeSolverError) {
    error.code; // 'INVALID_DATE'
  }
}
```

| Code | Meaning |
|---|---|
| `INVALID_DATE` | the input could not be read as a date, or does not match the given format |
| `INVALID_UNIT` | the unit is not a recognised alias |
| `INVALID_FORMAT` | the format string is malformed: empty, tokenless, unbalanced brackets, ambiguous adjacent tokens, or a format-only token where parsing was requested |
| `INVALID_ARGUMENT` | an argument is outside its documented domain |

Messages are prefixed `[timeSolver]`, as in 1.x.

## Types

```ts
import type {
  Bounds,             // '[]' | '[)' | '(]' | '()'
  DateInput,          // Date | string | number
  ExactUnit,          // units with a fixed millisecond length
  ProfileMark,
  ProfileReport,
  Profiler,
  TimeSolverErrorCode,
  Unit,               // canonical unit names
  UnitAlias,          // every accepted lowercase alias
  UnitInput,          // what a unit parameter accepts
  WeekDay,            // 0 (Sunday) through 6 (Saturday)
  WeekOptions,        // { weekStartsOn?: WeekDay }
} from 'timesolver';
```

`UNITS` is exported as a runtime array of the nine canonical unit names, and
`DEFAULT_FORMAT` as `'YYYYMMDD'`.
