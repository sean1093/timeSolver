---
'timesolver': minor
---

Accept an options object for `isBetween`, and plural unit abbreviations everywhere.

**`isBetween(date, start, end, { unit, bounds, weekStartsOn })`.** The three optional settings were positional, so the two most useful combinations forced a placeholder: this repository's own documentation had to write `isBetween(row.createdAt, start, end, undefined, '[)')` — for the half-open range that the same recipe recommends. The object form is additive and the positional form is unchanged, so nothing needs rewriting; a new `BetweenOptions` type is exported for callers who want to name the settings.

**Plural abbreviations.** The alias table accepted a plural for every full name and for none of the abbreviations, while the README invited readers to combine the two rules. `mills`, `msecs`, `secs`, `mins`, `hrs`, `mons` and `yrs` now resolve like their singulars. Single letters stay singular: `'d'` is a day, `'ds'` is not an alias.
