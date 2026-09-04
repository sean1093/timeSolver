// A runnable tour of timeSolver 2.x.
//
//     npm run build && node examples/node.mjs
//
// Both imports resolve through the package's own "exports" map, so what you read
// here is what an installing consumer writes. Output is in your machine's local
// time zone, the only zone this library models.
import {
  add,
  between,
  clamp,
  daysInMonth,
  endOf,
  getAbbrMonth,
  getFullWeek,
  getISOWeek,
  getISOWeekYear,
  getQuarter,
  getString,
  getWeekOfYear,
  isBetween,
  isLeapYear,
  isValid,
  max,
  min,
  parse,
  startOf,
  subtract,
  TimeSolverError,
} from 'timesolver';
import { createProfiler } from 'timesolver/profiler';

const log = (label, value) => console.log(`  ${label.padEnd(46)} ${value}`);
const section = (title) => console.log(`\n${title}`);
const short = (date) => getString(date, 'YYYY-MM-DD HH:mm');
const full = (date) => getString(date, 'YYYY-MM-DD HH:mm:ss.SSS');
const stamp = new Date(2024, 2, 17, 14, 30, 45, 123); // Sunday 17 March 2024
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log(`time zone: ${zone} (${getString(stamp, 'Z')})`);

section('formatting');
log('getString(stamp)', getString(stamp)); // the default format, 'YYYYMMDD'
log("getString(stamp, 'YYYY-MM-DD HH:mm:ss.SSS')", getString(stamp, 'YYYY-MM-DD HH:mm:ss.SSS'));
log("getString(stamp, 'ddd, D MMM YYYY')", getString(stamp, 'ddd, D MMM YYYY'));
log("getString(stamp, 'h:mm a')", getString(stamp, 'h:mm a'));
log("getString(stamp, '[Quarter] Q [of] YYYY')", getString(stamp, '[Quarter] Q [of] YYYY'));
log("getString(stamp, 'YYYY-MM-DD HH:MM:SS')", getString(stamp, 'YYYY-MM-DD HH:MM:SS')); // v1 name

section('strict parsing');
const afternoon = parse('03/17/2024 02:30 PM', 'MM/DD/YYYY hh:mm A');
log("parse('17/03/2024', 'DD/MM/YYYY')", short(parse('17/03/2024', 'DD/MM/YYYY')));
log("parse('03/17/2024 02:30 PM', hh:mm A)", short(afternoon));
try {
  parse('31/02/2024', 'DD/MM/YYYY'); // February has no 31st, so the round trip fails
} catch (error) {
  if (!(error instanceof TimeSolverError)) throw error;
  log("parse('31/02/2024', 'DD/MM/YYYY')", `throws ${error.code}`);
}

section('validation (never throws for bad data)');
log("isValid('2020-01-01')", isValid('2020-01-01'));
log("isValid('nope')", isValid('nope'));
log("isValid('2020-02-29', 'YYYY-MM-DD')", isValid('2020-02-29', 'YYYY-MM-DD'));
log("isValid('31-02-2020', 'DD-MM-YYYY')", isValid('31-02-2020', 'DD-MM-YYYY'));

section('immutable arithmetic');
const january31 = new Date(2024, 0, 31, 12, 0);
const march31 = new Date(2024, 2, 31, 12, 0);
log("add(2024-01-31 12:00, 1, 'month')", short(add(january31, 1, 'month'))); // clamps to Feb 29
log("subtract(2024-03-31 12:00, 1, 'month')", short(subtract(march31, 1, 'month')));
log('the Date passed in is untouched', short(january31));
log("add(stamp, 90, 'minute')", short(add(stamp, 90, 'minute')));

section('calendar ranges');
const isoWeekStart = startOf(stamp, 'week', { weekStartsOn: 1 }); // ISO-8601 starts Monday
log("startOf(stamp, 'week')", full(startOf(stamp, 'week'))); // the default, Sunday
log("startOf(stamp, 'week', { weekStartsOn: 1 })", full(isoWeekStart));
log("startOf(stamp, 'month')", full(startOf(stamp, 'month')));
log("endOf(stamp, 'month')", full(endOf(stamp, 'month')));

