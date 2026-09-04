# Migrating from 1.x to 2.0

Most 1.x call sites compile and run unchanged. What changed is that they stopped
being wrong.

Names, argument orders, unit abbreviations and every 1.x format name are
preserved. The breaking changes are in **error handling** and in **results that
were incorrect**.

> **Which 1.x?** The behaviour described below is the 1.x source this rewrite
> replaced — the last state of the repository, which is also what the
> [design spec](specs/2026-08-28-v2-renovation-design.md) audited. The tarball
> published as `timesolver@1.2.0` is an older build: it accepts 27 of the 36
> format names 2.0 recognises — the nine `DD`-first names are new in 2.0 — and its
> `main` points at a file the tarball does not contain, so `require('timesolver')`
> never worked. Where the two 1.x builds differ in a way that changes what you
> should do, it is called out inline.

- [Start here](#start-here)
- [Breaking: errors instead of null](#breaking-errors-instead-of-null)
- [Breaking: results that were wrong](#breaking-results-that-were-wrong)
- [Breaking: input handling](#breaking-input-handling)
- [Breaking: packaging](#breaking-packaging)
- [Breaking: the profiler](#breaking-the-profiler)
- [New in 2.0](#new-in-20)
- [Unchanged](#unchanged)

## Start here

```sh
npm install timesolver@2
```

Then work through this checklist:

1. **Find every place you check for `null`.** 1.x returned `null` after logging to the console; 2.0 throws. See below.
2. **Find every `try`-free call on untrusted input.** Wrap it, or guard with `isValid`, which never throws for bad data.
3. **Find every use of `between` with `'M'`, `'Y'`, or `'D'`.** The numbers change, because the old ones were wrong.
4. **Find every `after`/`before` call that passes a unit.** The unit is now honoured, so results change.
5. **Find any defensive copy you made before calling `add`/`subtract`.** You can delete it; inputs are no longer mutated.
6. **Run your test suite.** 1.x behaviour that survived on `console.error` and `null` now surfaces as a thrown `TimeSolverError`.

If you cannot make these changes now, `timesolver@1` remains installable.

## Breaking: errors instead of null

1.x wrote to `console.error` and returned `null`, so callers either checked for
`null` or crashed later on a `TypeError` far from the cause.

```js
// 1.x
const result = timeSolver.add('nonsense', 1, 'D');
// logs '[timeSolver] Invalid Date', then returns null — or, in the published
// 1.2.0 build, throws TypeError from inside the library
if (result === null) { /* ... */ }

timeSolver.getFullWeek('nonsense');
// logs, then throws TypeError: Cannot read properties of null (reading 'getDay')
```

```ts
// 2.0
import { TimeSolverError, add, isValid } from 'timesolver';

try {
  add('nonsense', 1, 'D');
} catch (error) {
  if (error instanceof TimeSolverError) {
    error.code; // 'INVALID_DATE'
  }
}

// or check first, which never throws for bad data
if (isValid(input)) {
  add(input, 1, 'D');
}
```

`getString` no longer returns the string `'[timeSolver] Input Type Error'` for
an unknown format; it throws `INVALID_FORMAT`. If you were rendering that value
into a UI, you were shipping the error message to users.

Unknown units also throw now. 1.x logged and carried on: `between` returned a
raw millisecond count as if no unit had been given, and `add` returned `null`.

## Breaking: results that were wrong

### Month and year differences

```js
// 1.x — divided elapsed time by an average month and an average year
timeSolver.between('2020-01-01', '2020-02-01', 'M'); // 1.0184804928131417
timeSolver.between('2020-01-01', '2021-01-01', 'Y'); // 1.002053388090349
```

```ts
// 2.0 — calendar arithmetic
between('2020-01-01', '2020-02-01', 'M'); // 1
between('2020-01-01', '2021-01-01', 'Y'); // 1
```

If you were rounding or truncating the old fractions, remove that. If you were
comparing against a magic constant, replace it with the integer.

### Day differences across daylight saving

`between(..., 'day')` now counts calendar days plus the wall-clock remainder,
so the same local time on adjacent dates is exactly one day apart even when the
day was 23 or 25 hours long. For elapsed real time, ask for hours.

### Comparison at a granularity

```js
// 1.x — the unit argument was accepted and ignored
timeSolver.after('2020-01-01T23:00', '2020-01-01T01:00', 'D'); // true
```

```ts
// 2.0 — the unit is honoured
after('2020-01-01T23:00', '2020-01-01T01:00', 'D'); // false, same calendar day
after('2020-01-01T23:00', '2020-01-01T01:00');      // true, later instant
```

`afterToday` and `beforeToday` now genuinely compare calendar days, which is
what their names always claimed.

### Equality

```js
// 1.x — compared Date#toString(), which has no millisecond field
timeSolver.equal('2020-01-01T00:00:00.001Z', '2020-01-01T00:00:00.999Z'); // true
```

```ts
// 2.0 — compares instants
equal('2020-01-01T00:00:00.001Z', '2020-01-01T00:00:00.999Z');           // false
equal('2020-01-01T00:00:00.001Z', '2020-01-01T00:00:00.999Z', 'second'); // true
```

Pass `'second'` to recover the old looseness deliberately.

### Validation

```js
// 1.x — February was capped at 28, and the DD-first formats were unvalidated
timeSolver.isValid('2020-02-29', 'YYYY-MM-DD'); // false, though 2020 is a leap year
timeSolver.isValid('31-02-2020', 'DD-MM-YYYY'); // true, though that date cannot exist
//                                              // (published 1.2.0: null, no such format)
timeSolver.isValid('12:30:00', 'HH:MM:SS');     // false, though the time is valid
```

```ts
// 2.0
isValid('2020-02-29', 'YYYY-MM-DD'); // true
isValid('31-02-2020', 'DD-MM-YYYY'); // false
isValid('12:30:00', 'HH:MM:SS');     // true
```

Any test asserting the old answers needs updating; any validation gate built on
them was rejecting or admitting the wrong dates in production.

### Month arithmetic at month ends

```js
// 1.x — native setMonth overflow
timeSolver.add(new Date(2024, 0, 31), 1, 'M'); // 2024-03-02
```

```ts
// 2.0 — clamped to the last valid day
add(new Date(2024, 0, 31), 1, 'M'); // 2024-02-29
```

### Weekday and month names

1.x sliced `Date#toString()`, so output depended on the engine and its locale.
2.0 reads a fixed English table. On V8 the strings are the same; elsewhere they
are now stable.

## Breaking: input handling

**Inputs are no longer mutated.** 1.x passed your `Date` straight to
`setDate()`:

```js
// 1.x
const d = new Date('2020-01-01T00:00:00Z');
timeSolver.add(d, 1, 'D');
d.toISOString(); // '2020-01-02T00:00:00.000Z' — your object moved
```

```ts
// 2.0
const d = new Date('2020-01-01T00:00:00Z');
add(d, 1, 'D');
d.toISOString(); // '2020-01-01T00:00:00.000Z'
```

Delete any `new Date(original)` copy you were making first.

**`null` and `undefined` are rejected.** 1.x turned `add(null, 1, 'D')` into
1970-01-02 through `new Date(null)`. 2.0 throws `INVALID_DATE`. If you relied on
the epoch fallback, pass `0` or `new Date(0)` explicitly.

**Ambiguous formats are rejected.** A variable-width token running straight into
another numeric token cannot round-trip: `'YYYYMD'` renders 12 January 2024 as
`'2024112'`, which reads equally well as 2 November. Use `'YYYYMMDD'`, or
separate the tokens. None of the 36 1.x format names are affected — all are
fixed-width.

**Fractional calendar amounts are rejected.** `add(date, 1.5, 'month')` throws
`INVALID_ARGUMENT`: a third of a month has no defined length. Fractional
amounts of milliseconds through hours are still fine.

## Breaking: packaging

`timesolver@1.2.0` was not installable in practice: its `main` pointed at
`src/1.2.0/timeSolver.min.js`, a path absent from the published tarball, and the
repository's own entry point exported nothing under `"type": "module"`.

2.0 ships:

| Consumption | Path |
|---|---|
| ESM | `import { add } from 'timesolver'` |
| CJS | `const { add } = require('timesolver')` |
| Namespace | `import timeSolver from 'timesolver'` |
| Browser global | `dist/timesolver.global.js`, global `timeSolver` |
| Types | generated from source, per module system |
| Profiler | `timesolver/profiler` |

Requires Node.js 20 or newer. TypeScript users need no `@types` package.

## Breaking: the profiler

```js
// 1.x — state on the shared singleton, seconds, %c even in Node
timeSolver.timeLookStart();
timeSolver.timeLook('step');
timeSolver.timeLookReport();
```

Those three names still work in 2.0, drive one shared instance, and are
exported by name as well as on the default object, so a 1.x `<script>` tag
calling `timeSolver.timeLook('step')` keeps working. New code
should take an isolated one:

```ts
import { createProfiler } from 'timesolver/profiler';

const profiler = createProfiler();
profiler.start();
profiler.mark('step');
const { total, slowest, marks } = profiler.report();
```

Differences: timings come from `performance.now()` rather than `new Date()`,
are reported in milliseconds rather than seconds, `report()` returns structured
data, and console styling is applied only in a browser.

## New in 2.0

| Addition | Why |
|---|---|
| `parse(input, format)` | strict format-aware parsing, previously only available indirectly through `isValid` |
| `startOf` / `endOf` | build calendar ranges, and the basis for unit-aware comparison |
| `getQuarter(date)` | the quarter of a date, not just of a month number |
| `isLeapYear(year)`, `daysInMonth(year, month)` | needed by the validator, useful on their own |
| `monthName`, `monthAbbreviation`, `weekdayName`, `weekdayAbbreviation` | the name tables, addressable directly |
| Arbitrary format tokens | `'ddd, D MMM YYYY'`, `'hh:mm A'`, `'[Week of] MMMM D'` and so on, where 1.x accepted only its 36 fixed names |
| `TimeSolverError` with a `code` | branch on failure kind instead of parsing message strings |
| Named exports | tree-shaking; import three functions and ship three functions |

## Unchanged

- Every function name and argument order.
- All unit abbreviations, including `'M'` for month and `'MIN'` for minute.
- Every 1.x format name, including the ones where `MM` meant minutes. Case does
  not matter, except for `'HH:MM:SS'` and `'HH:MM:SS.SSS'`: written in lower
  case those are valid token strings meaning 12-hour time, and are read that
  way. Write them in upper case for the 1.x reading.
- `getString`'s default format, `'YYYYMMDD'`.
- `getQuarterByMonth` and `getFirstMonthByQuarter` returning `null` when out of range.
- Local time as the only time zone, and English as the only language for names.
- Zero runtime dependencies. The MIT license.
