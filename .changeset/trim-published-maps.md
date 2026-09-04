---
'timesolver': patch
---

Stop publishing the browser bundle's source map.

`dist/timesolver.global.js.map` was 102 kB describing a 17.6 kB minified bundle — a fifth of everything an install downloaded, and unpkg and jsdelivr served it next to the script tag it belongs to. The ESM and CommonJS builds keep their maps, because those are the files a bundler consumer steps into; nobody debugs a minified browser global against the TypeScript sources.

The published tarball goes from 130.8 kB packed and 510.5 kB unpacked to 112.7 kB and 440.2 kB, with no change to any bundle a consumer runs.
