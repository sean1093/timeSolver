# timeSolver Usage

This document describes the main functions, parameters, and common format examples for the `timeSolver` library to help developers get started quickly.

## Installation and Import

CommonJS:

```js
const timeSolver = require('timesolver');
```

ES Module:

```js
import timeSolver from 'timesolver';
```

Browser (UMD bundle):

```html
<script src="dist/timeSolver.umd.min.js"></script>
<script>
  // global `timeSolver` is available
  console.log(timeSolver.getString(new Date(), 'YYYYMMDD'));
</script>
```

## Common API Overview

- `timeSolver.add(date, count, unit)` — Add `count` units to `date`.
- `timeSolver.subtract(date, count, unit)` — Subtract `count` units from `date`.
- `timeSolver.between(d1, d2, unit)` — Return the difference `d2 - d1` in `unit`.
- `timeSolver.equal(d1, d2)` — Check whether two dates are equal (string comparison).
- `timeSolver.after(d1, d2, unit)` — Check whether `d1` is after `d2` (by `unit`).
- `timeSolver.before(d1, d2, unit)` — Check whether `d1` is before `d2` (by `unit`).
- `timeSolver.afterToday(d)` / `timeSolver.beforeToday(d)` — Compare relative to today.
- `timeSolver.getString(date, format)` — Format `date` as a string using `format`.
- `timeSolver.isValid(dateString, format?)` — Validate a date string; if `format` is provided, validate against that format.
- `timeSolver.getAbbrWeek(date)` / `timeSolver.getFullWeek(date)` — Get weekday (abbr or full name).
- `timeSolver.getAbbrMonth(date)` / `timeSolver.getFullMonth(date)` — Get month (abbr or full name).
- `timeSolver.getQuarterByMonth(m)` / `timeSolver.getFirstMonthByQuarter(q)` — Quarter utilities.

### Examples

```js
const d = new Date('2020-01-01T00:00:00Z');
timeSolver.add(d, 1, 'D'); // 2020-01-02
timeSolver.subtract(d, 2, 'H'); // 2019-12-31 22:00
timeSolver.between('2020-01-01','2020-01-02','H'); // 24
timeSolver.getString(d, 'YYYY-MM-DD HH:MM:SS.SSS'); // e.g. '2020-01-01 00:00:00.000'
```

## Supported Time Units (`unit`)

The library accepts various strings or abbreviations for units and converts them to internal unit indices. Supported values include:

- `MILLISECOND` or `mill` or omitted (default)
- `SECOND` or `S` or `s`
- `MINUTE` or `MIN`
- `HOUR` or `H`
- `DAY` or `D`
- `MONTH` or `M`
- `YEAR` or `Y`

Example: `timeSolver.add(date, 5, 'H')` adds 5 hours.

## `getString` Supported Formats

`timeSolver.getString(date, format)` supports the following format patterns (case-insensitive):

- `YYYY` — year, e.g. `2020`
- `YYYYMM` — `202001`
- `YYYYMMDD` — `20200101`
- `YYYY/MM/DD`, `YYYY-MM-DD`, `YYYY.MM.DD` — common separators
- `MMDDYYYY`, `DDMMYYYY` — month-day-year or day-month-year orders
- Date & time formats:
  - `YYYY/MM/DD HH:MM:SS`
  - `YYYY/MM/DD HH:MM:SS.SSS` (milliseconds)
  - `YYYY-MM-DD HH:MM:SS` / `YYYY-MM-DD HH:MM:SS.SSS`
  - `YYYY.MM.DD HH:MM:SS` / `YYYY.MM.DD HH:MM:SS.SSS`
  - `YYYYMMDD HH:MM:SS` / `YYYYMMDD HH:MM:SS.SSS`
  - `MM/DD/YYYY HH:MM:SS` / `MM/DD/YYYY HH:MM:SS.SSS`
  - `MM-DD-YYYY HH:MM:SS` / `MM-DD-YYYY HH:MM:SS.SSS`
  - `MM.DD.YYYY HH:MM:SS` / `MM.DD.YYYY HH:MM:SS.SSS`
- Time-only: `HH:MM:SS` / `HH:MM:SS.SSS`

Example:

```js
timeSolver.getString(new Date('2020-06-15T13:45:30.123Z'), 'YYYY-MM-DD HH:MM:SS.SSS')
// => "2020-06-15 13:45:30.123"
```

## `isValid` Usage

- `timeSolver.isValid('2020/01/01')` → `true` (when `format` is omitted, `Date` parsing is used)
- `timeSolver.isValid('2020/02/30', 'YYYY/MM/DD')` → `false` (invalid date)

When `format` is provided, the library validates the date (and time portion, if present) using built-in patterns and performs additional checks when necessary.

## `timeLook` (lightweight timing profiler)

Use `timeLook` to mark code sections and print a report:

```js
timeSolver.timeLookStart();
// ... some operation ...
timeSolver.timeLook('step1');
// ... another operation ...
timeSolver.timeLook('step2');
timeSolver.timeLookReport();
```

The report prints each segment's elapsed time and relative percentage, highlighting the most time-consuming section.

## Additional Notes

- Most functions accept a `Date` object or a string parseable by `new Date(...)`.
- For invalid input dates the library logs an internal `console.error` and returns `null`.

If you want, I can also split this document into separate examples under `docs/examples/`.
