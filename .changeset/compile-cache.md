---
'timesolver': patch
---

Tokenize a format once instead of on every call.

`getString`, `parse` and `isValid` re-derived everything from the format string each time they were called: the same string was uppercased to check it against the 1.x names, scanned for tokens, checked for stray brackets and for an ambiguous adjacency, and — for `parse` and `isValid` — compiled into a fresh `RegExp`. Measured over 300,000 iterations of `'YYYY-MM-DD HH:mm:ss'`, that was around 40% of every call.

A format now compiles once and is kept, up to 64 distinct formats, which covers any application that writes its formats as literals; past that the cache is cleared rather than evicting one entry, because a cache this small has nothing to gain from tracking use order. The matcher is built on the first `parse` of a format, so a format that is only ever rendered never compiles one.

Same machine, same process, before and after:

| call | before | after | |
|---|---|---|---|
| `getString(date, 'YYYY-MM-DD HH:mm:ss')` | 0.957 µs | 0.237 µs | 4.0x |
| `parse('2024-03-17 13:45:07', …)` | 2.044 µs | 0.591 µs | 3.5x |
| `isValid('2024-03-17', 'YYYY-MM-DD')` | 1.175 µs | 0.419 µs | 2.8x |

Nothing observable changes: the same formats produce the same results and the same errors, and a malformed format is not cached, so it fails identically every time.
