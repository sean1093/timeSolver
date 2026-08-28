# Support policy

What this project promises, so you can decide how much to lean on it.

- [Versioning](#versioning)
- [What counts as a breaking change](#what-counts-as-a-breaking-change)
- [What does not](#what-does-not)
- [Supported versions](#supported-versions)
- [Supported runtimes](#supported-runtimes)
- [TypeScript](#typescript)
- [Time zone data](#time-zone-data)
- [Deprecations](#deprecations)
- [Reporting problems](#reporting-problems)

## Versioning

[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Releases are cut
from [changesets](https://github.com/changesets/changesets), so every published
version has a changelog entry naming what moved and why.

Every release is published from CI with an
[npm provenance attestation](https://docs.npmjs.com/generating-provenance-statements),
which ties the tarball to the commit and workflow that built it. Nobody
publishes from a laptop.

## What counts as a breaking change

A major release, and it must be in the changelog with a migration note:

- removing or renaming an export
- adding a required parameter, or changing the meaning or order of existing ones
- changing what a function returns for input it already accepted
- throwing where a value was returned, or returning where an error was thrown
- changing the numeric result of `between`, `getISOWeek`, `getWeekOfYear` or any
  other computation for input that already worked
- narrowing an accepted input type, or widening a return type in a way that
  breaks assignment
- raising the minimum Node version
- changing the `exports` map so an existing import specifier stops resolving

The list is deliberately strict about **computed results**. For a date library,
a silently changed number is worse than a compile error: the code keeps running
and the answers are wrong. The 2.0 release changed several results on purpose,
and every one is enumerated in the [migration guide](migration-v1-v2.md).

## What does not

A minor or patch release:

- adding an export, or an optional parameter with a default that preserves current behaviour
- accepting an input that previously threw, where there is one obvious meaning
- improving an error *message* — do not match on message text; branch on `error.code`
- performance, bundle size, and anything under `scripts/`, `bench/` or `.github/`
- documentation, including corrections to claims about 1.x behaviour
- devDependency updates, since the package has no runtime dependencies

Error **codes** are part of the API. `INVALID_DATE`, `INVALID_UNIT`,
`INVALID_FORMAT` and `INVALID_ARGUMENT` will not be renamed or repurposed in a
minor release. Error messages are not part of the API.

## Supported versions

| Version | Status |
|---|---|
| `2.x` | Supported. Fixes land here. |
| `1.x` | End of life. It is also not installable in practice: the published `1.2.0` tarball declares a `main` that the tarball does not contain, so `require('timesolver')` never worked. |

There is no long-term-support branch. This is a single-maintainer library with
zero runtime dependencies; the honest promise is that the current major gets
fixes, not that an old one is patched in parallel.

## Supported runtimes

`package.json` declares `engines.node >= 20`. CI runs the full suite on Node 20,
22, 24 and 26 on Linux, and on Node 24 on Windows and macOS — a date library
reads the host platform's time zone database and ICU build, which is exactly
what differs between platforms.

Browsers: the `<script>` bundle targets ES2018; the ESM and CJS builds target
ES2022. Transpile them if you support older browsers. There is no
browser-support matrix, because the library uses nothing beyond `Date`,
`Intl`-free string handling, and `performance.now()` in the profiler.

Dropping a Node version that is past its end of life is a **major** release,
even though the runtime itself is unsupported by then.

## TypeScript

Declarations are generated from the implementation by the build, so they cannot
drift from it. The published surface is gated in CI against a committed snapshot
(`api-surface.txt`), so a widened parameter or a changed return type shows up as
a reviewable diff rather than a surprise.

`tsc --noEmit` is clean under `strict`, `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes`. Resolution is verified for `node10`, `node16` from
both CJS and ESM, and bundler mode.

TypeScript itself is a devDependency, so no minimum version is enforced at
install time; the declarations use nothing newer than TypeScript 5.0 syntax.

## Time zone data

This library has none. It reads whatever the host runtime provides, which means
a historical date can be interpreted differently on two machines with different
ICU builds — a real example is `America/New_York` on 1946-09-29, whose rules
some platforms carry and others do not.

Two consequences worth planning around:

- Store instants (`toISOString()`, epoch milliseconds), not wall-clock strings, when the exact moment matters.
- A wall-clock reading inside a repeated hour names two instants; `parse` resolves to the earlier one.

## Deprecations

The 1.x names `timeLook`, `timeLookStart` and `timeLookReport` are kept
indefinitely. They are three small wrappers around a shared profiler instance
and cost nothing to carry, so there is no reason to make anyone rewrite working
code. They are not deprecated, merely superseded by `createProfiler` for new
code.

If something ever is deprecated, it will be marked `@deprecated` in the
declarations for at least one minor release before removal, so editors and
linters surface it before a build breaks.

## Reporting problems

- **Bugs and feature requests:** the [issue templates](https://github.com/sean1093/timeSolver/issues/new/choose). A minimal reproduction and your IANA time zone are the two things that make a date bug diagnosable.
- **Vulnerabilities:** [SECURITY.md](../SECURITY.md), privately, not a public issue.
- **Questions:** GitHub Discussions.

A bug report that includes the output of
`Intl.DateTimeFormat().resolvedOptions().timeZone` gets diagnosed considerably
faster than one that does not.
