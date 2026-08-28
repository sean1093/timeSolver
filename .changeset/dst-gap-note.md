---
'timesolver': patch
---

Document that day and week arithmetic can land in a daylight-saving gap.

Both keep the wall-clock time, so a step can land on a local time that does not exist — `2023-03-12 02:00` in `America/New_York` is skipped — and the runtime normalises it forward to `03:00`. The calendar date is always the one requested; the clock can move by one transition.

No behaviour changed. Found by the property-based suite, which was asserting an invertibility that calendars do not offer.
