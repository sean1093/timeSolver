---
'timesolver': patch
---

Fix `startOf` and `endOf` where a zone skips or repeats a wall clock.

A wall clock is not a continuous line, and `Date`'s setters resolve a reading that never happened, or happened twice, in ways that broke three invariants range queries depend on.

- `endOf` could return an instant **before** its own `startOf`. In `America/New_York`, `endOf(new Date('2009-11-01T05:59:59Z'), 'hour')` returned `04:59:59.999Z`, an hour earlier than the hour it was asked about, because re-truncating the shifted instant resolved its ambiguous wall clock back to the first of the two readings.
- `startOf` could move **forward**, out of the unit it was given. In `Pacific/Chatham`, whose clocks move 02:45 to 03:45, `startOf(03:59:59, 'hour')` returned `04:00`, because local 03:00 does not exist that day.
- Where a zone repeats part of an hour rather than a whole one — Chatham moves 03:45 back to 02:45, so 02:45 to 02:59 happens twice with 03:xx in between — a date in the second run was given the first run's start.

Both functions now return the run of elapsed time that actually contains the date. `startOf(d) <= d <= endOf(d)`, both idempotence laws, and `startOf(endOf(d)) === startOf(d)` now hold for every unit in every zone; `docs/api.md` documents what that means where a wall clock is discontinuous.

The cost is 7% to 22% on these two functions, from the extra offset comparison that detects a clock shift. `npm run test:zones` now checks the invariants at hours spread through all 366 days, from both a named wall clock and elapsed milliseconds — only the second reaches the repeated readings, which is how one of these bugs hid.
