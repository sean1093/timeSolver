# timeSolver documentation

Tiny, immutable date utilities over the native `Date`. Start wherever matches
what you are doing.

## Guides

| | |
|---|---|
| **[Usage guide](usage.md)** | A task-oriented tour: formatting, parsing, validating, arithmetic, ranges, comparison, profiling. Start here if you are new. |
| **[Recipes](recipes.md)** | Complete answers to specific jobs — date range queries, relative labels, month-to-date reports, validating user input, week-numbered periods. |
| **[API reference](api.md)** | Every function, signature, option, error and edge case. The place to settle an argument about behaviour. |
| **[Migration from 1.x](migration-v1-v2.md)** | What changed in 2.0, why, and the six-step checklist. Most call sites need no edits; the semantics behind them did change. |
| **[Support policy](support.md)** | Which versions get fixes, which Node versions are supported, and what this project treats as a breaking change. |
| **[Benchmarks](benchmarks.md)** | Measured throughput against dayjs and date-fns, including the operations where timeSolver is slower, and what the numbers are worth. |

## Other languages

The usage guide is translated. The API reference, recipes and support policy are
English-only.

- [繁體中文](usage.zh.md)
- [日本語](usage.ja.md)

## Design records

[`specs/`](specs) holds the accepted design documents. The one that matters is
[the 2.0 renovation design](specs/2026-08-28-v2-renovation-design.md): it records
the audit of 1.x, with reproductions of every defect, the API decisions taken in
response, and the alternatives rejected. Read it before proposing an
architectural change.

## Contributing

Setup, scripts, quality gates and the release process: [CONTRIBUTING.md](../CONTRIBUTING.md).
Security reports: [SECURITY.md](../SECURITY.md).

## Scope

Three things are deliberately absent, and the reasoning is in
[the README](../README.md#scope):

- **Time zones.** Every function reads the host zone. `Temporal` and `Intl` do this properly.
- **Locales.** Month and weekday names are English. `Intl.DateTimeFormat` localises.
- **Durations and humanisers.** No `fromNow()`, no `humanize()`.
