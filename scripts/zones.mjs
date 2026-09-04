#!/usr/bin/env node

/**
 * Zone invariants.
 *
 * The unit suite pins TZ so its expected values are reproducible, which means it
 * never exercises a second zone. Every defect this script checks for was found
 * only by leaving America/New_York:
 *
 * - America/Santiago jumps forward at midnight, so `startOf(day)` is 01:00 and a
 *   naive `endOf(day)` landed on the following calendar date.
 * - Asia/Kathmandu, Pacific/Chatham and Australia/Lord_Howe have offsets that
 *   are not whole hours, which the `Z` and `ZZ` tokens have to render.
 * - Australia/Lord_Howe shifts by 30 minutes rather than an hour.
 *
 * The assertions here are invariants rather than fixed strings, so they hold in
 * any zone. Run after `npm run build`; each zone runs in its own process,
 * because a zone can only be chosen before the runtime reads it.
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ZONES = [
  'UTC',
  'America/New_York', // whole-hour offset, DST at 02:00
  'America/Santiago', // DST at 00:00, so local midnight does not always exist
  'Asia/Kathmandu', // +05:45, never shifts
  'Australia/Lord_Howe', // +10:30, shifts by 30 minutes
  'Pacific/Chatham', // +12:45, shifts at 02:45
  'Pacific/Kiritimati', // +14:00, the far edge of the range
];

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Two instants six months apart, so a zone's standard and summer offsets differ. */
const SAMPLES = [Date.UTC(2024, 0, 15, 12), Date.UTC(2024, 6, 15, 12)];

/**
 * Minutes east of UTC for an instant in a named zone, read through `Intl` so it
 * is independent of the process time zone.
 */
function offsetInZone(instant, zone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    timeZoneName: 'longOffset',
  }).formatToParts(new Date(instant));
  const name = parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
  const match = /GMT(?<sign>[+-])(?<hours>\d{1,2}):?(?<minutes>\d{2})?/.exec(name);

  if (match?.groups === undefined) {
    return 0; // 'GMT' with no offset means UTC.
  }

  const { sign, hours, minutes } = match.groups;

  return (sign === '-' ? -1 : 1) * (Number(hours) * 60 + Number(minutes ?? 0));
}

if (!existsSync(join(root, 'dist', 'index.js'))) {
  console.error('dist/index.js is missing. Run `npm run build` first.');
  process.exit(1);
}

