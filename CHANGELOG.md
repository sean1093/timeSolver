# Changelog

## 3.0.0

### Major Changes

- 25b652d: Refuse two classes of format string that `parse` and `isValid` could not handle safely.
  
  **A variable-width token may no longer touch a digit that arrives as literal text.** The tokenizer already refused `'YYYYMD'`, where two variable-width tokens run together; it now applies the same rule to a digit written as a literal, so `'M0M'`, `'D0'` and `'H:m:s9'` throw `INVALID_FORMAT` instead of compiling. Such a format built a matcher — `^(\d{1,2})0(\d{1,2})$` — in which every capture group has two viable widths at every position, so an input of digits that did not match cost exponential time: a 59-character format against a 90-character input took 11.5 seconds of synchronous CPU, and forty tokens was an indefinite hang. A digit next to a variable-width token is exactly as ambiguous as a numeric token next to one, and it is now reported the same way. Separate them (`'M-0'`), or use the fixed-width token (`'MM0'`).
  
  **A parseable format is limited to 512 tokens.** Past a few thousand capture groups the runtime refuses to compile the pattern and reports it as a raw `SyntaxError` — "Stack overflow" at a threshold that depends on the stack left, so it was not even deterministic, and "Too many captures" beyond about 32,000. That error carried none of this library's codes, so `parse` threw something callers could not branch on and `isValid` returned `false` for what is a caller bug. Both now throw `TimeSolverError` with `INVALID_FORMAT`. `getString` builds no matcher and is unchanged, so a long format still renders.
  
  **Migration.** Neither shape can appear in a format that was doing something useful: the first was ambiguous by construction and the second could not be parsed at all. If you generate formats programmatically, separate a variable-width token from a following digit with any non-digit character, and branch on `error.code === 'INVALID_FORMAT'` where you previously saw a `SyntaxError` or a silent `false`.
- 0404d7c: Keep boundary arithmetic inside the range a `Date` can represent, and out of the 1900s.
  
  **`getISOWeek` and `getWeekOfYear` were wrong for years 0-99.** Both counted from a January anchor built with `new Date(year, 0, day)`, which maps years 0-99 into 1900-1999 — so `getISOWeek` of 4 January 0050 reported `-99136` instead of `1`, and `getWeekOfYear` the same. The anchors are now built the way `parse` and `daysInMonth` already built theirs, by setting the year on a date that is safely in range. Years 100 and above were never affected.
  
  **Both functions now name the anchor they cannot build.** Within a year of the minimum representable instant, 1 or 4 January does not exist, and the failure surfaced as `INVALID_DATE: Cannot read a date from an Invalid Date` — describing a perfectly readable input as unreadable. It is now `INVALID_ARGUMENT`, naming the January date that leaves the range.
  
  **`endOf` no longer refuses the last unit of the range.** It computed the end as the start of the next unit minus a millisecond, and at the top of the range that shift threw `INVALID_ARGUMENT: Shifting by 1 day(s) leaves the range a Date can represent` — an internal step the caller never asked for. Every unit containing the last representable instant now ends at that instant, which is what "last representable millisecond of the unit" always claimed.
  
  **`between` measures spans that reach the extremes.** For `'month'`, `'quarter'` and `'year'` it anchors on the start's day of month, which can overshoot the range even when both endpoints are inside it — 19 April -271821 plus 6,570,977 months is eight days past the last instant there is — and the whole call threw. It now steps back to the nearest anchor that exists and scales the remainder against a neighbouring month, so the full span is measurable and `between(a, b, unit) === -between(b, a, unit)` still holds exactly.
  
  **`daysInMonth` answers from the calendar instead of returning `NaN`.** It probed a `Date` for the last day of the month, so `daysInMonth(275761, 2)` was `NaN` — silently, then flowing into arithmetic and rendering as `'NaN'`. A month's length is a calendar fact, so it is now computed arithmetically and correct for any integer year. As a consequence `add(date, months, 'month')` also reaches months it previously refused, including the first month of the range.
  
  **Migration.** Every change either replaces a wrong number with the right one, an inaccurate error with an accurate one, or an error with the answer. If you special-cased any of them: results for years 0-99 from `getISOWeek`/`getWeekOfYear` change, `endOf` and `between` return where they threw at the extremes of the range, `getISOWeek`/`getWeekOfYear` throw `INVALID_ARGUMENT` rather than `INVALID_DATE` for the first year of the range, and `daysInMonth` returns a number where it returned `NaN`.
