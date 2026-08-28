import { defineConfig } from 'vitest/config';

// Every function in this library reads the host time zone. Pinning it makes the
// suite deterministic on any machine and, because America/New_York observes DST,
// keeps the daylight-saving assertions meaningful. Override with TZ=... to
// reproduce a zone-specific report.
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