section('between: exact elapsed time vs the local calendar');
const shift = transitionDay(2024);
log('daylight-saving transition', shift ? getString(shift, 'YYYY-MM-DD') : 'none in this zone');
const dayStart = startOf(shift ?? new Date(2024, 2, 10, 12), 'day');
const nextDay = add(dayStart, 1, 'day'); // the same wall-clock time, next date
log("that day -> the next, in 'hour'", between(dayStart, nextDay, 'hour')); // 23 or 25 on a shift
log("that day -> the next, in 'day'", between(dayStart, nextDay, 'day')); // always exactly 1
const oneMonth = between(new Date(2020, 0, 1), new Date(2020, 1, 1), 'month');
log("between(2020-01-01, 2020-02-01, 'month')", oneMonth);

section('ranges');
const marchStart = new Date(2024, 2, 1);
const aprilStart = new Date(2024, 3, 1);
const spread = ['2024-03-17T00:00', '2024-01-01T00:00', '2024-12-31T00:00'];
log('isBetween(Mar 15, Mar 1, Apr 1)', isBetween('2024-03-15T12:00', marchStart, aprilStart));
// Bounds default to '[]', so 1 April counts as inside March. Half-open '[)' is what
// back-to-back ranges want: March ends exactly where April begins, no overlap, no gap.
log('isBetween(Apr 1, Mar 1, Apr 1)', isBetween(aprilStart, marchStart, aprilStart));
log("  the same, bounds '[)'", isBetween(aprilStart, marchStart, aprilStart, { bounds: '[)' }));
log('min(Mar 17, Jan 1, Dec 31)', short(min(...spread)));
log('max(Mar 17, Jan 1, Dec 31)', short(max(...spread)));
const clamped = clamp('2024-06-01T00:00', '2024-01-01T00:00', '2024-03-01T00:00');
log('clamp(Jun 1 into Jan 1 .. Mar 1)', short(clamped)); // outside, so the nearest endpoint

section('calendar helpers');
log('getFullWeek(stamp)', getFullWeek(stamp));
log('getAbbrMonth(stamp)', getAbbrMonth(stamp));
log('getQuarter(stamp)', getQuarter(stamp));
log('isLeapYear(2024)', isLeapYear(2024));
log('daysInMonth(2024, 2)', daysInMonth(2024, 2));

section('week numbers');
const boundary = '2024-12-30T12:00'; // a Monday, so ISO week 1 of 2025 has begun
log('getISOWeek(2024-12-30)', getISOWeek(boundary));
log('getISOWeekYear(2024-12-30)', getISOWeekYear(boundary)); // 2025, not 2024
log('getWeekOfYear(2024-12-30)', getWeekOfYear(boundary)); // calendar year, so 53 of 2024
// Always compose the ISO pair. `getString(date, 'YYYY')` here would say 2024-W01,
// labelling the date with a week that ends in the following January.
log('ISO label', `${getISOWeekYear(boundary)}-W${String(getISOWeek(boundary)).padStart(2, '0')}`);

section('profiler');
const profiler = createProfiler();
profiler.start();
for (let i = 0; i < 2_000_000; i += 1) Math.sqrt(i);
profiler.mark('warm up');
for (let i = 0; i < 500_000; i += 1) Math.sqrt(i);
profiler.mark('second pass');
const { total, slowest } = profiler.print();
log('slowest segment', `${slowest.label}, ${slowest.ms.toFixed(3)} of ${total.toFixed(3)} ms`);

/** First noon in `year` whose UTC offset differs from the day before, if any. */
function transitionDay(year) {
  let previous = new Date(year, 0, 1, 12).getTimezoneOffset();
  for (let day = 1; day < 366; day += 1) {
    const probe = new Date(year, 0, 1 + day, 12);
    if (probe.getTimezoneOffset() !== previous) return probe;
    previous = probe.getTimezoneOffset();
  }
  return undefined;
}
