---
'timesolver': minor
---

Add `weekStartsOn` so weeks no longer have to start on Sunday.

`startOf`, `endOf`, `equal`, `after` and `before` take an options object with `weekStartsOn`, `0` for Sunday through `6` for Saturday. It defaults to `0`, matching `Date#getDay`, so existing behaviour is unchanged; ISO-8601 weeks are `{ weekStartsOn: 1 }`, and the Saturday-start weeks used across much of the Middle East are `{ weekStartsOn: 6 }`. Every other unit ignores the option, and `between(a, b, 'week')` needs none: it measures a span, which does not depend on where weeks begin.

Values outside 0–6, and non-integers, throw `INVALID_ARGUMENT`.

The zone runner now checks, in all seven of its time zones and for all seven starts, that `startOf('week')` lands on the requested weekday, that the week brackets the date, and that it spans seven calendar days.
