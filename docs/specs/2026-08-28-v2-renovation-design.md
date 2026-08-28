# timeSolver v2 — Renovation Design

- Status: accepted
- Date: 2026-08-28
- Scope: whole repository (source, packaging, tests, CI, docs, governance)
- Outcome: `timesolver@2.0.0` — a TypeScript-first, immutable, zero-dependency date utility

## 1. Why

`timesolver@1.2.0` has been on npm since 2018. Auditing the repository and the
published tarball surfaced defects at three levels.

### 1.1 The published package does not work

```
$ npm pack timesolver@1.2.0 && tar tzf timesolver-1.2.0.tgz
package/package.json
package/README.md
package/LICENSE
package/timeSolver.min.js        <- root
```

`package.json#main` is `src/1.2.0/timeSolver.min.js`, a path absent from the
tarball. `require('timesolver')` therefore fails for every consumer.

### 1.2 The repository source exports nothing

`package.json` declares `"type": "module"`, so every `.js` file is an ES module.
`src/index.js` ends with a UMD-style footer:

```js
if (typeof module !== 'undefined' && ...) module.exports = _timeSolver;
else if (typeof window !== 'undefined') window.timeSolver = _timeSolver;
```

Under ESM both `module` and `window` are undefined, so the file has no exports:

```
$ node -e "import('./src/index.js').then(m => console.log(Object.keys(m)))"
ESM namespace keys: []
```

`exports["."].types` points at `dist/index.d.ts`, which no build step produces.
The test suite hides this: all seven files `require('./../src/1.2.0/timeSolver')`
— a stale copy — through Jest's CJS transform, so 142 tests pass green against
code that is not the package entry point.

### 1.3 Confirmed behavioural defects

Reproduced against `src/index.js` loaded as CJS (`node /tmp/probe.cjs`) — that
is, the repository's last 1.x source, which is what this rewrite replaces. The
tarball published as 1.2.0 is an older build with 23 of these format names and
no `DD`-first validators, so some of the numbers below have no counterpart
there; §1.1 covers that build separately.

| # | Defect | Observed | Expected |
|---|--------|----------|----------|
| 1 | `add`/`subtract` mutate the caller's `Date` | `d` becomes `2020-01-02` after `add(d, 1, 'D')` | input untouched |
| 2 | `equal` compares `Date.toString()`, dropping ms | `equal(...:00.001Z, ...:00.999Z) === true` | `false` |
| 3 | `between` uses average-length months/years | Jan 1 → Feb 1 in `'M'` = `1.0184804928131417` | `1` |
| 4 | same, for years | 2020 → 2021 in `'Y'` = `1.002053388090349` | `1` |
| 5 | Validation regex caps February at 28 | `isValid('2020-02-29','YYYY-MM-DD') === false` | `true` |
| 6 | `DD-MM-YYYY` regex never checks day-vs-month | `isValid('31-02-2020','DD-MM-YYYY') === true` | `false` |
| 7 | Time-only validation splits on a space that is not there | `isValid('12:30:00','HH:MM:SS') === false` | `true` |
| 8 | `after`/`before` ignore the `unit` argument | `after('...T23:00Z','...T01:00Z','D') === true` (same day) | `false` |
| 9 | Invalid input logs to `console.error`, returns `null`, then callers dereference it | `getFullWeek('nope')` throws `TypeError: Cannot read properties of null` | typed, documented error |
| 10 | `getString` returns an error *string* on an unknown format | `'[timeSolver] Input Type Error'` | throw |
| 11 | `getAbbrWeek`/`getAbbrMonth` slice `Date.toString()` | engine/locale dependent | deterministic |

