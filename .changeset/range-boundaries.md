---
'timesolver': major
---

Keep boundary arithmetic inside the range a `Date` can represent, and out of the 1900s.

**`getISOWeek` and `getWeekOfYear` were wrong for years 0-99.** Both counted from a January anchor built with `new Date(year, 0, day)`, which maps years 0-99 into 1900-1999 — so `getISOWeek` of 4 January 0050 reported `-99136` instead of `1`, and `getWeekOfYear` the same. The anchors are now built the way `parse` and `daysInMonth` already built theirs, by setting the year on a date that is safely in range. Years 100 and above were never affected.

**Both functions now name the anchor they cannot build.** Within a year of the minimum representable instant, 1 or 4 January does not exist, and the failure surfaced as `INVALID_DATE: Cannot read a date from an Invalid Date` — describing a perfectly readable input as unreadable. It is now `INVALID_ARGUMENT`, naming the January date that leaves the range.

**`endOf` no longer refuses the last unit of the range.** It computed the end as the start of the next unit minus a millisecond, and at the top of the range that shift threw `INVALID_ARGUMENT: Shifting by 1 day(s) leaves the range a Date can represent` — an internal step the caller never asked for. Every unit containing the last representable instant now ends at that instant, which is what "last representable millisecond of the unit" always claimed.

**`between` measures spans that reach the extremes.** For `'month'`, `'quarter'` and `'year'` it anchors on the start's day of month, which can overshoot the range even when both endpoints are inside it — 19 April -271821 plus 6,570,977 months is eight days past the last instant there is — and the whole call threw. It now steps back to the nearest anchor that exists and scales the remainder against a neighbouring month, so the full span is measurable and `between(a, b, unit) === -between(b, a, unit)` still holds exactly.

**`daysInMonth` answers from the calendar instead of returning `NaN`.** It probed a `Date` for the last day of the month, so `daysInMonth(275761, 2)` was `NaN` — silently, then flowing into arithmetic and rendering as `'NaN'`. A month's length is a calendar fact, so it is now computed arithmetically and correct for any integer year. As a consequence `add(date, months, 'month')` also reaches months it previously refused, including the first month of the range.

**Migration.** Every change either replaces a wrong number with the right one, an inaccurate error with an accurate one, or an error with the answer. If you special-cased any of them: results for years 0-99 from `getISOWeek`/`getWeekOfYear` change, `endOf` and `between` return where they threw at the extremes of the range, `getISOWeek`/`getWeekOfYear` throw `INVALID_ARGUMENT` rather than `INVALID_DATE` for the first year of the range, and `daysInMonth` returns a number where it returned `NaN`.
