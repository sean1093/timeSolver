import { defineConfig } from 'vitest/config';

// Every function in this library reads the host time zone. Pinning it makes the
// suite deterministic on any machine and, because America/New_York observes DST,
// keeps the daylight-saving assertions meaningful. Override with TZ=... to
// reproduce a zone-specific report.
process.env.TZ ??= 'America/New_York';

export default defineConfig({
  test: {
    // Two zones, because one cannot express everything a wall clock does.
    //
    // America/New_York shifts by a whole hour on the hour, so it can skip 02:00
    // to 02:59 and repeat 01:00 to 01:59 -- but it can never skip the start of a
    // unit, since no instant there has a local hour of 02 on that day, and its
    // repeated hour is one contiguous run. Pacific/Chatham shifts by an hour at
    // 02:45, so it skips local 03:00 outright and splits its repeated stretch in
    // two. Both shapes are reachable only from their own zone.
    projects: [
      {
        test: {
          name: 'local',
          include: ['test/**/*.test.ts'],
          exclude: ['test/zone-chatham.test.ts'],
          env: { TZ: process.env.TZ },
        },
      },
      {
        test: {
          name: 'chatham',
          include: ['test/zone-chatham.test.ts'],
          env: { TZ: 'Pacific/Chatham' },
        },
      },
    ],
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