- 81904e0: Read a format as tokens whenever it is a valid token string, rather than as a 1.x name.
  
  `normalizeFormat` uppercased the whole format string to look it up among the 36 names 1.x accepted, so a format that happened to spell one of them in lower case was translated — even when it was a perfectly good v2 format meaning something else. `hh` is documented as the 12-hour token, and `getString(date, 'hh:mm:ss')` rendered `'13:45:07'`, not `'01:45:07'`. `isValid('13:45:07', 'hh:mm:ss')` was `true`. `'YYYY-MM-DD hh:mm:ss'` was hijacked the same way, and so was `'YYYY-mm-DD'`, where `mm` is the minute token and month came out instead.
  
  A format is now translated only when it is *not* already a token string — that is, when some letter in it belongs to no token, as in `'yyyy-mm-dd hh:mm:ss'`, where `yyyy` and `dd` are not tokens at all. Every 1.x name keeps its own meaning, in any case, because all of them write seconds as `SS`, which is not a token in any case. What changes is the handful of spellings that are valid token strings:
  
  | format | before | after |
  |---|---|---|
  | `'hh:mm:ss'` | `'13:45:07'` (24-hour) | `'01:45:07'` (12-hour) |
  | `'hh:mm:ss.sss'` | `'13:45:07.042'` | `'01:45:07.077'` |
  | `'YYYY-MM-DD hh:mm:ss'` | `'2024-03-17 13:45:07'` | `'2024-03-17 01:45:07'` |
  | `'YYYY-mm-DD'` | `'2024-03-17'` (month) | `'2024-45-17'` (minute) |
  | `'HH:MM:SS'`, `'YYYY-MM-DD HH:MM:SS'`, and the other 34 names | unchanged | unchanged |
  
  **Migration.** If you passed a lower-case 1.x time name — `'hh:mm:ss'` or `'hh:mm:ss.sss'` — write it in upper case to keep the 1.x reading, or add `A`/`a` if you wanted a 12-hour clock all along. Anything written as canonical tokens now means exactly what the token table says.

### Minor Changes

- f6ab1d1: Accept an options object for `isBetween`, and plural unit abbreviations everywhere.
  
  **`isBetween(date, start, end, { unit, bounds, weekStartsOn })`.** The three optional settings were positional, so the two most useful combinations forced a placeholder: this repository's own documentation had to write `isBetween(row.createdAt, start, end, undefined, '[)')` — for the half-open range that the same recipe recommends. The object form is additive and the positional form is unchanged, so nothing needs rewriting; a new `BetweenOptions` type is exported for callers who want to name the settings.
  
  **Plural abbreviations.** The alias table accepted a plural for every full name and for none of the abbreviations, while the README invited readers to combine the two rules. `mills`, `msecs`, `secs`, `mins`, `hrs`, `mons` and `yrs` now resolve like their singulars. Single letters stay singular: `'d'` is a day, `'ds'` is not an alias.
- 5d02ba7: Let a format render a literal `[` or `]`.
  
  Square brackets escape literal text, and there was no way to escape the delimiters themselves: `'[[]'` and `'[]]'` were both refused as unmatched brackets, so neither character could appear in output at all. Inside an escape, `]]` now means a literal `]`, and `[` needs no doubling because it cannot close one:
  
  ```ts
  getString(date, '[[]YYYY[]]]'); // '[2024]'
  getString(date, '[a]]b]');      // 'a]b'
  parse('[2024-03-17]', '[[]YYYY-MM-DD[]]]'); // reads it back
  ```
  
  A bracket outside an escape is still refused, so a genuine typo — `'YYYY]'`, `'[unclosed YYYY'` — still fails with `INVALID_FORMAT` rather than rendering something surprising. The escape body's two alternatives cannot match the same character, so the pattern stays linear however many brackets a caller passes.
