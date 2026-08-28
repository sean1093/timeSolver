---
'timesolver': minor
---

Add week numbering: `getISOWeek`, `getISOWeekYear` and `getWeekOfYear`.

`getISOWeek` and `getISOWeekYear` implement ISO-8601, where weeks start on Monday and week 1 is the week containing 4 January. The pair exists because the week-numbering year is not always the calendar year: 30 December 2024 is week 1 of 2025, and 1 January 2023 is week 52 of 2022. Rendering an ISO week beside `YYYY` produces a wrong label for a few days either side of January, so both functions are needed to build one correctly.

`getWeekOfYear` is the plainer convention — week 1 contains 1 January, counted in the calendar year — and takes the same `weekStartsOn` option as `startOf`. Its first and last weeks may be partial, so it can return up to 54.

No `W` format tokens were added: a week number cannot be parsed back into a date on its own, and a token that rendered a week number next to `YYYY` would be wrong at the year boundary.
