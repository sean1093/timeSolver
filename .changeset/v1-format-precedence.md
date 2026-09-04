---
'timesolver': major
---

Read a format as tokens whenever it is a valid token string, rather than as a 1.x name.

`normalizeFormat` uppercased the whole format string to look it up among the 36 names 1.x accepted, so a format that happened to spell one of them in lower case was translated — even when it was a perfectly good v2 format meaning something else. `hh` is documented as the 12-hour token, and `getString(date, 'hh:mm:ss')` rendered `'13:45:07'`, not `'01:45:07'`. `isValid('13:45:07', 'hh:mm:ss')` was `true`. `'YYYY-MM-DD hh:mm:ss'` was hijacked the same way, and so was `'YYYY-mm-DD'`, where `mm` is the minute token and month came out instead.

A format is now translated only when it is *not* already a token string — that is, when some letter in it belongs to no token, as in `'yyyy-mm-dd hh:mm:ss'`, where `yyyy` and `dd` are not tokens at all. Every 1.x name keeps its own meaning, in any case, because all of them write seconds as `SS`, which is not a token in any case. What changes is the handful of spellings that are valid token strings:

| format | before | after |
|---|---|---|
| `'hh:mm:ss'` | `'13:45:07'` (24-hour) | `'01:45:07'` (12-hour) |
| `'hh:mm:ss.sss'` | `'13:45:07.042'` | `'01:45:07.077'` |
| `'YYYY-MM-DD hh:mm:ss'` | `'2024-03-17 13:45:07'` | `'2024-03-17 01:45:07'` |
| `'YYYY-mm-DD'` | `'2024-03-17'` (month) | `'2024-45-17'` (minute) |
| `'HH:MM:SS'`, `'YYYY-MM-DD HH:MM:SS'`, and the other 34 names | unchanged | unchanged |

**Migration.** If you passed a lower-case 1.x time name — `'hh:mm:ss'` or `'hh:mm:ss.sss'` — write it in upper case to keep the 1.x reading, or add `A`/`a` if you wanted a 12-hour clock all along. Anything written as canonical tokens now means exactly what the token table says.
