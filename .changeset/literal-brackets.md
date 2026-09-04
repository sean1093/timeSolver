---
'timesolver': minor
---

Let a format render a literal `[` or `]`.

Square brackets escape literal text, and there was no way to escape the delimiters themselves: `'[[]'` and `'[]]'` were both refused as unmatched brackets, so neither character could appear in output at all. Inside an escape, `]]` now means a literal `]`, and `[` needs no doubling because it cannot close one:

```ts
getString(date, '[[]YYYY[]]]'); // '[2024]'
getString(date, '[a]]b]');      // 'a]b'
parse('[2024-03-17]', '[[]YYYY-MM-DD[]]]'); // reads it back
```

A bracket outside an escape is still refused, so a genuine typo — `'YYYY]'`, `'[unclosed YYYY'` — still fails with `INVALID_FORMAT` rather than rendering something surprising. The escape body's two alternatives cannot match the same character, so the pattern stays linear however many brackets a caller passes.
