---
'timesolver': minor
---

Read `Z` and `ZZ` offsets, so an offset-bearing string parses to an exact instant.

Both tokens rendered and neither parsed, on the grounds that reading an offset would mean modelling a zone. It does not: an offset says exactly how far the wall clock in the input sits from UTC, which is the whole of what is needed to pin the instant. No zone database, no rules, no ambiguity.

```ts
parse('2024-03-17T12:00:00+08:00', 'YYYY-MM-DDTHH:mm:ssZ'); // 2024-03-17T04:00:00Z
parse('2024-03-17T12:00:00+0800', 'YYYY-MM-DDTHH:mm:ssZZ'); // the same instant
isValid('2024-03-17T12:00:00+05:45', 'YYYY-MM-DDTHH:mm:ssZ'); // true

const stamp = 'YYYY-MM-DD HH:mm:ss.SSS Z';
parse(getString(date, stamp), stamp).getTime() === date.getTime(); // true, in any host zone
```

With an offset in the format, the wall-clock fields belong to that offset: the date is built in UTC and shifted, and `parse`'s round-trip check — the one that rejects 31 February and a weekday that disagrees — runs in the parsed offset rather than the host zone. The returned value is still a plain `Date`, so reading it back gives the host zone's wall clock; what is exact is the instant, not the text.

Each token matches only the shape it renders, `±HH:MM` for `Z` and `±HHMM` for `ZZ`. ISO-8601's bare `Z` designator is neither and is refused; a string already in ISO form can be handed to any function as it is, since `Date` parses it.

Every token in the table now has a pattern, which made the "can be formatted but not parsed" branch in `buildMatcher` unreachable, along with the undefined-pattern check in `digitWidth` and the mutation-testing suppression that came with it. All three are gone.