Additional non-behavioural findings: `package.json#license` says `ISC` while
`LICENSE` and the registry say MIT; `add(date, n, 'M')` inherits `setMonth`
overflow (Jan 31 + 1 month = Mar 2); `timeLook` keeps profiling state on the
shared singleton and formats output with `%c` CSS that Node ignores; a build
artifact (`timeSolver.min.js`) and a legacy source copy (`src/1.2.0/`) are
committed; `rollup.config.js` imports `./package.json` without an import
attribute, which modern Node rejects; the README carries hand-drawn static
badges that assert "tests passing" independently of reality; `docs/usage.md`
ends with a leftover assistant sentence ("If you want, I can also split this
document …").

## 2. Goals

1. A package that installs and imports correctly from ESM, CJS, and a `<script>` tag.
2. Correct-by-default semantics: immutable inputs, calendar-aware arithmetic, deterministic names.
3. First-class TypeScript types shipped from source, not hand-written.
4. Every v1 defect above covered by a regression test.
5. Open-source hygiene a stranger can navigate: contribution guide, code of conduct, security policy, issue/PR templates, honest badges, generated changelog, automated release with provenance.
6. Documentation that documents the shipped API — English canonical, zh/ja translations kept.

## 3. Non-goals

- No time zone engine and no `Intl` locale catalogue. `Temporal` and `Intl.DateTimeFormat` solve those; competing would trade the library's size advantage for a worse implementation. All functions operate on the host local time zone, and the docs say so.
- No plugin architecture, no chainable wrapper object, no immutable `TimeSolver` class. The API stays a flat set of functions over the native `Date`.
- No rename. `timesolver` on npm is the existing identity; v2 keeps it.
- No fluent duration/humanize API.

## 4. Positioning

| | moment | dayjs | date-fns | luxon | **timesolver v2** |
|---|---|---|---|---|---|
| Status | legacy | active | active | active | renovated |
| Mutable API | yes | no | no | no | no |
| Types | `@types` | bundled | bundled | bundled | bundled, generated |
| Strict format parsing | built in | plugin | built in | built in | built in |
| Format-aware validation | via parse | plugin | via parse | via parse | `isValid(input, format)` |
| Tree-shakable | no | partial | yes | no | yes |
| Runtime deps | 1 | 0 | 0 | 0 | 0 |
| Built-in profiler | no | no | no | no | yes (`timesolver/profiler`) |

The differentiators worth keeping are: one small module that does
format ⇄ parse ⇄ validate with the *same* token grammar (dayjs needs
`customParseFormat` for this), and the `timeLook` profiler, which no date
library ships and which is the reason this project's users found it.

## 5. Architecture

Nine focused modules replace the 666-line IIFE. Each is independently testable
and has one reason to change.

```
src/
  errors.ts       TimeSolverError, error codes
  units.ts        Unit type, alias table, MS_PER_UNIT
  coerce.ts       toDate(input): Date            (throws INVALID_DATE)
  tokens.ts       token grammar: format + parse specs, legacy v1 format table
  format.ts       getString(date, format?)
  parse.ts        parse(input, format), isValid(input, format?)
  manipulate.ts   add, subtract, startOf, endOf
  compare.ts      equal, between, after, before, afterToday, beforeToday
  calendar.ts     weekday/month names, quarter helpers, isLeapYear, daysInMonth
  profiler.ts     createProfiler(), legacy timeLook* delegates
  index.ts        named re-exports + default aggregate object
```

Dependency direction is one-way: `errors` ← `units`/`coerce` ← `tokens` ←
everything else. No cycles.

## 6. Public API

All functions are pure. Inputs accepted as `Date | string | number`, including a
`Date` from another realm — an iframe, a worker, or a `node:vm` context — where
`instanceof Date` is false, so detection uses the internal class tag instead.

### 6.1 Manipulation

| Signature | Semantics |
|---|---|
| `add(date, amount, unit?): Date` | new `Date`; input never mutated; month/year arithmetic clamps to the last valid day (Jan 31 + 1 month → Feb 28/29) |
| `subtract(date, amount, unit?): Date` | `add` with a negated amount |
| `startOf(date, unit): Date` | truncate to the start of the local unit (`day`, `month`, `quarter`, `week` = Sunday, …) |
| `endOf(date, unit): Date` | last representable millisecond of the unit |

`unit` defaults to `MILLISECOND`, matching v1. `amount` defaults to `0`.

### 6.2 Comparison

| Signature | Semantics |
|---|---|
| `between(from, to, unit?): number` | signed `to − from`; see 6.3 |
| `equal(a, b, unit?): boolean` | instant equality by `getTime()`; with `unit`, compares `startOf` |
| `after(a, b, unit?): boolean` | `a` strictly after `b`, at `unit` granularity |
| `before(a, b, unit?): boolean` | `a` strictly before `b`, at `unit` granularity |
| `afterToday(date): boolean` | `after(date, now, 'DAY')` |
| `beforeToday(date): boolean` | `before(date, now, 'DAY')` |

### 6.3 `between` per unit

Mixing exact and calendar arithmetic per unit is what callers expect, so the
rule is explicit and tested:

- `MILLISECOND … HOUR` — exact elapsed time divided by the unit length. Fractional. A 23-hour DST day is 23 hours, which is physically true.
- `DAY`, `WEEK` — calendar based, and therefore DST-safe: whole days from the difference between local midnights, plus the fractional remainder of the time-of-day difference. `WEEK` is `DAY / 7`.
- `MONTH`, `QUARTER`, `YEAR` — whole calendar months from the year/month fields, plus a fractional remainder scaled by the anchor month's length. `QUARTER` is `MONTH / 3`, `YEAR` is `MONTH / 12`. Jan 1 → Feb 1 is exactly `1`.

### 6.4 Formatting, parsing, validation — one grammar

`getString`, `parse`, and `isValid` share the token table in `tokens.ts`, so a
format that renders also parses and validates.

| Token | Output | Token | Output |
|---|---|---|---|
| `YYYY` `YY` | `2026` `26` | `mm` `m` | minute, padded / plain |
| `MMMM` `MMM` | `January` `Jan` | `ss` `s` | second, padded / plain |
| `MM` `M` | `01` `1` | `SSS` | millisecond, 3 digits |
| `DD` `D` | `05` `5` | `A` `a` | `AM` / `am` |
| `dddd` `ddd` | `Monday` `Mon` | `Q` | quarter `1`–`4` |
| `HH` `H` | 24-hour | `Z` `ZZ` | `+08:00` `+0800` |
| `hh` `h` | 12-hour | `[text]` | literal escape |

- `getString(date, format = 'YYYYMMDD'): string` — throws `INVALID_FORMAT` on an unknown token sequence rather than returning an error string.
- `parse(input, format): Date` — strict. The input must match the format exactly and the resulting fields must round-trip, so `31-02-2020` is rejected.
- `isValid(input, format?): boolean` — never throws for bad *data*: that is the point of the function. It does throw `INVALID_FORMAT` when the format string itself is malformed, because a broken format is a bug in the calling code rather than a property of the data. Without `format`, the check is `Date`-parseability (v1 behaviour). With `format`, it delegates to `parse`.

**v1 compatibility.** v1 used `MM` for both month and minute and normalised
formats with `toUpperCase()`. v2 tokens are case-sensitive, so the 36 legacy
names are kept in an explicit table: if `format.toUpperCase()` matches a v1 name,
it is rewritten to canonical tokens (`HH:MM:SS` → `HH:mm:ss`) before tokenising.
Every v1 format string — in any case — keeps working; anything else is treated as
canonical tokens. The table is exact-match, so no ambiguity exists.

### 6.5 Calendar helpers

`getFullWeek`, `getAbbrWeek`, `getFullMonth`, `getAbbrMonth` return values from
internal English tables (`'Monday'`, `'Mon'`, `'January'`, `'Jan'`) instead of
slicing `Date.toString()`, so output no longer depends on the engine's locale.
`getQuarterByMonth(month)` and `getFirstMonthByQuarter(quarter)` keep v1
behaviour (out-of-range input → `null`). `getQuarter(date)`, `isLeapYear(input)`,
and `daysInMonth(input)` are exported because the validator needs them anyway.

### 6.6 Errors

```ts
class TimeSolverError extends Error {
  readonly code: 'INVALID_DATE' | 'INVALID_UNIT' | 'INVALID_FORMAT' | 'INVALID_ARGUMENT';
}
```

The library never writes to `console`. Invalid input throws; callers who want a
boolean use `isValid`. This is the largest breaking change and the reason for a
major version.

### 6.7 Profiler

```ts
const p = createProfiler();       // isolated state, monotonic performance.now()
p.start();
p.mark('query');
const report = p.report();        // { total, slowest, marks: [{ label, ms, share }] }
p.print();                        // CSS-styled in browsers, plain text in Node
```

Available as `timesolver/profiler` and, for v1 callers, as
`timeLookStart()` / `timeLook(label)` / `timeLookReport()` on the default export,
delegating to one module-level instance.

## 7. Packaging contract

```jsonc
{
  "name": "timesolver",
  "version": "2.0.0",
  "type": "module",
  "license": "MIT",                       // was ISC, contradicting LICENSE
  "sideEffects": false,
  "engines": { "node": ">=20" },
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" },
    "./profiler": { "types": "./dist/profiler.d.ts", "import": "./dist/profiler.js", "require": "./dist/profiler.cjs" },
    "./package.json": "./package.json"
  },
  "unpkg": "dist/timesolver.global.js",
  "files": ["dist", "README.md", "LICENSE", "CHANGELOG.md"]
}
```

Scripts (the contract CI and CONTRIBUTING both rely on):

| Script | Command |
|---|---|
| `build` | `tsup` |
| `test` | `vitest run` |
| `test:coverage` | `vitest run --coverage` |
| `lint` / `lint:fix` | `biome check .` / `biome check --write .` |
| `typecheck` | `tsc --noEmit` |
| `check:exports` | `attw --pack . && publint` |
| `size` | `size-limit` |
| `smoke` | `node scripts/smoke.mjs` |

## 8. Toolchain

| Choice | Rejected alternative | Reason |
|---|---|---|
| TypeScript sources, generated `.d.ts` | JSDoc + hand-written `index.d.ts` | v1's declared `types` file never existed; generated types cannot drift |
| tsup (esbuild) | rollup | one config produces ESM + CJS + IIFE + `.d.ts`; the current rollup config is already broken under `type: module` |
| Vitest | Jest | native ESM/TS, no transform layer — the transform is precisely what let v1's dead ESM entry pass 142 tests |
| Biome | ESLint + Prettier | one binary, one config, no plugin matrix for a 700-line library |
| Changesets | semantic-release | reviewable version PRs, generated CHANGELOG, works with npm provenance |
| `publint` + `attw` | manual inspection | machine-checks the exact class of packaging bug that shipped in v1 |
| `size-limit` | none | the size claim in the README becomes a CI gate rather than a promise |

## 9. Quality gates

CI (`ubuntu-latest`, Node 20/22/24): `lint` → `typecheck` → `test:coverage` →
`build` → `check:exports` → `size` → `smoke`. Coverage thresholds enforced at
95% lines/functions/statements and 90% branches. `smoke` imports the built ESM
bundle, `require`s the built CJS bundle, and evaluates the IIFE bundle to assert
the global — the three consumption paths v1 broke.

Release (`release.yml`): Changesets opens a version PR; merging it publishes with
`--provenance` under `id-token: write`.

## 10. Governance and documentation

Added: `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), `SECURITY.md`,
`.github/ISSUE_TEMPLATE/{bug_report,feature_request,config}.yml`,
`.github/PULL_REQUEST_TEMPLATE.md`, `.github/dependabot.yml` (npm +
github-actions), `CODEOWNERS`, `.editorconfig`, `.nvmrc`.

Rewritten: `README.md` (real shields.io badges only), `CONTRIBUTING.md` (setup,
scripts, commit convention, changeset requirement, release flow),
`CHANGELOG.md` (Keep a Changelog, 2.0.0 entry), `docs/api.md` (complete
reference), `docs/migration-v1-v2.md` (every breaking change with before/after),
`docs/usage.md` + `docs/usage.zh.md` + `docs/usage.ja.md` (rewritten against the
v2 API), `examples/` (Node ESM + browser IIFE).

Deleted: `timeSolver.min.js`, `src/1.2.0/`, `src/index.js`, `rollup.config.js`,
`test/*.test.js`, `test/demo.html`.

## 11. Delivery plan

Six pull requests, each independently reviewable and green on its own:

| PR | Branch | Content |
|---|---|---|
| 1 | `docs/v2-renovation-spec` | this document |
| 2 | `chore/repo-hygiene` | governance files, `.editorconfig`, `.nvmrc`, `.gitignore`, `CONTRIBUTING`; touches no source and no `package.json` |
| 3 | `ci/pipeline` | `ci.yml` rewrite, `release.yml`, `dependabot.yml`; references §7 script names |
| 4 | `feat/typescript-core` | toolchain config, the nine modules, full Vitest suite, deletion of legacy sources, `package.json` rewrite |
| 5 | `feat/profiler` | `profiler.ts`, `timesolver/profiler` export, legacy delegates, tests |
| 6 | `docs/v2-documentation` | README, api, migration, translations, examples, changeset |

`package.json` is owned exclusively by PR 4 to keep the tree conflict-free;
PRs 2 and 3 depend only on the script names fixed in §7.

## 12. Migration summary (v1 → v2)

| v1 | v2 | Action |
|---|---|---|
| `add(d, …)` mutates `d` | returns a new `Date` | remove defensive copies |
| invalid input → `console.error` + `null` | throws `TimeSolverError` | guard with `isValid`, or catch |
| `getString(d, 'bogus')` → error string | throws `INVALID_FORMAT` | catch, or validate the format |
| `equal` ignores milliseconds | compares instants | pass `'SECOND'` for the old looseness |
| `between(…, 'M' \| 'Y')` fractional drift | exact calendar values | expect integers where v1 returned `1.018…` |
| `after/before` ignored `unit` | honour `unit` | previously-passed units now change results |
| `getAbbrWeek` via `toString()` | English table | identical output on V8; now stable elsewhere |
| `timeLook*` on the singleton | `createProfiler()` | legacy names still work |
| `require('timesolver')` broken | works | upgrade |

Names and argument orders are otherwise unchanged, so most v1 call sites compile
untouched; what changes is that they stop being wrong.

## 13. Risks

- **Throwing instead of returning `null`** breaks v1 callers that relied on the sentinel. Mitigated by the migration guide, and by `isValid` never throwing.
- **`between` day/week semantics** change from average-ms to calendar arithmetic. Documented per unit in §6.3 and covered by DST tests pinned to a fixed `TZ`.
- **56 downloads/month** means low blast radius; v1 remains installable at `timesolver@1`.
