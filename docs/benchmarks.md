# Benchmarks

Throughput of the operations a caller actually hits, measured against
[dayjs](https://day.js.org) and [date-fns](https://date-fns.org) wherever an
equivalent call exists.

The point of this page is not to claim a winner. It is to make the cost of each
operation checkable, so that a performance argument in an issue can be settled
by rerunning a command rather than by assertion. Nine operations are measured
across twenty head-to-head comparisons, and on the recorded run timeSolver is
behind in five of them — two by under 2%, which is noise on this hardware.
All five are in the tables and again in
[Where timeSolver is slower](#where-timesolver-is-slower), in the same place
as everything else.

## Running it

```sh
npm run bench
```

That runs `vitest bench --run` over `bench/*.bench.ts`. The whole suite takes
about 52 seconds. Vitest still labels bench mode experimental and prints a
warning saying so; the warning is expected.

Benchmarks are **not** wired into CI. They are noisy on shared runners — see
[Reading these numbers](#reading-these-numbers) — and a threshold on these
figures would fail builds for reasons that have nothing to do with the commit
under test. `bench/` is also excluded from the published tarball by the `files`
field in `package.json`, and `dayjs` and `date-fns` are devDependencies, so
nothing here reaches a consumer.

## What is measured

- **timeSolver is imported from `../src/index.js`, not from `dist/`.** Vitest
  already compiles the sources for the test suite, so this measures exactly the
  code the repository contains, with no build step to keep in sync and no risk
  of benchmarking a stale bundle. The language level matches the ESM and CJS
  builds, which target ES2022; it does not match the browser IIFE bundle,
  which targets ES2018 and is minified.
- **Every case starts from the value a real caller holds:** a native `Date` for
  formatting, arithmetic and differences; a `string` for parsing and
  validation. That boundary is the only one the three libraries share, so it is
  the only one on which they can be compared. The dayjs cases therefore pay for
  `dayjs(date)`.
- **Two dayjs formatting cases are reported.** One builds the wrapper per call,
  one reuses a wrapper built once. Callers exist in both shapes, and the pair
  brackets the cost of `dayjs(date)` instead of hiding it in whichever
  direction suits.
- **The dayjs arithmetic cases stop at the wrapper.** `dayjs(date).add(1,
  'day')` is timed without a trailing `.toDate()`, because a dayjs caller
  usually keeps working in wrapper space. This favours dayjs: it is not
  producing the `Date` the other two produce.
- **dayjs needs a plugin to parse or validate against a format.**
  `bench/fixtures.ts` registers `customParseFormat` before timing anything.
  Needing the plugin is itself part of the comparison, but its cost is in the
  bundle rather than in these numbers, and it is not measured here.
- **date-fns has no format-aware validator.** The idiomatic equivalent of
  `isValid(input, format)` is `isValid(parse(input, format, reference))`, and
  that composition is what the validation row times.
- **Nothing is timed until it has been proved equivalent.**
  `bench/fixtures.ts` runs a guard on import that throws unless all three
  libraries agree on every comparable operation, including that all three
  reject `'31/02/2024'`. A benchmark of three functions that do different
  things is not a benchmark.
- **The inputs are fixed, not rotated.** One date — `2024-03-17T13:45:30.042`
  local, a leap year, no component left at zero — and one second operand
  437.77 days after it. Branch predictors and inline caches therefore stay
  warm, so real call sites with varied input will be somewhat slower than this
  for all three libraries.
- **Each result is stored to a module-level property.** An optimiser may delete
  a call whose value nothing reads, which would turn a benchmark into a
  measurement of an empty loop. The store is identical in all three libraries'
  cases, so it does not tilt the comparison.
- **Uniform timing budget:** 1000 ms of measurement after 250 ms of warmup per
  case, set explicitly in `bench/fixtures.ts` rather than left to the default,
  so a rerun is comparable.
- **The time zone is pinned to `America/New_York`** by `vitest.config.ts`,
  which bench mode inherits (verified: `process.env.TZ` and a July offset of
  240 minutes inside the bench worker). A DST-observing zone is deliberate —
  every library does more work for local calendar arithmetic there than in a
  fixed-offset zone.

## Environment

The numbers below came from one run on one machine. Nothing was normalised or
averaged across runs.

| | |
|---|---|
| CPU | Apple M4, 10 cores (4 performance + 6 efficiency) |
| Memory | 16 GB |
| OS | macOS 26.6.2 (build 25G83), Darwin 25.6.0 arm64 |
| Node.js | v24.14.0 |
| npm | 11.9.0 |
| Vitest | 4.1.11 |
| dayjs | 1.11.23 |
| date-fns | 4.4.0 |
| timeSolver | this working tree, from `src/` |
| `TZ` | `America/New_York` |

Reproduce the versions with `node -v`, `npx vitest --version`, and
`npm ls dayjs date-fns`.

## Results

`ops/sec` is throughput as Vitest reports it, computed from the mean sample
time. `Relative` is that row divided by the timeSolver row in the same table,
so **above 1.00x means faster than timeSolver**. `rme` is the relative margin
of error Vitest reports for that row; treat any gap of the same order as noise.

### Format to `'YYYY-MM-DD'`

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `getString` | 4,317,646 | 1.00x | ±0.24% |
| dayjs `.format()` | 990,138 | 0.23x | ±0.09% |
| dayjs `.format()`, wrapper reused | 1,198,890 | 0.28x | ±0.08% |
| date-fns `format` | 1,544,545 | 0.36x | ±0.10% |

### Format to `'YYYY-MM-DD HH:mm:ss.SSS'`

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `getString` | 2,880,419 | 1.00x | ±0.10% |
| dayjs `.format()` | 726,737 | 0.25x | ±1.31% |
| dayjs `.format()`, wrapper reused | 805,733 | 0.28x | ±0.10% |
| date-fns `format` | 754,027 | 0.26x | ±1.03% |

### Parse `'17/03/2024'` with an explicit format

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `parse` | 1,625,541 | 1.00x | ±0.80% |
| dayjs + `customParseFormat`, strict | 601,665 | 0.37x | ±0.29% |
| date-fns `parse` | 515,123 | 0.32x | ±0.24% |

### Validate a string against a format

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `isValid` | 1,678,690 | 1.00x | ±0.20% |
| dayjs strict `.isValid()` | 489,199 | 0.29x | ±0.04% |
| date-fns `isValid(parse(...))` | 506,131 | 0.30x | ±0.10% |

### Add 1 day

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `add` | 5,300,101 | 1.00x | ±0.32% |
| dayjs `.add()` | 1,348,645 | 0.25x | ±0.12% |
| date-fns `addDays` | 6,977,315 | **1.32x** | ±0.02% |

### Add 1 month

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `add` | 3,763,085 | 1.00x | ±0.09% |
| dayjs `.add()` | 537,024 | 0.14x | ±0.13% |
| date-fns `addMonths` | 3,801,704 | **1.01x** | ±0.09% |

### `startOf('month')`

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `startOf` | 695,479 | 1.00x | ±0.10% |
| dayjs `.startOf()` | 2,347,750 | **3.38x** | ±0.10% |
| date-fns `startOfMonth` | 4,772,788 | **6.86x** | ±0.02% |

### Difference in days

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `between` | 1,720,946 | 1.00x | ±0.02% |
| dayjs `.diff()` | 1,756,580 | **1.02x** | ±0.85% |
| date-fns `differenceInDays` | 918,352 | 0.53x | ±0.03% |

### Difference in months

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `between` | 2,018,838 | 1.00x | ±0.05% |
| dayjs `.diff()` | 210,764 | 0.10x | ±0.10% |
| date-fns `differenceInMonths` | 1,061,515 | 0.53x | ±0.08% |

This table used to be the least stable in the suite, with a `date-fns` row that
swung 47% between runs and reversed the comparison. It is steady on the recorded
run — three consecutive whole-suite runs agreed within 2.4% on every row — but a
month difference does more work than any other case here, so treat a small gap
in it with the same suspicion as anywhere else.

## Where timeSolver is slower

Four cases, with the reason for each. None of them is a bug and none of them is
worth changing the library's behaviour for, but pretending they are not there
would make the rest of this page untrustworthy.

- **`startOf('month')` — date-fns is 6.86x faster and dayjs 3.38x.** This is
  the one large gap, and it is not indirection: it is daylight saving. The
  benchmark date is 17 March 2024, and the pinned zone is `America/New_York`,
  where the clocks moved on 10 March. So the start of that month sits at a
  different UTC offset from the date itself, and `startOf` takes the path that
  exists for exactly this case — it bisects for the instant the label actually
  began, because a zone can jump clean over the start of a unit (Pacific/Chatham
  moves 02:45 to 03:45, so local 03:00 never happens there) and a wall clock can
  leave a unit and come back. `startOfMonth` does `setDate(1)` and
  `setHours(0, 0, 0, 0)` and stops.

  Measured directly, `startOf(date, 'month')` costs 1.43 µs in
  `America/New_York` against 0.135 µs in `UTC`, and `startOf(date, 'day')` — no
  shift inside the unit — costs 0.13 µs in either. Ten of twelve months a year
  are the cheap path even in a DST zone; the benchmark happens to sit in one of
  the two that are not, which is worth knowing before quoting this row.
- **`add(date, 1, 'day')` — date-fns is 1.32x faster.** `addDays` does one
  `setDate`. `add` also resolves the unit alias, rejects a non-finite amount,
  rejects a fractional calendar amount, and rechecks that the result is still
  a representable `Date` so an overflow throws instead of returning
  `Invalid Date`.
- **`add(date, 1, 'month')` — date-fns is 1.01x faster**, which is inside the
  noise on this hardware. It was 2.02x until `daysInMonth` stopped probing a
  third `Date` for the length of a month and answered from the calendar
  instead.
- **Difference in days — dayjs is 1.02x faster**, also inside the noise, and on
  a row where `dayjs` carries the largest margin of error in that table.

The two gaps that are real — `startOf` in a month containing a clock shift, and
`add 1 day` — are both cases where the extra work is the point: correctness
across a daylight-saving boundary in the first, and a thrown error in place of
an `Invalid Date` in the second.

## Reading these numbers

Please read this section before quoting anything above.

- **They are single-machine numbers from one run.** One laptop, one Node
  version, one time zone, throughput derived from the mean of the samples
  Vitest collected. They are not a ranking of these libraries in general, and
  they are not a promise about your hardware.
- **Shared CI runners vary by more than several of these gaps.** A hosted
  runner with a noisy neighbour routinely swings throughput by tens of
  percent — far more than the 1.32x on `add 1 day`, let alone the 1.01x on
  `add 1 month`. That is why `npm run bench` is not a CI gate: it would fail on
  scheduling noise, not on code.
- **Two rows are inside the noise floor.** `add 1 month` (1.01x) and difference
  in days (1.02x) are smaller than the run-to-run spread on this machine, and
  the second sits on the row with the largest margin of error in its table.
  Differences under a few percent mean nothing here, whichever direction they
  point.
- **The margin of error describes one window, not the gap between windows.** An
  earlier recorded run had a `date-fns differenceInMonths` figure that moved 47%
  when its file was run alone, enough to reverse that comparison. Three
  consecutive whole-suite runs of the current code agreed within 2.4% on every
  row, but the earlier case is why the advice stands: if a decision turns on a
  figure here, run the suite several times first.
- **These numbers are not comparable with an earlier revision of this page.**
  Every row moved when the machine's OS and the toolchain moved, including
  dayjs's and date-fns's. Two rows moved for reasons in this repository — a
  format is now tokenized once per format rather than per call, and month
  arithmetic no longer probes a `Date` for the length of a month — and the rest
  moved because the environment did. Compare rows within one run, never across
  runs.
- **The libraries are not feature-equivalent, and the return types differ.**
  dayjs returns its own wrapper objects, which is why it can be cheap on
  arithmetic and then charge you at `.toDate()`; timeSolver and date-fns both
  return native `Date`. dayjs cannot parse or validate against a format
  without a plugin, and date-fns has no format-aware validator at all. All
  three fill components the format omits differently: timeSolver uses
  1970-01-01T00:00:00.000 local, date-fns uses a reference date the caller has
  to pass, and dayjs falls back to parts of *today*, so `dayjs('03', 'MM',
  true)` moves as the calendar does. `between` returns a signed
  *fractional* difference — 437.77 days — while dayjs `.diff()` and date-fns
  `differenceIn*` return whole units; the two difference tables compare
  `Math.trunc(between(...))` against the others in the equivalence guard, but
  the timed call still computes the fraction the other two never compute.
- **A loss on an operation nobody calls in a loop does not matter.** Every
  figure on this page is between roughly 83,000 and 3,800,000 operations per
  second, so the slowest of them costs about 12 microseconds. If your code
  formats a hundred table rows per render, the entire difference between the
  fastest and slowest formatter here is well under a millisecond. Choose
  between these libraries on correctness, bundle size and API fit; come back
  to this page only when a profiler has already pointed at date arithmetic.
- **Reproduce before you cite.** If a number here disagrees with your own run,
  your run is the better evidence for your machine. Please open an issue with
  both outputs rather than adjusting the table.
