import { TimeSolverError } from './errors.js';

/** Anything this library accepts where a date is expected. */
export type DateInput = Date | string | number;

/**
 * `instanceof` is realm-bound: a `Date` handed over from an iframe, a worker,
 * or a `node:vm` context has a different prototype and fails it. The internal
 * class tag is the same in every realm.
 */
function isDate(input: unknown): input is Date {
  return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
}

function describe(input: unknown): string {
  if (typeof input === 'string') {
    return JSON.stringify(input);
  }
  if (isDate(input)) {
    return 'an Invalid Date';
  }
  if (input === null) {
    return 'null';
  }
  if (typeof input === 'number') {
    return String(input);
  }
  return typeof input;
}

/**
 * Convert an input to a fresh, valid `Date`.
 *
 * Always returns a copy, which is what makes every public function immutable:
 * v1 handed the caller's own `Date` to `setDate()` and mutated it in place.
 *
 * @param input - A `Date`, an epoch millisecond count, or a string `Date` can parse.
 * @throws {TimeSolverError} `INVALID_DATE` for invalid, out-of-range, or non-date input.
 */
export function toDate(input: DateInput): Date {
  if (isDate(input) || typeof input === 'number' || typeof input === 'string') {
    const date = isDate(input) ? new Date(input.getTime()) : new Date(input);

    if (Number.isNaN(date.getTime())) {
      throw new TimeSolverError('INVALID_DATE', `Cannot read a date from ${describe(input)}.`);
    }

    return date;
  }

  throw new TimeSolverError('INVALID_DATE', `Cannot read a date from ${describe(input)}.`);
}
