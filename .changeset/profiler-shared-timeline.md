---
'timesolver': minor
---

Make the 1.x `timeLook` names share one timeline across both entry points.

`timeLookStart`, `timeLook` and `timeLookReport` are documented in three places as driving one shared profiler instance, but the package ships `timesolver` and `timesolver/profiler` as independent bundles — each with its own copy of the profiler module, in ESM and in CommonJS alike. The instance was module-level, so it was one timeline per copy: starting a run through the root export and marking through the subpath threw `INVALID_ARGUMENT: Call start() before mark()`.

The compatibility timeline now lives under a well-known symbol, so every copy resolves to the same object, across the subpath boundary and across the ESM/CommonJS one. It is created on first use, so importing the library still writes nothing to `globalThis` and a bundler can drop all of it for anyone who does not call the 1.x names. `createProfiler` is untouched and still returns an isolated timeline.

`scripts/smoke.mjs` now proves this against the built bundles: it holds both ESM entry points at once, confirms they really are separate module copies, starts a run through one and marks through the other. Verified to fail before this change and pass after.