// Runs inside each child process, once per zone.
const CHECKS = /* js */ `
// The specifier must be a file:// URL: on Windows a bare absolute path starts
// with a drive letter, which the ESM loader reads as an unsupported protocol.
import { add, between, endOf, getString, parse, startOf, subtract } from ${JSON.stringify(
  pathToFileURL(join(root, 'dist', 'index.js')).href,
)};

const zone = process.env.TZ;
const failures = [];

// Some platforms ignore a TZ set by the parent process. Comparing the effective
// offsets rather than the zone's name avoids a false alarm when the platform
// reports a legacy spelling: macOS resolves Asia/Kathmandu as Asia/Katmandu.
const expected = process.env.EXPECTED_OFFSETS.split(',').map(Number);
const samples = process.env.SAMPLE_INSTANTS.split(',').map(Number);
const actual = samples.map((instant) => -new Date(instant).getTimezoneOffset());

if (actual.join(',') !== expected.join(',')) {
  console.log(
    '  skip - ' + zone + ' (runtime reported offsets ' + actual + ', expected ' + expected + ')',
  );
  process.exit(0);
}

function check(label, condition, detail) {
  if (!condition) {
    failures.push(detail ? label + ': ' + detail : label);
  }
}

// Every day of a leap year, so both transitions of every zone are covered.
const days = [];
for (let index = 0; index < 366; index += 1) {
  days.push(add(new Date(2024, 0, 1, 12), index, 'day'));
}

for (const day of days) {
  const date = getString(day, 'YYYY-MM-DD');
  const start = startOf(day, 'day');
  const end = endOf(day, 'day');

  check(
    'endOf(day) stays on the same calendar date',
    getString(end, 'YYYY-MM-DD') === date,
    date + ' -> ' + getString(end, 'YYYY-MM-DD HH:mm:ss.SSS'),
  );
  check(
    'startOf(day) stays on the same calendar date',
    getString(start, 'YYYY-MM-DD') === date,
    date + ' -> ' + getString(start, 'YYYY-MM-DD HH:mm:ss.SSS'),
  );
  check(
    'startOf(day) <= the date <= endOf(day)',
    start.getTime() <= day.getTime() && day.getTime() <= end.getTime(),
    date,
  );
  check(
    'consecutive days are exactly one day apart',
    between(day, add(day, 1, 'day'), 'day') === 1,
    date + ' -> ' + between(day, add(day, 1, 'day'), 'day'),
  );
  check(
    'a day added and subtracted returns the same instant',
    subtract(add(day, 1, 'day'), 1, 'day').getTime() === day.getTime(),
    date,
  );
  check(
    'the difference is antisymmetric',
    between(day, add(day, 3, 'day'), 'day') === -between(add(day, 3, 'day'), day, 'day'),
    date,
  );
  check(
    'a rendered timestamp parses back to the same instant',
    parse(getString(day, 'YYYY-MM-DD HH:mm:ss.SSS'), 'YYYY-MM-DD HH:mm:ss.SSS').getTime() ===
      day.getTime(),
    date,
  );
  check(
    'endOf(month) stays inside the month',
    getString(endOf(day, 'month'), 'YYYY-MM') === getString(day, 'YYYY-MM'),
    date,
  );
  check(
    'endOf(year) stays inside the year',
    getString(endOf(day, 'year'), 'YYYY') === getString(day, 'YYYY'),
    date,
  );

  for (let weekStartsOn = 0; weekStartsOn < 7; weekStartsOn += 1) {
    const weekStart = startOf(day, 'week', { weekStartsOn });
    const weekEnd = endOf(day, 'week', { weekStartsOn });

    check(
      'startOf(week) lands on the requested weekday',
      weekStart.getDay() === weekStartsOn,
      date + ' with weekStartsOn ' + weekStartsOn + ' gave day ' + weekStart.getDay(),
    );
    check(
      'the week brackets the date',
      weekStart.getTime() <= day.getTime() && day.getTime() <= weekEnd.getTime(),
      date + ' with weekStartsOn ' + weekStartsOn,
    );
    check(
      'the week spans seven calendar days',
      getString(add(weekStart, 6, 'day'), 'YYYY-MM-DD') === getString(weekEnd, 'YYYY-MM-DD'),
      date + ' with weekStartsOn ' + weekStartsOn,
    );
  }
}

// The truncation invariants, checked across a day rather than only at noon. A
// zone can skip the start of a unit or reach it twice, and both only show up if
// the probe lands in the affected wall clock -- the hour a zone repeats, or the
// 45 minutes Pacific/Chatham jumps over.
//
// Probes come from two directions on purpose. Naming local fields can only ever
// produce the *first* of two instants that share a wall clock, because that is
// how the Date constructor resolves the ambiguity, so a bug in handling the
// second pass is invisible to it. Stepping through elapsed milliseconds
// reaches both.
const UNITS = [
  'millisecond',
  'second',
  'minute',
  'hour',
  'day',
  'week',
  'month',
  'quarter',
  'year',
];

for (const day of days) {
  const midnight = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const probes = [];

  for (const hour of [0, 1, 2, 3, 4, 23]) {
    for (const minute of [0, 45]) {
      // Named wall clock, resolved by the Date constructor.
      probes.push(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 30));
      // The same reading as elapsed time from local midnight, which lands on the
      // far side of a shift the wall-clock form cannot express.
      probes.push(new Date(midnight + (hour * 60 + minute) * 60_000 + 30_000));
    }
  }

  for (const probe of probes) {
    const where = getString(probe, 'YYYY-MM-DD HH:mm:ss') + ' (' + probe.toISOString() + ')';

      for (const unit of UNITS) {
        const unitStart = startOf(probe, unit).getTime();
        const unitEnd = endOf(probe, unit).getTime();

        check(
          'the unit brackets the date it contains',
          unitStart <= probe.getTime() && probe.getTime() <= unitEnd,
          where + ' ' + unit,
        );
        check(
          'startOf is idempotent',
          startOf(new Date(unitStart), unit).getTime() === unitStart,
          where + ' ' + unit,
        );
        check(
          'endOf is idempotent',
          endOf(new Date(unitEnd), unit).getTime() === unitEnd,
          where + ' ' + unit,
        );
        check(
          'the last instant of a unit belongs to that unit',
          startOf(new Date(unitEnd), unit).getTime() === unitStart,
          where + ' ' + unit,
        );
      }
  }
}

// Offset tokens must agree with the runtime, including fractional offsets.
for (const day of [days[0], days[120], days[250], days[365]]) {
  const minutes = -day.getTimezoneOffset();
  const sign = minutes < 0 ? '-' : '+';
  const absolute = Math.abs(minutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const rest = String(absolute % 60).padStart(2, '0');

  check(
    'Z renders the real offset',
    getString(day, 'Z') === sign + hours + ':' + rest,
    getString(day, 'Z') + ' for ' + minutes + ' minutes',
  );
  check(
    'ZZ renders the real offset',
    getString(day, 'ZZ') === sign + hours + rest,
    getString(day, 'ZZ') + ' for ' + minutes + ' minutes',
  );

  // An offset pins the instant, whatever the host zone is: rendering one and
  // reading it back has to land on the same millisecond in Kathmandu (+05:45)
  // and Chatham (+12:45) as in UTC.
  const stamp = 'YYYY-MM-DD HH:mm:ss.SSS Z';
  const compact = 'YYYY-MM-DDTHH:mm:ss.SSSZZ';

  check(
    'Z round-trips the instant',
    parse(getString(day, stamp), stamp).getTime() === day.getTime(),
    getString(day, stamp) + ' read back as ' + parse(getString(day, stamp), stamp).toISOString(),
  );
  check(
    'ZZ round-trips the instant',
    parse(getString(day, compact), compact).getTime() === day.getTime(),
    getString(day, compact) +
      ' read back as ' +
      parse(getString(day, compact), compact).toISOString(),
  );
}

if (failures.length > 0) {
  const unique = [...new Set(failures)];
  console.error('  not ok - ' + zone);
  for (const failure of unique.slice(0, 5)) {
    console.error('      ' + failure);
  }
  if (unique.length > 5) {
    console.error('      ... and ' + (unique.length - 5) + ' more');
  }
  process.exit(1);
}

console.log('  ok - ' + zone);
`;

let failed = 0;
let skipped = 0;

console.log(`zone invariants over ${ZONES.length} zones, 366 days each`);

for (const zone of ZONES) {
  try {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', CHECKS], {
      env: {
        ...process.env,
        TZ: zone,
        SAMPLE_INSTANTS: SAMPLES.join(','),
        EXPECTED_OFFSETS: SAMPLES.map((instant) => offsetInZone(instant, zone)).join(','),
      },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    });

    process.stdout.write(output);

    if (output.includes('skip - ')) {
      skipped += 1;
    }
  } catch {
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} of ${ZONES.length} zones failed.`);
  process.exit(1);
}

if (skipped === ZONES.length) {
  console.error(
    `\nEvery zone was skipped: this runtime ignores a TZ set by the parent process, so the invariants only ever ran in the host zone. The checks themselves did not fail, but they proved nothing about other zones.`,
  );
  process.exit(1);
}

const checked = ZONES.length - skipped;

console.log(
  `\n${checked} of ${ZONES.length} zones hold${skipped > 0 ? `, ${skipped} skipped because the runtime ignored TZ` : ''}.`,
);
