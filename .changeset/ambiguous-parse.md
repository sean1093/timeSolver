---
'timesolver': patch
---

Document that a wall-clock string is ambiguous during a backward daylight-saving transition.

When the clocks go back, an hour repeats, so one local reading names two instants — `America/New_York` read `01:59` twice on 1946-09-29. `parse` resolves to the earlier one. The rendered text always survives a `getString`/`parse` round trip; the exact instant does not, inside that hour.

No behaviour changed. Found by the property-based suite, which failed only on Linux with Node 20, because the historical zone rules a platform ships decide whether that 1946 transition exists at all.