- db01289: Read `Z` and `ZZ` offsets, so an offset-bearing string parses to an exact instant.
  
  Both tokens rendered and neither parsed, on the grounds that reading an offset would mean modelling a zone. It does not: an offset says exactly how far the wall clock in the input sits from UTC, which is the whole of what is needed to pin the instant. No zone database, no rules, no ambiguity.
  
  ```ts
  parse('2024-03-17T12:00:00+08:00', 'YYYY-MM-DDTHH:mm:ssZ'); // 2024-03-17T04:00:00Z
  parse('2024-03-17T12:00:00+0800', 'YYYY-MM-DDTHH:mm:ssZZ'); // the same instant
  isValid('2024-03-17T12:00:00+05:45', 'YYYY-MM-DDTHH:mm:ssZ'); // true
  
  const stamp = 'YYYY-MM-DD HH:mm:ss.SSS Z';
  parse(getString(date, stamp), stamp).getTime() === date.getTime(); // true, in any host zone
  ```
  
  With an offset in the format, the wall-clock fields belong to that offset: the date is built in UTC and shifted, and `parse`'s round-trip check — the one that rejects 31 February and a weekday that disagrees — runs in the parsed offset rather than the host zone. The returned value is still a plain `Date`, so reading it back gives the host zone's wall clock; what is exact is the instant, not the text.
  
  Each token matches only the shape it renders, `±HH:MM` for `Z` and `±HHMM` for `ZZ`. ISO-8601's bare `Z` designator is neither and is refused; a string already in ISO form can be handed to any function as it is, since `Date` parses it.
  
  Every token in the table now has a pattern, which made the "can be formatted but not parsed" branch in `buildMatcher` unreachable, along with the undefined-pattern check in `digitWidth` and the mutation-testing suppression that came with it. All three are gone.
- 8f86a5d: Make the 1.x `timeLook` names share one timeline across both entry points.
  
  `timeLookStart`, `timeLook` and `timeLookReport` are documented in three places as driving one shared profiler instance, but the package ships `timesolver` and `timesolver/profiler` as independent bundles — each with its own copy of the profiler module, in ESM and in CommonJS alike. The instance was module-level, so it was one timeline per copy: starting a run through the root export and marking through the subpath threw `INVALID_ARGUMENT: Call start() before mark()`.
  
  The compatibility timeline now lives under a well-known symbol, so every copy resolves to the same object, across the subpath boundary and across the ESM/CommonJS one. It is created on first use, so importing the library still writes nothing to `globalThis` and a bundler can drop all of it for anyone who does not call the 1.x names. `createProfiler` is untouched and still returns an isolated timeline.
  
  `scripts/smoke.mjs` now proves this against the built bundles: it holds both ESM entry points at once, confirms they really are separate module copies, starts a run through one and marks through the other. Verified to fail before this change and pass after.

### Patch Changes

- e21ba0e: Tokenize a format once instead of on every call.
  
  `getString`, `parse` and `isValid` re-derived everything from the format string each time they were called: the same string was uppercased to check it against the 1.x names, scanned for tokens, checked for stray brackets and for an ambiguous adjacency, and — for `parse` and `isValid` — compiled into a fresh `RegExp`. Measured over 300,000 iterations of `'YYYY-MM-DD HH:mm:ss'`, that was around 40% of every call.
  
  A format now compiles once and is kept, up to 64 distinct formats, which covers any application that writes its formats as literals; past that the cache is cleared rather than evicting one entry, because a cache this small has nothing to gain from tracking use order. The matcher is built on the first `parse` of a format, so a format that is only ever rendered never compiles one.
  
  Same machine, same process, before and after:
  
  | call | before | after | |
  |---|---|---|---|
  | `getString(date, 'YYYY-MM-DD HH:mm:ss')` | 0.957 µs | 0.237 µs | 4.0x |
  | `parse('2024-03-17 13:45:07', …)` | 2.044 µs | 0.591 µs | 3.5x |
  | `isValid('2024-03-17', 'YYYY-MM-DD')` | 1.175 µs | 0.419 µs | 2.8x |
  
  Nothing observable changes: the same formats produce the same results and the same errors, and a malformed format is not cached, so it fails identically every time.
