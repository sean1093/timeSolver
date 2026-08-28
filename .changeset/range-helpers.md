---
'timesolver': minor
---

Add `isBetween`, `min`, `max` and `clamp`.

`isBetween(date, start, end, unit?, bounds?, options?)` takes interval notation for its bounds — `'[]'`, `'[)'`, `'(]'` or `'()'` — because a date range usually wants the half-open form, so consecutive ranges neither overlap nor leave a gap. It compares at a `unit` like `equal` does, and takes the same `weekStartsOn` option. A reversed range returns `false` rather than being silently reordered.

`min` and `max` require at least one argument, which the types enforce, so there is no empty case to define; both return a new `Date`, and of equal dates the first wins.

`clamp(date, lower, upper)` returns the nearest endpoint when the date falls outside, and throws `INVALID_ARGUMENT` when `lower` is later than `upper` rather than swapping them and hiding the caller's mistake.
