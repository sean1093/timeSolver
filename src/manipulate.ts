import { daysInMonth } from './calendar.js';
import { type DateInput, toDate } from './coerce.js';
import { TimeSolverError } from './errors.js';
import {
  isExactUnit,
  MONTHS_PER_UNIT,
  MS_PER_DAY,
  MS_PER_EXACT_UNIT,
  normalizeUnit,
  type Unit,
  type UnitInput,
} from './units.js';
import {
  DAYS_PER_WEEK,
  daysSinceWeekStart,
  resolveWeekStart,
  type WeekDay,
  type WeekOptions,
} from './week.js';

/**
 * Shift a date by whole calendar months, clamping to the end of the target
 * month. Native `setMonth` overflows instead: v1's `add(Jan 31, 1, 'M')`
 * returned March 2.
 *
 * The target year, month and day are worked out arithmetically and set in one
 * call, so there is no intermediate date to overflow or underflow: reaching the
 * target through `setDate(1)` first made a shift from the very bottom of the
 * representable range unanswerable, because 1 April -271821 is already past it.
 *
 * Returns the Invalid Date when the target itself leaves the range; `add` turns
 * that into an `INVALID_ARGUMENT`. Internal, and exported for `between`, which
 * measures a span and has to be able to ask for an anchor without being
 * interrupted when one does not exist.
 */
export function shiftMonths(date: Date, months: number): Date {
  const targetMonth = date.getMonth() + months;
  const year = date.getFullYear() + Math.floor(targetMonth / MONTHS_PER_UNIT.year);
  // Remainder of a negative month index is negative, so it is folded forward.
  const month =
    ((targetMonth % MONTHS_PER_UNIT.year) + MONTHS_PER_UNIT.year) % MONTHS_PER_UNIT.year;
  const shifted = new Date(date.getTime());

  // No guard for a target outside the range: `setFullYear` yields the Invalid
  // Date, which is what `add` reports on. A year of 1e17 is still an integer,
  // so `daysInMonth` answers it from the calendar rather than refusing.
  shifted.setFullYear(year, month, Math.min(date.getDate(), daysInMonth(year, month + 1)));

  return shifted;
}

/**
 * A shift can leave the range `Date` can represent, roughly 100 million days
 * either side of the epoch. Returning that Invalid Date would defer the failure
 * to whatever touched it next, which is exactly the v1 behaviour this library
 * exists to avoid.
 */
function requireRepresentable(result: Date, amount: number, unit: Unit): Date {
  if (Number.isNaN(result.getTime())) {
    throw new TimeSolverError(
      'INVALID_ARGUMENT',
      `Shifting by ${amount} ${unit}(s) leaves the range a Date can represent.`,
    );
  }

  return result;
}

function requireWholeAmount(amount: number, unit: Unit): void {
  if (!Number.isInteger(amount)) {
    throw new TimeSolverError(
      'INVALID_ARGUMENT',
      // Stryker disable next-line StringLiteral: message text is not API.
      `A ${unit} amount must be a whole number, received ${amount}. Fractional ${unit}s have no fixed length; use hours or days instead.`,
    );
  }
}

/**
 * Add time to a date and return a new `Date`.
 *
 * The input is never modified — v1 mutated the caller's `Date` in place.
 *
 * Millisecond through hour are exact multiples of their length, so fractional
 * amounts are allowed. Day and week follow the local calendar, keeping the
 * wall-clock time across a daylight-saving change. Month, quarter and year are
 * calendar operations that clamp to the last valid day of the target month.
 *
 * @param date - The starting date.
 * @param amount - How much to add. Defaults to `0`. Negative values subtract.
 * @param unit - Any unit alias. Defaults to `'millisecond'`, as in v1.
 * @throws {TimeSolverError} `INVALID_DATE`, `INVALID_UNIT`, or
 *   `INVALID_ARGUMENT` for a non-finite amount, or a fractional amount of a
 *   calendar unit.
 *
 * @example
 * add('2024-01-31', 1, 'MONTH'); // 2024-02-29, not 2024-03-02
 */
export function add(date: DateInput, amount = 0, unit?: UnitInput): Date {
  const resolved = normalizeUnit(unit);
  const target = toDate(date);

  if (!Number.isFinite(amount)) {
    throw new TimeSolverError(
      'INVALID_ARGUMENT',
      `amount must be a finite number, received ${amount}.`,
    );
  }

  if (isExactUnit(resolved)) {
    return requireRepresentable(
      new Date(target.getTime() + amount * MS_PER_EXACT_UNIT[resolved]),
      amount,
      resolved,
    );
  }

  requireWholeAmount(amount, resolved);

  if (resolved === 'day' || resolved === 'week') {
    target.setDate(target.getDate() + amount * (resolved === 'week' ? DAYS_PER_WEEK : 1));
    return requireRepresentable(target, amount, resolved);
  }

  return requireRepresentable(
    shiftMonths(target, amount * MONTHS_PER_UNIT[resolved]),
    amount,
    resolved,
  );
}

