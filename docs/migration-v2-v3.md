# Migrating from 2.x to 3.0

Every function keeps its name, its argument order and its return type. Nothing
was removed, nothing was renamed, and no import specifier changed. What changed
is a set of answers that were wrong, and a set of inputs that were accepted and
should not have been.

Read the [changelog](../CHANGELOG.md) for the full list. This page is the part
that can affect code you have already written.

- [Do I need to do anything?](#do-i-need-to-do-anything)
- [Changed results](#changed-results)
- [Refused input](#refused-input)
- [Errors that changed shape](#errors-that-changed-shape)
- [New behaviour you may want](#new-behaviour-you-may-want)
- [Checklist](#checklist)

## Do I need to do anything?

Probably not. Run your tests. If you match on error *messages* rather than on
`error.code`, or if you pass format strings built from data, read on.

The one change most likely to reach real code is `'hh:mm:ss'`: written in lower
case it now means a 12-hour clock, as the token table always said it did.

## Changed results

**A lower-case 1.x time name is read as tokens.** `getString(date, 'hh:mm:ss')`
returned 24-hour output, because the string uppercases to the 1.x name
`'HH:MM:SS'`. `hh` is the 12-hour token, so it now renders a 12-hour clock, and
`isValid('13:45:07', 'hh:mm:ss')` is `false` where it used to be `true`.

| format | 2.x | 3.0 |
|---|---|---|
| `'hh:mm:ss'` | `'13:45:07'` | `'01:45:07'` |
| `'hh:mm:ss.sss'` | `'13:45:07.042'` | `'01:45:07.077'` |
| `'YYYY-MM-DD hh:mm:ss'` | `'… 13:45:07'` | `'… 01:45:07'` |
| `'YYYY-mm-DD'` | `'2024-03-17'` (month) | `'2024-45-17'` (minute) |
| `'HH:MM:SS'` and the other 35 1.x names | unchanged | unchanged |

Write the 1.x name in upper case to keep the 1.x reading. A format is now
translated only when it is *not* already a valid token string, which no 1.x name
is: all of them spell seconds `SS`, which is not a token in any case.

**Week numbers for years 0-99.** `getISOWeek` and `getWeekOfYear` counted from a
January anchor built with `new Date(year, 0, day)`, which maps those years into
1900-1999. `getISOWeek` of 4 January 0050 returned `-99136`; it returns `1`.

**`daysInMonth` past the representable range.** It probed a `Date` for the last
day of the month, so `daysInMonth(275761, 2)` was `NaN`. A month's length is a
calendar fact, so it is now arithmetic: `28`.

## Refused input

**A variable-width token may not touch a digit.** The tokenizer already refused
`'YYYYMD'`. It now refuses the same collision when the digit is literal text —
`'M0M'`, `'D0'`, `'H:m:s9'` — with `INVALID_FORMAT`. Such a format compiled to a
matcher in which every capture group had two viable widths at every position, so
a run of digits that did not match cost exponential time: 30 tokens against 90
digits took 11.5 seconds of synchronous CPU.

Separate them (`'M-0'`) or use the fixed-width token (`'MM0'`).

**A parseable format is limited to 512 tokens.** Past a few thousand capture
groups the runtime refuses to compile the pattern and reports a raw
`SyntaxError`. `parse` and `isValid` now throw `INVALID_FORMAT` instead;
`getString` builds no matcher and still renders a longer format.

## Errors that changed shape

All four error codes are unchanged, and message text was never part of the API.
What moved:

- `isValid(input, format)` **throws** `INVALID_FORMAT` for a format over the
  token limit, where it used to return `false`. It still never throws for bad
  *data*.
- `parse` throws `TimeSolverError` where an oversized format used to escape as a
  `SyntaxError` with no `code`.
- `endOf` **returns** at the top of the representable range, where it threw
  `INVALID_ARGUMENT` about an internal shift. Every unit containing the last
  representable instant now ends at that instant.
- `between(from, to, 'month' | 'quarter' | 'year')` **returns** for spans that
  reach the extremes of the range, where it threw for the same reason.
- `getISOWeek` and `getWeekOfYear` throw `INVALID_ARGUMENT` naming the January
  anchor they need, rather than `INVALID_DATE` describing a readable input as
  unreadable. This only happens within a year of the minimum representable
  instant.

## New behaviour you may want

- **`Z` and `ZZ` parse.** `parse('2024-03-17T12:00:00+08:00',
  'YYYY-MM-DDTHH:mm:ssZ')` is `2024-03-17T04:00:00Z`. The offset in the input
  decides the instant, in any host zone. ISO-8601's bare `Z` designator is not
  one of the shapes those tokens render, so it is refused; a string already in
  ISO form can be handed to any function as it is.
- **`isBetween` takes an options object.** `isBetween(date, start, end, {
  bounds: '[)' })` instead of `isBetween(date, start, end, undefined, '[)')`.
  The positional form still works.
- **Plural unit abbreviations.** `'mins'`, `'secs'`, `'hrs'`, `'mons'`, `'yrs'`,
  `'mills'`, `'msecs'`.
- **Literal brackets.** Inside an escape, `]]` is a literal `]`, so `'[[]'`
  renders `[` and `'[a]]b]'` renders `a]b`.
- **The 1.x `timeLook` names share one timeline** across `timesolver` and
  `timesolver/profiler`, which the documentation always claimed and the build
  did not deliver.
- **Formatting and parsing are three to four times faster**, because a format is
  tokenized once and kept rather than re-derived on every call.

## Checklist

1. Search for lower-case `hh` in format strings. `'hh:mm:ss'` and
   `'hh:mm:ss.sss'` change meaning; add `A`/`a` if you wanted a 12-hour clock,
   or upper-case the name if you wanted the 1.x reading.
2. Search for lower-case `mm` next to a date. `'YYYY-mm-DD'` now renders
   minutes, as the token table says.
3. If you generate formats from data, make sure a variable-width token is never
   followed by a digit, and keep them under 512 tokens.
4. Replace any `error.message` matching with `error.code`.
5. If you special-cased `NaN` from `daysInMonth`, or a throw from `endOf` or
   `between` at the extremes of the range, remove it.
6. Run your tests.
