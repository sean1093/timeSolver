# timeSolver

[![npm version](https://img.shields.io/npm/v/timesolver?logo=npm)](https://www.npmjs.com/package/timesolver)
[![CI](https://github.com/sean1093/timeSolver/actions/workflows/ci.yml/badge.svg)](https://github.com/sean1093/timeSolver/actions/workflows/ci.yml)
[![types](https://img.shields.io/npm/types/timesolver)](https://www.npmjs.com/package/timesolver)
[![downloads](https://img.shields.io/npm/dm/timesolver)](https://www.npmjs.com/package/timesolver)
[![license](https://img.shields.io/npm/l/timesolver)](LICENSE)

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
- **One grammar for three jobs.** `getString`, `parse` and `isValid` share a single token table, so any format that renders also parses and validates. dayjs needs a plugin for the same thing.
- **Calendar-correct.** Month and year differences are whole numbers where they should be; day arithmetic survives daylight saving.
- **Typed at the source.** Declarations are generated from the TypeScript implementation, so they cannot drift.
- **Small.** 4.8 kB minified and gzipped for the whole library, tree-shakable down to what you import, no dependencies.
- **Loud, not silent.** Bad input throws `TimeSolverError` with a `code`; nothing is written to the console, and nothing returns a sentinel you have to remember to check.

Upgrading from 1.x? See the [migration guide](docs/migration-v1-v2.md) — most call
sites need no changes, but the semantics they relied on were often wrong.

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

Full reference with every signature, error and edge case:
**[docs/api.md](docs/api.md)**. Guides:
[English](docs/usage.md) · [繁體中文](docs/usage.zh.md) · [日本語](docs/usage.ja.md).

| | |
|---|---|
| **Arithmetic** | `add` `subtract` `startOf` `endOf` |
| **Comparison** | `between` `equal` `after` `before` `afterToday` `beforeToday` |
| **Strings** | `getString` `parse` `isValid` |
| **Calendar** | `getFullWeek` `getAbbrWeek` `getFullMonth` `getAbbrMonth` `getQuarter` `getQuarterByMonth` `getFirstMonthByQuarter` `isLeapYear` `daysInMonth` `monthName` `monthAbbreviation` `weekdayName` `weekdayAbbreviation` |
| **Profiling** | `createProfiler` (also at `timesolver/profiler`) |
| **Errors** | `TimeSolverError` with `code`: `INVALID_DATE` `INVALID_UNIT` `INVALID_FORMAT` `INVALID_ARGUMENT` |

Every function takes a `Date`, epoch milliseconds, or a string `Date` can parse.

### Units

Case-insensitive. Plural forms are accepted too (`days`, `months`); the full
table is in the [API reference](docs/api.md#conventions).

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

Every format name 1.x accepted still works, in any case, including the ones
where `MM` meant minutes. The tokenizer recognises 36 such names: the set
published in 1.2.0 plus the `DD`-first family added to the repository
afterwards.

### How `between` measures each unit

`between(from, to, unit)` returns the signed difference `to − from`, and the
rule per unit is deliberate rather than incidental:

| Units | Basis | Consequence |
|---|---|---|
| `millisecond` … `hour` | exact elapsed time | a 23-hour daylight-saving day really is 23 hours |
| `day`, `week` | local calendar | that same day is 1, and the same clock time on adjacent dates is always exactly 1 day apart |
| `month`, `quarter`, `year` | local calendar, with the remainder scaled by the month it falls in | January 1 to February 1 is exactly `1` |

`between(a, b, unit) === -between(b, a, unit)` holds for every unit.

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
  the current offset but cannot be parsed.
- **Locales.** Month and weekday names are English. For localised output use
  `Intl.DateTimeFormat`.
- **Durations and humanisers.** No `fromNow()`, no `humanize()`.

One inherited sharp edge worth knowing: `new Date('2024-03-10')` is parsed as
UTC midnight by the language itself, while `new Date('2024-03-10T00:00')` is
local. This library passes strings to `Date`, so the same rule applies. Pass a
`Date` or include a time when it matters.

## Contributing

Setup, scripts, quality gates and the release process are in
[CONTRIBUTING.md](CONTRIBUTING.md). Bug reports and feature requests go through
the [issue templates](https://github.com/sean1093/timeSolver/issues/new/choose);
vulnerabilities go through [SECURITY.md](SECURITY.md).

Design decisions, including the audit that motivated 2.0.0, are recorded in
[docs/specs](docs/specs).

## License

[MIT](LICENSE) © Sean Chou