/**
 * Subtract time from a date and return a new `Date`.
 *
 * Equivalent to {@link add} with a negated amount; see it for unit semantics.
 */
export function subtract(date: DateInput, amount = 0, unit?: UnitInput): Date {
  return add(date, -amount, unit);
}

/** Truncations, one per unit, applied to a copy of the input date. */
const TRUNCATE: Record<Unit, (date: Date, weekStartsOn: WeekDay) => void> = {
  millisecond: () => {
    // Already the finest granularity a `Date` can express.
  },
  second: (date) => date.setMilliseconds(0),
  minute: (date) => date.setSeconds(0, 0),
  hour: (date) => date.setMinutes(0, 0, 0),
  day: (date) => date.setHours(0, 0, 0, 0),
  week: (date, weekStartsOn) => {
    date.setDate(date.getDate() - daysSinceWeekStart(date, weekStartsOn));
    date.setHours(0, 0, 0, 0);
  },
  month: (date) => {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
  },
  quarter: (date) => {
    date.setMonth(
      Math.floor(date.getMonth() / MONTHS_PER_UNIT.quarter) * MONTHS_PER_UNIT.quarter,
      1,
    );
    date.setHours(0, 0, 0, 0);
  },
  year: (date) => {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  },
};

/**
 * Last instant a `Date` can represent, 100,000,000 days after the epoch. The
 * unit containing it has no successor, so `endOf` reads it as the end of that
 * unit rather than asking for a shift that cannot land.
 */
const MAX_TIME = 8.64e15;

// Mutation testing cannot reach the code from here to the restore below. It is
// exercised by `test/zone-chatham.test.ts` and by `npm run test:zones`, both of
// which need a time zone other than the one the suite pins -- and Stryker's
// Vitest runner hard-codes worker threads, where assigning `process.env.TZ` does
// not take effect, so that file skips under mutation testing. Reverting this
// region and running either of those two commands fails loudly; `npm run
// test:zones` reports the exact zone, date and invariant.
// Stryker disable all

/**
 * Longest each unit can run, in milliseconds, with room for a clock shift. Used
 * only to bound the searches below, so being generous costs a step, never
 * correctness.
 */
const UNIT_BOUND: Record<Unit, number> = {
  millisecond: 1,
  second: 1_000,
  minute: 60_000,
  hour: 2 * 3_600_000,
  day: 25 * 3_600_000,
  week: 8 * MS_PER_DAY,
  month: 32 * MS_PER_DAY,
  quarter: 93 * MS_PER_DAY,
  year: 367 * MS_PER_DAY,
};

/** Truncate an instant and report where it landed. */
function truncatedTime(time: number, unit: Unit, weekStartsOn: WeekDay): number {
  const probe = new Date(time);

  TRUNCATE[unit](probe, weekStartsOn);

  return probe.getTime();
}

/**
 * Earliest instant in `(low, high]` that truncates to `nominal`.
 *
 * The caller guarantees `low` truncates elsewhere and `high` truncates to
 * `nominal`, with one boundary between them, so this converges on the first
 * instant that carried the label -- the moment the unit began.
 */
