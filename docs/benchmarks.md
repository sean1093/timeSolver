# Benchmarks

Throughput of the operations a caller actually hits, measured against
[dayjs](https://day.js.org) and [date-fns](https://date-fns.org) wherever an
equivalent call exists.

The point of this page is not to claim a winner. It is to make the cost of each
operation checkable, so that a performance argument in an issue can be settled
by rerunning a command rather than by assertion. Nine operations are measured
across twenty head-to-head comparisons, and on the recorded run timeSolver is
behind in four of them; those four are in the tables and again in
[Where timeSolver is slower](#where-timesolver-is-slower), in the same place
as everything else. A fifth comparison reverses on a rerun, which is noted
under the table it belongs to rather than left for a reader to discover.

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
| OS | macOS 26.5 (build 25F71), Darwin 25.5.0 arm64 |
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
| timeSolver `getString` | 989,647 | 1.00x | ±0.17% |
| dayjs `.format()` | 506,732 | 0.51x | ±1.63% |
| dayjs `.format()`, wrapper reused | 498,531 | 0.50x | ±0.33% |
| date-fns `format` | 549,601 | 0.56x | ±1.17% |

### Format to `'YYYY-MM-DD HH:mm:ss.SSS'`

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `getString` | 507,190 | 1.00x | ±0.21% |
| dayjs `.format()` | 470,250 | 0.93x | ±0.56% |
| dayjs `.format()`, wrapper reused | 551,909 | **1.09x** | ±0.40% |
| date-fns `format` | 467,126 | 0.92x | ±1.10% |

### Parse `'17/03/2024'` with an explicit format

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `parse` | 639,247 | 1.00x | ±0.28% |
| dayjs + `customParseFormat`, strict | 584,850 | 0.91x | ±0.48% |
| date-fns `parse` | 494,678 | 0.77x | ±0.80% |

### Validate a string against a format

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `isValid` | 633,316 | 1.00x | ±1.01% |
| dayjs strict `.isValid()` | 290,108 | 0.46x | ±0.47% |
| date-fns `isValid(parse(...))` | 328,266 | 0.52x | ±0.42% |

### Add 1 day

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `add` | 3,491,583 | 1.00x | ±0.47% |
| dayjs `.add()` | 804,830 | 0.23x | ±0.21% |
| date-fns `addDays` | 3,822,248 | **1.09x** | ±0.05% |

### Add 1 month

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `add` | 1,119,856 | 1.00x | ±1.17% |
| dayjs `.add()` | 200,450 | 0.18x | ±3.35% |
| date-fns `addMonths` | 2,256,828 | **2.02x** | ±3.02% |

### `startOf('month')`

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `startOf` | 2,534,056 | 1.00x | ±0.15% |
| dayjs `.startOf()` | 1,448,041 | 0.57x | ±0.19% |
| date-fns `startOfMonth` | 2,850,879 | **1.13x** | ±0.14% |

### Difference in days

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `between` | 1,078,666 | 1.00x | ±0.18% |
| dayjs `.diff()` | 929,503 | 0.86x | ±0.69% |
| date-fns `differenceInDays` | 468,016 | 0.43x | ±1.77% |

### Difference in months

| Implementation | ops/sec | Relative | rme |
|---|---:|---:|---:|
| timeSolver `between` | 386,801 | 1.00x | ±1.08% |
| dayjs `.diff()` | 83,010 | 0.21x | ±0.99% |
| date-fns `differenceInMonths` | 257,071 | 0.66x | ±7.00% |

**Do not rely on this table.** It is the least stable in the suite, and the
`date-fns` row carries the worst margin of error on the page. Re-running
`bench/compare.bench.ts` on its own, on the same machine minutes later, put
`differenceInMonths` at 379,021 ops/sec instead of 257,071 — a 47% swing that
reverses the comparison, from date-fns 0.66x to date-fns 1.04x. Running one
file alone rather than the whole suite changes the JIT and GC state it
inherits, and that is apparently enough. The only claim this table supports is
that dayjs `.diff()` is several times slower than both of the others here,
which is the one gap far larger than the noise.

## Where timeSolver is slower

Four cases, with the reason for each. None of them is a bug and none of them is
worth changing the library's behaviour for, but pretending they are not there
would make the rest of this page untrustworthy.

- **`startOf('month')` — date-fns is 1.13x faster.** `startOfMonth` truncates
  the date directly, while `startOf` first copies the input through `toDate`,
  then lowercases and resolves the unit alias, then dispatches through a
  lookup table. That indirection is the price of one function accepting nine
  units in any spelling.
- **`add(date, 1, 'day')` — date-fns is 1.09x faster.** `addDays` does one
  `setDate`. `add` also resolves the unit alias, rejects a non-finite amount,
  rejects a fractional calendar amount, and rechecks that the result is still
  a representable `Date` so an overflow throws instead of returning
  `Invalid Date`.
- **`add(date, 1, 'month')` — date-fns is 2.02x faster.** Both clamp February
  31 to February 29, but timeSolver reaches the clamp through `daysInMonth`,
  which validates both arguments and allocates a third `Date` as a probe, on
  top of the copies made by `toDate` and `shiftMonths`. `addMonths` gets the
  same bound from `setMonth(month + 1, 0)` on a clone it already had, and has
  no unit alias to resolve and no amount to validate.
- **Formatting `'YYYY-MM-DD HH:mm:ss.SSS'` — dayjs is 1.09x faster, but only
  when the caller already holds a `Dayjs`.** `getString` allocates a parts
  array and makes one call per part, and this format tokenises to thirteen
  parts — seven tokens and six literals — which costs more than dayjs's
  single regex pass over the format string. Starting from a `Date`, as the
  other rows in that table do, dayjs is 0.93x and timeSolver is still ahead.

Three of the four losses are against date-fns's single-purpose functions,
where the gap buys a wider accepted input or a thrown error in place of an
`Invalid Date`. The fourth is a genuine algorithmic difference — a parts loop
against a regex pass — and it only appears on long formats, for a dayjs caller
who is already holding a wrapper.

## Reading these numbers

Please read this section before quoting anything above.

- **They are single-machine numbers from one run.** One laptop, one Node
  version, one time zone, throughput derived from the mean of the samples
  Vitest collected. They are not a ranking of these libraries in general, and
  they are not a promise about your hardware.
- **Shared CI runners vary by more than several of these gaps.** A hosted
  runner with a noisy neighbour routinely swings throughput by tens of
  percent — far more than the 1.09x on `add 1 day` or the 1.13x on
  `startOf('month')`. That is why `npm run bench` is not a CI gate: it would
  fail on scheduling noise, not on code.
- **This harness has visible resolution limits.** In the first formatting
  table, reusing a dayjs wrapper measured *slower* than building one per call
  (498,531 against 506,732), which cannot be true — constructing an object is
  not free. The 1.6% gap sits inside that row's ±1.63% margin of error. Treat
  it as the noise floor for this page: differences under a few percent mean
  nothing, whichever direction they point.
- **Even on this machine, a rerun moved one figure by 47%.** Re-running
  `bench/compare.bench.ts` alone put `date-fns differenceInMonths` at 379,021
  ops/sec against the 257,071 in the table above, which is enough to reverse
  that comparison. The margin of error Vitest prints describes the spread
  *within* one measurement window; it says nothing about the spread between
  windows, and on that row the between-window spread is an order of magnitude
  larger. If a decision turns on a figure here, run the suite several times
  first.
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
