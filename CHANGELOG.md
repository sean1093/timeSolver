# Changelog

## 2.0.1

### Patch Changes

- 87365e2: Fix three edge-case defects found by leaving the pinned test time zone.
  
  - `endOf` no longer crosses into the next calendar date in zones whose clocks jump at midnight. In `America/Santiago`, `endOf('2024-09-08', 'day')` returned `2024-09-09 00:59:59.999`, because local midnight does not exist that day and the shift was applied to the adjusted start. The unit is truncated again after the shift, so the result is `2024-09-08 23:59:59.999`. The same fix covers `week`, `month`, `quarter` and `year`.
  - `add` and `subtract` throw `INVALID_ARGUMENT` when a shift leaves the range a `Date` can represent, instead of returning an Invalid Date. Returning the sentinel deferred the failure to whatever touched it next, which is the behaviour this library exists to avoid.
  - Years before 1 CE render with the sign carried separately, so year `-1` formats as `-0001` rather than `00-1`.
  
  Adds `npm run test:zones`, which checks calendar invariants over 366 days in seven time zones — including one that shifts at midnight and three whose offsets are not whole hours — and runs in CI. Every defect above was invisible to a suite pinned to a single zone.

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

From 2.0.0 onward, entries are generated from
[changesets](https://github.com/changesets/changesets); see
[CONTRIBUTING.md](CONTRIBUTING.md).

## [2.0.0] - 2026-08-28

A full rewrite. Names and argument orders are preserved, so most 1.x call sites
need no edits, but the semantics behind them changed — in every case because the
1.x behaviour was wrong. Start with the
[migration guide](docs/migration-v1-v2.md).

### Fixed

- `add` and `subtract` no longer mutate the `Date` passed to them. 1.x handed the caller's object to `setDate()`, so `add(d, 1, 'D')` moved `d`.
- `add(date, n, 'month' | 'year')` clamps to the last valid day of the target month. 1.x inherited `setMonth` overflow, turning January 31 plus one month into March 2.
- `between` with `month`, `quarter` or `year` uses calendar arithmetic. 1.x divided elapsed milliseconds by an average month of 30.44 days, reporting `1.0184804928131417` for January 1 to February 1.
- `between` with `day` or `week` counts calendar days plus a wall-clock remainder, so the same local time on adjacent dates is exactly one day apart across a daylight-saving change.
- `between(a, b, unit)` is now the exact negation of `between(b, a, unit)` for every unit.
- `equal` compares instants. 1.x compared `Date#toString()`, which has no millisecond field, so two dates 998 ms apart compared equal.
- `after`, `before`, `afterToday` and `beforeToday` honour their `unit` argument. 1.x accepted it and ignored it.
- `isValid` accepts real leap days and rejects impossible dates. 1.x capped February at 28, so every February 29 was invalid, while `31-02-2020` passed because the day was never checked against the month.
- `isValid` handles time-only formats. 1.x split the input on a space that is not there, so `HH:MM:SS` could never validate.
- Weekday and month names come from a fixed English table. 1.x sliced `Date#toString()`, whose text depends on the engine and its locale.
- The package is installable and importable. `timesolver@1.2.0` declared `main` as `src/1.2.0/timeSolver.min.js`, a path absent from the published tarball, and the repository entry point exported nothing under `"type": "module"`.
- `package.json` declares the MIT license, matching `LICENSE` and the registry. 1.x said ISC.

### Changed

- **Invalid input throws `TimeSolverError`** with a `code` of `INVALID_DATE`, `INVALID_UNIT`, `INVALID_FORMAT` or `INVALID_ARGUMENT`. 1.x wrote to `console.error` and returned `null`, which callers then dereferenced. The library no longer writes to the console.
- **`getString` throws on a malformed format** instead of returning the string `'[timeSolver] Input Type Error'`.
- **`getString` accepts arbitrary token strings**, not just the 36 names 1.x hard-coded: `'ddd, D MMM YYYY'`, `'hh:mm A'`, `'[Week of] MMMM D'`. All 36 legacy names still work, in any case, including those where `MM` meant minutes.
- **`null` and `undefined` are rejected** rather than silently treated as the epoch.
- **Fractional amounts of calendar units are rejected.** `add(date, 1.5, 'month')` throws; fractional milliseconds through hours are unchanged.
- **Ambiguous formats are rejected.** A variable-width numeric token running straight into another numeric token cannot round-trip, so `'YYYYMD'` throws `INVALID_FORMAT`. None of the legacy format names are affected.
- **The profiler is instance-based.** `createProfiler()` returns an isolated timeline on `performance.now()`, reports milliseconds with a share per segment, returns structured data from `report()`, and applies console styling only in a browser. 1.x kept state on the shared singleton, timed with `new Date()`, reported seconds, and emitted `%c` directives that Node prints literally. `timeLookStart`, `timeLook` and `timeLookReport` still work.
- **Minimum runtime is Node.js 20.**

### Added

- `parse(input, format)` — strict format-aware parsing. The input must match exactly and the result must render back identically, which is what rejects impossible dates.
- `startOf(date, unit)` and `endOf(date, unit)` for calendar ranges.
- `getQuarter(date)`, `isLeapYear(year)`, `daysInMonth(year, month)`, `monthName`, `monthAbbreviation`, `weekdayName`, `weekdayAbbreviation`.
- `timesolver/profiler` subpath export.
- Named exports for tree-shaking, alongside the default namespace object.
- TypeScript declarations generated from the implementation, per module system. 1.x advertised a `types` file it never produced.
- A browser global bundle at `dist/timesolver.global.js`, reachable through unpkg and jsDelivr.
- Documentation: [API reference](docs/api.md), [migration guide](docs/migration-v1-v2.md), [usage guide](docs/usage.md) in English, Traditional Chinese and Japanese, runnable [examples](examples), and the [design spec](docs/specs) recording the audit behind this release.

### Removed

- `src/1.2.0/timeSolver.js`, a stale copy of the source that the entire 1.x test suite imported instead of the package entry point.
- `timeSolver.min.js`, a build artifact tracked in git.
- `rollup.config.js`, replaced by `tsup.config.ts`. The old config imported `./package.json` without an import attribute, which modern Node rejects.
- The Jest suite, replaced by Vitest running the TypeScript sources directly. Jest's CommonJS transform is what allowed the dead ESM entry point to pass 142 tests.

### Internal

- Nine focused modules replace one 666-line IIFE, with a single token table behind formatting, parsing and validation.
- 517 tests at 100% line, branch, function and statement coverage, including one regression test per defect above and a compatibility suite pinning all 36 legacy format names and unit aliases. The suite pins `TZ=America/New_York` so daylight-saving behaviour is covered and reproducible.
- CI runs lint, typecheck, coverage, build, `publint`, `arethetypeswrong`, `size-limit` and a packaging smoke test, with the build and smoke test repeated on Node 20, 22 and 24. The smoke test resolves the package by name through its `exports` map and asserts behaviour on the ESM, CommonJS and browser bundles — the consumption paths 1.x broke.
- Releases are automated with changesets and publish with npm provenance.

## [1.2.0] - 2018-04-08

### Added

- Unit tests.
- `getQuarterByMonth` and `getFirstMonthByQuarter`.

[2.0.0]: https://github.com/sean1093/timeSolver/releases/tag/v2.0.0
[1.2.0]: https://github.com/sean1093/timeSolver/releases/tag/v1.2.0
