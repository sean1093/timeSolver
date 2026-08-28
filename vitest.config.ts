import { defineConfig } from 'vitest/config';

// Every function in this library reads the host time zone. Pinning it makes the
// suite deterministic on any machine and, because America/New_York observes DST,
// keeps the daylight-saving assertions meaningful. Override with TZ=... to
// reproduce a zone-specific report.
//
// One file, test/zone-chatham.test.ts, switches zone for itself: the shapes it
// covers cannot occur in a zone that shifts on the hour. It does that at
// runtime rather than through a Vitest project, because per-project `env` is not
// honoured by every tool that drives this suite -- Stryker's runner reads this
// file and runs every test in one zone.
process.env.TZ ??= 'America/New_York';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    env: { TZ: process.env.TZ },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        lines: 95,
        functions: 95,
        statements: 95,
        branches: 90,
      },
    },
  },
});
