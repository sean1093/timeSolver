---
'timesolver': major
---

Refuse two classes of format string that `parse` and `isValid` could not handle safely.

**A variable-width token may no longer touch a digit that arrives as literal text.** The tokenizer already refused `'YYYYMD'`, where two variable-width tokens run together; it now applies the same rule to a digit written as a literal, so `'M0M'`, `'D0'` and `'H:m:s9'` throw `INVALID_FORMAT` instead of compiling. Such a format built a matcher — `^(\d{1,2})0(\d{1,2})$` — in which every capture group has two viable widths at every position, so an input of digits that did not match cost exponential time: a 59-character format against a 90-character input took 11.5 seconds of synchronous CPU, and forty tokens was an indefinite hang. A digit next to a variable-width token is exactly as ambiguous as a numeric token next to one, and it is now reported the same way. Separate them (`'M-0'`), or use the fixed-width token (`'MM0'`).

**A parseable format is limited to 512 tokens.** Past a few thousand capture groups the runtime refuses to compile the pattern and reports it as a raw `SyntaxError` — "Stack overflow" at a threshold that depends on the stack left, so it was not even deterministic, and "Too many captures" beyond about 32,000. That error carried none of this library's codes, so `parse` threw something callers could not branch on and `isValid` returned `false` for what is a caller bug. Both now throw `TimeSolverError` with `INVALID_FORMAT`. `getString` builds no matcher and is unchanged, so a long format still renders.

**Migration.** Neither shape can appear in a format that was doing something useful: the first was ambiguous by construction and the second could not be parsed at all. If you generate formats programmatically, separate a variable-width token from a following digit with any non-digit character, and branch on `error.code === 'INVALID_FORMAT'` where you previously saw a `SyntaxError` or a silent `false`.
