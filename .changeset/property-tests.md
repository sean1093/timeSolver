---
'timesolver': patch
---

Document that calendar month arithmetic is not invertible.

31 December plus 18 months clamps to 30 June, and subtracting 18 months from that returns 30 December, not 31. Days 1 to 28 exist in every month, so the round trip is exact there. This is a property of calendars rather than a defect, and every date library behaves the same way, but the `add` reference now says so instead of leaving callers to discover it.

Found by the new property-based suite, which is test-only and does not change any behaviour.