- 865d3a8: Stop publishing the browser bundle's source map.
  
  `dist/timesolver.global.js.map` was 102 kB describing a 17.6 kB minified bundle — a fifth of everything an install downloaded, and unpkg and jsdelivr served it next to the script tag it belongs to. The ESM and CommonJS builds keep their maps, because those are the files a bundler consumer steps into; nobody debugs a minified browser global against the TypeScript sources.
  
  The published tarball goes from 130.8 kB packed and 510.5 kB unpacked to 112.7 kB and 440.2 kB, with no change to any bundle a consumer runs.

## 2.1.1

### Patch Changes

- e7c676b: Delete two guards and one branch that no test could ever exercise.
  
  `parse` guarded against a capture group being absent, which cannot happen once the matcher has matched; `isValid` guarded against a non-string input, which `parse` already rejects with the same result; and `monthsBetween` special-cased a target sitting exactly on its anchor, which the general interpolation already handles because the numerator is zero there. All three were found by mutation testing: the guards could be deleted with no test failing, which is the definition of dead code.
  
  No behaviour changed. Branch coverage rose to 100% as a side effect, since the unreachable branches are gone.
- 4416cb7: Fix `startOf` and `endOf` where a zone skips or repeats a wall clock.
  
  A wall clock is not a continuous line, and `Date`'s setters resolve a reading that never happened, or happened twice, in ways that broke three invariants range queries depend on.
  
  - `endOf` could return an instant **before** its own `startOf`. In `America/New_York`, `endOf(new Date('2009-11-01T05:59:59Z'), 'hour')` returned `04:59:59.999Z`, an hour earlier than the hour it was asked about, because re-truncating the shifted instant resolved its ambiguous wall clock back to the first of the two readings.
  - `startOf` could move **forward**, out of the unit it was given. In `Pacific/Chatham`, whose clocks move 02:45 to 03:45, `startOf(03:59:59, 'hour')` returned `04:00`, because local 03:00 does not exist that day.
  - Where a zone repeats part of an hour rather than a whole one — Chatham moves 03:45 back to 02:45, so 02:45 to 02:59 happens twice with 03:xx in between — a date in the second run was given the first run's start.
  
  Both functions now return the run of elapsed time that actually contains the date. `startOf(d) <= d <= endOf(d)`, both idempotence laws, and `startOf(endOf(d)) === startOf(d)` now hold for every unit in every zone; `docs/api.md` documents what that means where a wall clock is discontinuous.
  
  The cost is 7% to 22% on these two functions, from the extra offset comparison that detects a clock shift. `npm run test:zones` now checks the invariants at hours spread through all 366 days, from both a named wall clock and elapsed milliseconds — only the second reaches the repeated readings, which is how one of these bugs hid.

## 2.1.0

### Minor Changes

- e09e412: Add `isBetween`, `min`, `max` and `clamp`.
  
  `isBetween(date, start, end, unit?, bounds?, options?)` takes interval notation for its bounds — `'[]'`, `'[)'`, `'(]'` or `'()'` — because a date range usually wants the half-open form, so consecutive ranges neither overlap nor leave a gap. It compares at a `unit` like `equal` does, and takes the same `weekStartsOn` option. A reversed range returns `false` rather than being silently reordered.
  
  `min` and `max` require at least one argument, which the types enforce, so there is no empty case to define; both return a new `Date`, and of equal dates the first wins.
  
  `clamp(date, lower, upper)` returns the nearest endpoint when the date falls outside, and throws `INVALID_ARGUMENT` when `lower` is later than `upper` rather than swapping them and hiding the caller's mistake.
- 446c557: Add week numbering: `getISOWeek`, `getISOWeekYear` and `getWeekOfYear`.
  
  `getISOWeek` and `getISOWeekYear` implement ISO-8601, where weeks start on Monday and week 1 is the week containing 4 January. The pair exists because the week-numbering year is not always the calendar year: 30 December 2024 is week 1 of 2025, and 1 January 2023 is week 52 of 2022. Rendering an ISO week beside `YYYY` produces a wrong label for a few days either side of January, so both functions are needed to build one correctly.
  
  `getWeekOfYear` is the plainer convention — week 1 contains 1 January, counted in the calendar year — and takes the same `weekStartsOn` option as `startOf`. Its first and last weeks may be partial, so it can return up to 54.
  
  No `W` format tokens were added: a week number cannot be parsed back into a date on its own, and a token that rendered a week number next to `YYYY` would be wrong at the year boundary.
