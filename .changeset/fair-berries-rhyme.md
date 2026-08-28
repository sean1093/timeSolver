---
'timesolver': patch
---

Fix three edge-case defects found by leaving the pinned test time zone.

- `endOf` no longer crosses into the next calendar date in zones whose clocks jump at midnight. In `America/Santiago`, `endOf('2024-09-08', 'day')` returned `2024-09-09 00:59:59.999`, because local midnight does not exist that day and the shift was applied to the adjusted start. The unit is truncated again after the shift, so the result is `2024-09-08 23:59:59.999`. The same fix covers `week`, `month`, `quarter` and `year`.
- `add` and `subtract` throw `INVALID_ARGUMENT` when a shift leaves the range a `Date` can represent, instead of returning an Invalid Date. Returning the sentinel deferred the failure to whatever touched it next, which is the behaviour this library exists to avoid.
- Years before 1 CE render with the sign carried separately, so year `-1` formats as `-0001` rather than `00-1`.

Adds `npm run test:zones`, which checks calendar invariants over 366 days in seven time zones — including one that shifts at midnight and three whose offsets are not whole hours — and runs in CI. Every defect above was invisible to a suite pinned to a single zone.
