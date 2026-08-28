# Contributing to timeSolver

Bug reports, failing-test reproductions, and pull requests are all welcome.
This document is the whole process: what you need installed, what the scripts
do, what a PR has to pass, and what will be declined on sight.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
Security problems go through [SECURITY.md](SECURITY.md), never a public issue.

## Prerequisites

- **Node.js >= 20.** The package declares `engines.node: ">=20"` and CI runs
  20, 22, and 24. `.nvmrc` pins 22 (the active LTS) for local work, so
  `nvm use` picks the right version.
- **npm.** The lockfile is `package-lock.json` and is committed; please do not
  swap in another package manager or commit a second lockfile.
- Nothing else. The library has **zero runtime dependencies** and the toolchain
  is entirely devDependencies.

## Getting started

```sh
git clone https://github.com/sean1093/timeSolver.git
cd timeSolver
npm ci
npm test
```

Use `npm ci`, not `npm install`: it installs exactly the lockfile and fails
loudly if `package.json` and the lockfile disagree, which is what CI does.

## Scripts

| Script | Command | What it checks |
|---|---|---|
| `npm run build` | `tsup` | Produces `dist/` — ESM, CJS, IIFE global, and generated `.d.ts` — from the TypeScript sources. |
| `npm test` | `vitest run` | Runs the suite once and exits. This is the command CI runs. |
| `npm run test:watch` | `vitest` | Same suite in watch mode while you edit. |
| `npm run test:coverage` | `vitest run --coverage` | Runs the suite and fails if coverage drops below the thresholds below. |
| `npm run lint` | `biome check .` | Formatting and lint rules. Read-only; it reports, it does not rewrite. |
| `npm run lint:fix` | `biome check --write .` | Applies every fix Biome can apply. Run this instead of arguing with `lint`. |
| `npm run typecheck` | `tsc --noEmit` | Type errors across the whole project, including tests. |
| `npm run check:exports` | `attw --pack . && publint` | Packs the tarball and verifies the `exports` map really resolves for ESM, CJS, and TypeScript consumers. |
| `npm run size` | `size-limit` | Fails if the bundle grows past its budget, so the size claim in the README stays true. |
| `npm run smoke` | `node scripts/smoke.mjs` | Imports the built ESM bundle, `require`s the built CJS bundle, and evaluates the IIFE bundle to assert the global. Requires `npm run build` first. |
| `npm run check:api` | `node scripts/api-surface.mjs` | Compares the public API surface of the built declarations against the committed `api-surface.txt`. Requires `npm run build` first. Run it with `-- --update` to approve an intentional API change. |
| `npm run bench` | `vitest bench --run` | Throughput of formatting, parsing and arithmetic against dayjs and date-fns. Not a CI gate; see below. Results and methodology: [docs/benchmarks.md](docs/benchmarks.md). |
| `npm run test:mutation` | `stryker run` | Mutation testing: changes the source in small ways and checks a test fails each time. Not a pull-request gate; runs weekly. See below. |

## Project layout

Each module under `src/` is independently testable and has one reason to
change. The dependency direction is one-way — `errors` <- `units`/`coerce` <-
`tokens` <- everything else — and there are no cycles.

| File | Responsibility |
|---|---|
| `src/errors.ts` | `TimeSolverError` and the `code` union every throw uses. |
| `src/units.ts` | The `Unit` type, its alias table, and `MS_PER_UNIT`. |
| `src/coerce.ts` | `toDate(input)`: the single `Date \| string \| number` entry point, throwing `INVALID_DATE`. |
| `src/tokens.ts` | The one token grammar shared by format, parse, and validate, plus the legacy v1 format table. |
| `src/format.ts` | `getString`. |
| `src/parse.ts` | `parse` and `isValid`. |
| `src/manipulate.ts` | `add`, `subtract`, `startOf`, `endOf`. |
| `src/compare.ts` | `equal`, `between`, `after`, `before`, `afterToday`, `beforeToday`. |
| `src/calendar.ts` | Weekday and month names, quarter helpers, `isLeapYear`, `daysInMonth`. |
| `src/profiler.ts` | `createProfiler` and the legacy `timeLook*` delegates. |
| `src/index.ts` | Named re-exports plus the default aggregate object. |