- 6a2ec68: Add `weekStartsOn` so weeks no longer have to start on Sunday.
  
  `startOf`, `endOf`, `equal`, `after` and `before` take an options object with `weekStartsOn`, `0` for Sunday through `6` for Saturday. It defaults to `0`, matching `Date#getDay`, so existing behaviour is unchanged; ISO-8601 weeks are `{ weekStartsOn: 1 }`, and the Saturday-start weeks used across much of the Middle East are `{ weekStartsOn: 6 }`. Every other unit ignores the option, and `between(a, b, 'week')` needs none: it measures a span, which does not depend on where weeks begin.
  
  Values outside 0–6, and non-integers, throw `INVALID_ARGUMENT`.
  
  The zone runner now checks, in all seven of its time zones and for all seven starts, that `startOf('week')` lands on the requested weekday, that the week brackets the date, and that it spans seven calendar days.

### Patch Changes

- fb7fe64: Document that a wall-clock string is ambiguous during a backward daylight-saving transition.
  
  When the clocks go back, an hour repeats, so one local reading names two instants — `America/New_York` read `01:59` twice on 1946-09-29. `parse` resolves to the earlier one. The rendered text always survives a `getString`/`parse` round trip; the exact instant does not, inside that hour.
  
  No behaviour changed. Found by the property-based suite, which failed only on Linux with Node 20, because the historical zone rules a platform ships decide whether that 1946 transition exists at all.
- 44474f8: Restructure the documentation: an index, a recipes cookbook and a support policy.
  
  `docs/README.md` indexes every document. `docs/recipes.md` answers twelve jobs end to end — half-open range queries, month-to-date reports, validating user input, grouping by period, correct ISO week labels, log timestamps, form-to-storage conversion, clamping, profiling — and closes with the five behaviours that most often surprise callers. `docs/support.md` states what counts as a breaking change, which versions and runtimes are supported, and what the project promises about time zone data.
  
  Documentation only; no behaviour changed.
- 54b1479: Document that day and week arithmetic can land in a daylight-saving gap.
  
  Both keep the wall-clock time, so a step can land on a local time that does not exist — `2023-03-12 02:00` in `America/New_York` is skipped — and the runtime normalises it forward to `03:00`. The calendar date is always the one requested; the clock can move by one transition.
  
  No behaviour changed. Found by the property-based suite, which was asserting an invertibility that calendars do not offer.
- 9ce119f: Document that calendar month arithmetic is not invertible.
  
  31 December plus 18 months clamps to 30 June, and subtracting 18 months from that returns 30 December, not 31. Days 1 to 28 exist in every month, so the round trip is exact there. This is a property of calendars rather than a defect, and every date library behaves the same way, but the `add` reference now says so instead of leaving callers to discover it.
  
  Found by the new property-based suite, which is test-only and does not change any behaviour.

## 2.0.1

### Patch Changes

- 87365e2: Fix three edge-case defects found by leaving the pinned test time zone.
  
  - `endOf` no longer crosses into the next calendar date in zones whose clocks jump at midnight. In `America/Santiago`, `endOf('2024-09-08', 'day')` returned `2024-09-09 00:59:59.999`, because local midnight does not exist that day and the shift was applied to the adjusted start. The unit is truncated again after the shift, so the result is `2024-09-08 23:59:59.999`. The same fix covers `week`, `month`, `quarter` and `year`.
  - `add` and `subtract` throw `INVALID_ARGUMENT` when a shift leaves the range a `Date` can represent, instead of returning an Invalid Date. Returning the sentinel deferred the failure to whatever touched it next, which is the behaviour this library exists to avoid.
  - Years before 1 CE render with the sign carried separately, so year `-1` formats as `-0001` rather than `00-1`.
  
  Adds `npm run test:zones`, which checks calendar invariants over 366 days in seven time zones — including one that shifts at midnight and three whose offsets are not whole hours — and runs in CI. Every defect above was invisible to a suite pinned to a single zone.

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
