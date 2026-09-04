# timeSolver

[![npm version](https://img.shields.io/npm/v/timesolver?logo=npm)](https://www.npmjs.com/package/timesolver)
[![CI](https://github.com/sean1093/timeSolver/actions/workflows/ci.yml/badge.svg)](https://github.com/sean1093/timeSolver/actions/workflows/ci.yml)
[![types](https://img.shields.io/npm/types/timesolver)](https://www.npmjs.com/package/timesolver)
[![downloads](https://img.shields.io/npm/dm/timesolver)](https://www.npmjs.com/package/timesolver)
[![license](https://img.shields.io/npm/l/timesolver)](https://github.com/sean1093/timeSolver/blob/master/LICENSE)

Tiny, immutable date utilities for JavaScript and TypeScript. Formatting,
strict parsing, format-aware validation, calendar-correct comparison, and a
built-in profiler — over the native `Date`, with zero runtime dependencies.

```ts
import { add, between, getString, isValid, parse } from 'timesolver';

getString(new Date(), 'YYYY-MM-DD HH:mm:ss'); // '2026-08-28 09:41:07'
add('2024-01-31T00:00:00', 1, 'month');       // 2024-02-29, not 2024-03-02
between('2020-01-01', '2020-02-01', 'month'); // exactly 1
isValid('31-02-2020', 'DD-MM-YYYY');          // false
parse('17/03/2024', 'DD/MM/YYYY');            // Date, or throws
```

- **Immutable.** No function touches the `Date` you pass in.
- **One grammar for three jobs.** `getString`, `parse` and `isValid` share a single token table, so any format that renders also parses and validates, for every year from 1 to 9999. dayjs needs a plugin for the same thing.
- **Calendar-correct.** Month and year differences are whole numbers where they should be; day arithmetic survives daylight saving.
- **Typed at the source.** Declarations are generated from the TypeScript implementation, so they cannot drift.
- **Small.** Under 6.5 kB minified and gzipped for the whole library, and tree-shakable: `import { getString }` alone bundles to 2.6 kB. No dependencies.
- **Loud, not silent.** Bad input throws `TimeSolverError` with a `code`; nothing is written to the console, and nothing returns a sentinel you have to remember to check.

Upgrading? The [2.x to 3.0 guide](https://github.com/sean1093/timeSolver/blob/master/docs/migration-v2-v3.md)
covers the results that changed and the formats that are now refused; the
[1.x to 2.0 guide](https://github.com/sean1093/timeSolver/blob/master/docs/migration-v1-v2.md)
is still there for older call sites. Most need no changes.

## Installation

```sh
npm install timesolver
```

Requires Node.js 20 or newer. The `<script>` bundle targets ES2018; the module
builds target ES2022, so transpile them if you support older browsers.

## Usage

ES modules, tree-shakable:

```ts
import { add, getString } from 'timesolver';
```

CommonJS:

```js
const { add, getString } = require('timesolver');
```

Whole namespace, as in 1.x:

```ts
import timeSolver from 'timesolver';

timeSolver.getString(new Date(), 'YYYYMMDD');
```

Browser, no bundler:

```html
<script src="https://unpkg.com/timesolver/dist/timesolver.global.js"></script>
<script>
  console.log(timeSolver.getString(new Date(), 'YYYY-MM-DD'));
</script>
```

## API

All documentation lives in
**[docs/](https://github.com/sean1093/timeSolver/blob/master/docs/README.md)**:
[usage guide](https://github.com/sean1093/timeSolver/blob/master/docs/usage.md) ·
[recipes](https://github.com/sean1093/timeSolver/blob/master/docs/recipes.md) ·
[API reference](https://github.com/sean1093/timeSolver/blob/master/docs/api.md) ·
[migration from 1.x](https://github.com/sean1093/timeSolver/blob/master/docs/migration-v1-v2.md) ·
[support policy](https://github.com/sean1093/timeSolver/blob/master/docs/support.md) ·
[benchmarks](https://github.com/sean1093/timeSolver/blob/master/docs/benchmarks.md).
The usage guide is also in
[繁體中文](https://github.com/sean1093/timeSolver/blob/master/docs/usage.zh.md) and
[日本語](https://github.com/sean1093/timeSolver/blob/master/docs/usage.ja.md).

| | |
|---|---|
| **Arithmetic** | `add` `subtract` `startOf` `endOf` |
| **Comparison** | `between` `equal` `after` `before` `afterToday` `beforeToday` |
| **Ranges** | `isBetween` `min` `max` `clamp` |
| **Strings** | `getString` `parse` `isValid` |
| **Calendar** | `getFullWeek` `getAbbrWeek` `getFullMonth` `getAbbrMonth` `getQuarter` `getQuarterByMonth` `getFirstMonthByQuarter` `isLeapYear` `daysInMonth` `monthName` `monthAbbreviation` `weekdayName` `weekdayAbbreviation` |
| **Week numbers** | `getISOWeek` `getISOWeekYear` `getWeekOfYear` |
| **Profiling** | `createProfiler` (also at `timesolver/profiler`) |
| **Errors** | `TimeSolverError` with `code`: `INVALID_DATE` `INVALID_UNIT` `INVALID_FORMAT` `INVALID_ARGUMENT` |

Every function takes a `Date`, epoch milliseconds, or a string `Date` can parse.

### Units

Case-insensitive. Every alias of more than one letter also accepts its plural
(`days`, `months`, `mins`, `hrs`); the full table is in the
[API reference](https://github.com/sean1093/timeSolver/blob/master/docs/api.md#conventions).

| Unit | Aliases |
|---|---|
| millisecond | `millisecond` `mill` `ms` `msec` |
| second | `second` `sec` `s` |
| minute | `minute` `min` |
| hour | `hour` `hr` `h` |
| day | `day` `d` |
| week | `week` `w` |
| month | `month` `mon` `m` |
| quarter | `quarter` `q` |
| year | `year` `yr` `y` |

### Format tokens

| Token | Output | Token | Output |
|---|---|---|---|
| `YYYY` `YY` | `2026` `26` | `mm` `m` | `07` `7` |
| `MMMM` `MMM` | `January` `Jan` | `ss` `s` | `09` `9` |
| `MM` `M` | `01` `1` | `SSS` | `042` |
| `DD` `D` | `05` `5` | `A` `a` | `PM` `pm` |
| `dddd` `ddd` | `Monday` `Mon` | `Q` | `1` |
| `HH` `H` | `13` `13` | `Z` `ZZ` | `+08:00` `+0800` |
| `hh` `h` | `01` `1` | `[text]` | literal `text` |

Inside an escape, `]]` is a literal `]`: `'[[]'` renders `[` and `'[a]]b]'` renders `a]b`.

Every format name 1.x accepted still works, including the ones where `MM` meant
minutes. The tokenizer recognises 36 such names: the 27 that
`timesolver@1.2.0` shipped, plus the nine `DD`-first names added afterwards.
Case does not matter, unless the format you wrote is itself a valid token
string — `'hh:mm:ss'` is 12-hour, minute, second, and means that rather than
the 1.x name of the same spelling.

### How `between` measures each unit

`between(from, to, unit)` returns the signed difference `to − from`, and the
rule per unit is deliberate rather than incidental:

| Units | Basis | Consequence |
|---|---|---|
| `millisecond` … `hour` | exact elapsed time | a 23-hour daylight-saving day really is 23 hours |
| `day`, `week` | local calendar | that same day is 1, and the same clock time on adjacent dates is always exactly 1 day apart |
| `month`, `quarter`, `year` | local calendar, with the remainder scaled by the month it falls in | January 1 to February 1 is exactly `1` |

`between(a, b, unit) === -between(b, a, unit)` holds for every unit.

### Where the week starts

Weeks start on Sunday by default, matching `Date#getDay`. `startOf`, `endOf`,
`equal`, `after` and `before` take `{ weekStartsOn }` — `0` for Sunday through
`6` for Saturday — so ISO-8601 weeks are one argument away:

```ts
startOf(date, 'week');                      // Sunday
startOf(date, 'week', { weekStartsOn: 1 }); // Monday, ISO-8601
endOf(date, 'week', { weekStartsOn: 6 });   // Friday, for a Saturday-start week
```

## Profiling

The `timeLook` helper from 1.x, rewritten as an isolated timeline on a
monotonic clock:

```ts
import { createProfiler } from 'timesolver/profiler';

const profiler = createProfiler();
profiler.start();
await loadRows();
profiler.mark('load');
render();
profiler.mark('render');

profiler.print();
// [timeSolver] 2 mark(s) in 128.412 ms
//   1. load    96.210 ms  74.9%  <- slowest
//   2. render  32.202 ms  25.1%
```

`report()` returns `{ total, slowest, marks: [{ label, ms, share }] }`, so tests
and dashboards can read the numbers instead of scraping console output. The 1.x
names `timeLookStart()`, `timeLook(label)` and `timeLookReport()` still work.

## Scope

Deliberately absent, because `Temporal` and `Intl` already do them better and
matching them would cost the size advantage:

- **Time zones.** Every function reads the host time zone. `Z` and `ZZ` render
  the current offset, and `parse` reads one back — an offset is arithmetic, so
  the instant is exact — but no zone is modelled and no zone name is understood.
- **Locales.** Month and weekday names are English. For localised output use
  `Intl.DateTimeFormat`.
- **Durations and humanisers.** No `fromNow()`, no `humanize()`.

One inherited sharp edge worth knowing: `new Date('2024-03-10')` is parsed as
UTC midnight by the language itself, while `new Date('2024-03-10T00:00')` is
local. This library passes strings to `Date`, so the same rule applies. Pass a
`Date` or include a time when it matters.

## Contributing

Setup, scripts, quality gates and the release process are in
[CONTRIBUTING.md](https://github.com/sean1093/timeSolver/blob/master/CONTRIBUTING.md). Bug reports and feature requests go through
the [issue templates](https://github.com/sean1093/timeSolver/issues/new/choose);
vulnerabilities go through [SECURITY.md](https://github.com/sean1093/timeSolver/blob/master/SECURITY.md).

Design decisions, including the audit that motivated 2.0.0, are recorded in
[docs/specs](https://github.com/sean1093/timeSolver/tree/master/docs/specs).

## License

[MIT](https://github.com/sean1093/timeSolver/blob/master/LICENSE) © Sean Chou