Tests live beside the suite in `test/` and are named after the module they
cover. New behaviour belongs in the module that owns it — please do not widen
`index.ts` into a place where logic lives.

## Making a change

**1. Branch.** Name it `<type>/<short-slug>`, where `<type>` is one of `feat`,
`fix`, `docs`, `chore`, `ci`, or `refactor`:

```sh
git switch -c fix/endof-month-dst
```

**2. Commit with [Conventional Commits](https://www.conventionalcommits.org/).**
The subject is imperative, at most 72 characters, and has no trailing period.
Explain *why* in the body, wrapped at 72 columns.

```text
fix(manipulate): keep endOf('MONTH') inside the month across DST

Adding a month before truncating overflowed a 30-day month into the
next one when the local offset shifted. Truncate first, then set the
day from daysInMonth.
```

```text
feat(compare): add between() support for the QUARTER unit
```

A `!` after the type, or a `BREAKING CHANGE:` footer, marks an
incompatible change.

**3. Test anything that changes behaviour.** A bug fix must come with a test
that fails before your change and passes after it — that test is what stops the
bug returning. A new function needs coverage of its happy path, its boundary
cases, and the `TimeSolverError` it throws on bad input. Refactors that change
no behaviour need no new test, but the existing suite must stay green.

**4. Add a changeset for anything user-visible.** If your change alters the
published package in any way a consumer could notice — API, behaviour, types,
bundle contents, documented defaults — run:

```sh
npx changeset
```

Pick the bump by what a consumer has to do:

| Bump | When | Example |
|---|---|---|
| `patch` | Behaviour that was already documented now actually works. No consumer action. | Fixing `endOf` off-by-one; correcting a type that was too narrow. |
| `minor` | Something new that existing code keeps working without. | A new exported helper; a new accepted format token. |
| `major` | Existing correct code has to change. | Removing or renaming an export; throwing where the old version returned a value. |

Commit the generated file in `.changeset/`. Purely internal changes — CI, tests,
lint config, a comment — need no changeset.

**5. Open the PR against `master`.** Fill in the template: what changed, why,
and the linked issue. Small, focused PRs get reviewed quickly; a large change is
better split into a reviewable series.

## Quality gates

Two CI jobs guard `master`, and both must pass before a PR can merge.

The **quality** job runs once, on Node 22, in this order:

1. `lint` — Biome formatting and rules.
2. `typecheck` — `tsc --noEmit` clean.
3. `test:coverage` — the suite plus coverage thresholds: **95% lines, 95%
   functions, 95% statements, 90% branches**. Below any of those, the job fails.
   The suite currently sits at 100% of all four, so a drop means something new
   is untested rather than that the bar is tight.
4. `build` — `tsup` produces all four outputs.
5. `check:exports` — `attw` and `publint` agree the packed tarball resolves for
   ESM, CJS, and TypeScript.
6. `check:api` — the built declarations describe the same public API surface as
   the committed `api-surface.txt`. A deliberate change is approved by running
   `npm run check:api -- --update` and committing the snapshot with it.
7. `size` — the bundle is within budget.
8. `smoke` — the built ESM, CJS, and IIFE bundles load, resolve by package
   name through the `exports` map, and compute correctly.

The **test** job runs `test`, `build`, and `smoke` on Node 20, 22, and 24, which
is what proves the published artifacts work on every supported runtime. Lint,
typechecking, coverage, packaging and size are runtime-independent, so they run
once rather than three times.

You can run the same sequence locally. The fast pre-push check is:

```sh
npm run lint && npm run typecheck && npm test
```

`npm run bench` is deliberately **not** one of these gates and must not be
added to either job. On several of the operations it measures, the spread
between the three libraries is smaller than the run-to-run variance of a
shared CI runner, so a threshold on those numbers would fail builds because of
scheduling noise on the runner rather than because of anything in the commit
under review. Benchmarks are a tool for investigating a suspected regression
locally, on one machine, with nothing else running — `docs/benchmarks.md`
records what the current numbers are and how much to trust them.

## Mutation testing

Coverage answers "did this line run". Mutation testing answers the question that
actually matters: **would a test have failed had this line been wrong?**

`npm run test:mutation` changes the source in small ways — flips a comparison,
swaps an operator, empties a string — and reruns the suite for each change. A
change that no test notices is a *survivor*, and a survivor is either a missing
assertion or a mutation nothing could ever detect.

The suite kills every mutant it can, and every mutant it cannot carries a
comment naming why:

```ts
// Stryker disable next-line EqualityOperator: at equality the numerator is
// zero, so either neighbour gives the same answer. Unkillable by construction.
const step = endTime > anchorTime ? 1 : -1;
```

Those comments are the point. If you add code and the mutation run reports a
survivor, one of two things is true, and both want a decision from you rather
than a threshold change:

1. **A test is missing.** Add it. This is the usual case, and it is how several
   real gaps were found: nothing had parsed a format containing `ddd`, nothing
   asserted an error `code` at four throw sites, and nothing pinned the minute
   and second fields of a day fraction.
2. **The mutation cannot be observed.** Say so in a `Stryker disable` comment
   with the reason. Membership tables read only through `Object.hasOwn` never
   observe their values; an error message is not part of the API.
3. **The test that kills it cannot run under Stryker.** One region is like this:
   the clock-shift handling in `src/manipulate.ts` needs a time zone other than
   the one the suite pins, and Stryker's Vitest runner hard-codes worker threads,
   where assigning `process.env.TZ` has no effect. `test/zone-chatham.test.ts`
   therefore skips during a mutation run. The region carries a `Stryker disable
   all` with that reason and names the two commands that do cover it --
   `npm test` in a normal run, and `npm run test:zones`, which reports the exact
   zone, date and invariant on failure. Both are CI gates, so the code is not
   unguarded; it is guarded somewhere Stryker cannot look. Keep such regions as
   small as the reason justifies.

Twice, a survivor turned out to be **dead code** — a guard that could never
fail. Deleting it was the right fix, and it took branch coverage to 100% as a
side effect. Prefer deleting to annotating.

The run takes about a minute and is deliberately not a pull-request gate. It
runs weekly and on demand: Actions, Mutation, Run workflow.

## Releases

Releases are automated and restricted to maintainers.

[Changesets](https://github.com/changesets/changesets) collects the changeset
files on `master` and opens a "Version Packages" pull request that bumps the
version and writes `CHANGELOG.md`. Merging that PR publishes to npm with
[provenance](https://docs.npmjs.com/generating-provenance-statements). Nobody
publishes from a laptop, and `CHANGELOG.md` is generated — please do not edit it
by hand in a PR.

One-time setup, for whoever owns the npm package: add an npm **automation**
token as a repository secret named `NPM_TOKEN` under Settings, then Secrets and
variables, then Actions. Classic tokens and granular tokens with 2FA
enforcement are rejected by unattended publishes. Until that secret exists the
release workflow runs, builds, and then stops with a warning instead of
publishing.

To release on demand rather than on the next push to `master`, run the Release
workflow manually: Actions, Release, Run workflow. Changesets publishes only
versions the registry does not already have, so a run with nothing to do
finishes without publishing anything.

## What does not belong in this library

These are settled design decisions, not open questions. A PR adding one of them
will be declined regardless of quality, so please open a discussion first if you
think the reasoning has changed:

- **No time zone engine and no `Intl` locale catalogue.** `Temporal` and
  `Intl.DateTimeFormat` already solve these; competing would trade this
  library's size advantage for a worse implementation. Every function operates
  in the host local time zone, and the docs say so.
- **No plugin architecture.** There is no extension point to register against
  and there will not be one.
- **No chainable wrapper and no immutable `TimeSolver` class.** The API stays a
  flat set of functions over the native `Date`.
- **No fluent duration or humanize API.** `between` returns a number.
- **No rename.** `timesolver` is the existing npm identity and v2 keeps it.
- **No runtime dependencies.** Not one. If a change needs a dependency at
  runtime, it needs a different design.

Everything else — correctness fixes, missing tests, clearer errors, smaller
output, better docs — is fair game.