function runStart(
  from: number,
  to: number,
  unit: Unit,
  weekStartsOn: WeekDay,
  nominal: number,
): number {
  let low = from;
  let high = to;

  while (low + 1 < high) {
    const mid = low + Math.floor((high - low) / 2);

    if (truncatedTime(mid, unit, weekStartsOn) === nominal) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return high;
}

/**
 * Earliest instant in `(low, high]` whose offset matches the one at `high`: the
 * clock shift that separates the two ends. Zones shift at most once a day, so
 * callers keep the window inside one.
 */
function shiftBetween(from: number, to: number): number {
  const offset = new Date(to).getTimezoneOffset();
  let low = from;
  let high = to;

  while (low + 1 < high) {
    const mid = low + Math.floor((high - low) / 2);

    if (new Date(mid).getTimezoneOffset() === offset) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return high;
}

// Stryker restore all

/**
 * Start of the local calendar unit containing a date.
 *
 * @param options - `weekStartsOn` moves the week boundary; it defaults to `0`
 *   (Sunday), matching `Date#getDay`, and is ignored by every other unit.
 *
 * @example
 * startOf('2024-03-17T14:30:45.123', 'day');                    // 2024-03-17T00:00:00.000
 * startOf('2024-03-13', 'week');                                // Sunday 2024-03-10
 * startOf('2024-03-13', 'week', { weekStartsOn: 1 });           // Monday 2024-03-11
 */
export function startOf(date: DateInput, unit: UnitInput, options?: WeekOptions): Date {
  const resolved = normalizeUnit(unit);
  const weekStartsOn = resolveWeekStart(options);
  const target = toDate(date);
  const time = target.getTime();

  // Read before truncating: the same object carries the answer, so the shift
  // check below costs a getter rather than another Date.
  const offsetAtTime = target.getTimezoneOffset();

  TRUNCATE[resolved](target, weekStartsOn);

  const nominal = target.getTime();

  // Stryker disable all: zone-dependent, see the note above UNIT_BOUND.
  // A zone can jump clean over the start of a unit: Pacific/Chatham moves 02:45
  // to 03:45, so local 03:00 never happens there. `Date`'s setters resolve a
  // wall clock inside that gap forwards, landing after the date we were given
  // and inside the following unit. The unit really begins when the clocks
  // shifted, so take the first instant that carried this label.
  if (nominal > time) {
    return new Date(runStart(time - UNIT_BOUND[resolved], time, resolved, weekStartsOn, nominal));
  }

  // Everything below needs a clock shift between the truncated start and the
  // date, so equal offsets settle it. This is the common path.
  if (target.getTimezoneOffset() === offsetAtTime) {
    return target;
  }

  // A shift lies between them, and a wall clock can leave a unit and come back:
  // when Chatham moves 03:45 back to 02:45, local 02:00 to 02:44 happens once
  // while 02:45 to 02:59 happens twice, with local 03:xx in between. The label
  // alone therefore does not say which visit a date belongs to.
  const shift = shiftBetween(Math.max(nominal, time - MS_PER_DAY), time);

  // This visit began after the shift: the shift itself carries another label, so
  // the unit was left and re-entered.
  if (truncatedTime(shift, resolved, weekStartsOn) !== nominal) {
    return new Date(runStart(shift, time, resolved, weekStartsOn, nominal));
  }

  // The label survived the shift unbroken -- an ordinary daylight-saving day, or
  // an hour repeated adjacently the way America/New_York repeats 01:00 -- so the
  // truncated start still stands.
  if (truncatedTime(shift - 1, resolved, weekStartsOn) === nominal) {
    return target;
  }

  // The label began at the shift: this unit's nominal start never happened.
  return new Date(shift);
  // Stryker restore all
}

/**
 * Last representable millisecond of the local calendar unit containing a date.
 *
 * @param options - See {@link startOf}.
 *
 * @example
 * endOf('2024-02-10', 'month');                       // 2024-02-29T23:59:59.999
 * endOf('2024-03-13', 'week', { weekStartsOn: 1 });   // Sunday 2024-03-17T23:59:59.999
 */
export function endOf(date: DateInput, unit: UnitInput, options?: WeekOptions): Date {
  const resolved = normalizeUnit(unit);
  const start = startOf(date, resolved, options);
  const startTime = start.getTime();
  const inUnit = (time: number) =>
    startOf(new Date(time), resolved, options).getTime() === startTime;

  // A unit at the very top of the range has no next unit to step back from:
  // adding one would leave what a `Date` can hold. The unit ends where `Date`
  // does, and the bisection below finds that without asking for the shift.
  // UNIT_BOUND is generous, so this is answered conservatively -- it costs a
  // bisection, never correctness.
  const steppable = startTime + UNIT_BOUND[resolved] <= MAX_TIME;
  // Truncate again after the shift. In a zone whose clocks jump at midnight,
  // startOf('day') is 01:00, so start plus one day is 01:00 the next day and
  // subtracting a millisecond would land on the wrong calendar date.
  const candidate = steppable
    ? startOf(add(start, 1, resolved), resolved, options).getTime() - 1
    : undefined;

  // Stryker disable all: zone-dependent, see the note above UNIT_BOUND.
  if (candidate !== undefined) {
    const last = new Date(candidate);

    // A unit whose start and end share an offset ran without a clock shift at
    // either boundary, so the wall-clock arithmetic above was exact. This is
    // the common case, including an ordinary daylight-saving day: the shift
    // happens inside the day, not at the boundary that defines it.
    if (candidate >= startTime && start.getTimezoneOffset() === last.getTimezoneOffset()) {
      return last;
    }

    // Otherwise confirm the candidate really is the last instant of this unit:
    // in it, with the next millisecond outside. Where the clocks repeat a wall
    // clock the unit is entered twice under one name, and the first visit ends
    // early -- at the shift, not a nominal unit later.
    if (candidate >= startTime && inUnit(candidate) && !inUnit(candidate + 1)) {
      return last;
    }
  }

  // Find where this visit actually ended. Membership holds over one run from
  // the start, so the last instant of it is one bisection away.
  let low = startTime;
  let high = Math.min(startTime + UNIT_BOUND[resolved], MAX_TIME);

  // The unit runs to the end of the range, so there is no instant outside it to
  // bisect towards.
  if (inUnit(high)) {
    return new Date(high);
  }

  while (low + 1 < high) {
    const mid = low + Math.floor((high - low) / 2);

    if (inUnit(mid)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return new Date(low);
  // Stryker restore all
}
