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
import { fileURLToPath } from 'node:url';

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

if (!existsSync(join(root, 'dist', 'index.js'))) {
  console.error('dist/index.js is missing. Run `npm run build` first.');
  process.exit(1);
}

// Runs inside each child process, once per zone.
const CHECKS = /* js */ `
import { add, between, endOf, getString, parse, startOf, subtract } from ${JSON.stringify(
  join(root, 'dist', 'index.js'),
)};

const zone = process.env.TZ;
const failures = [];

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

console.log(`zone invariants over ${ZONES.length} zones, 366 days each`);

for (const zone of ZONES) {
  try {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', CHECKS], {
      env: { ...process.env, TZ: zone },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    process.stdout.write(output);
  } catch {
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} of ${ZONES.length} zones failed.`);
  process.exit(1);
}

console.log(`\nall ${ZONES.length} zones hold.`);
